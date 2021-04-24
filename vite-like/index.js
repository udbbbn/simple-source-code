#!/usr/bin/env node

const Koa = require('koa');
const send = require('koa-send');
const path = require('path')
const compiler = require('@vue/compiler-sfc');
const { Readable } = require('stream');

const app = new Koa();
const MODULES = '/@modules/';

// 3. 处理形如 /@modules/ 的第三方模块
// 该中间件必须优于 web服务器
// 作用为 寻找形如 @modules/vue 模块的实际路径 并修改 path 返回给前端
app.use(async (ctx, next) => {
    if (ctx.path.startsWith(MODULES)) {
        const moduleName = ctx.path.substr(MODULES.length);
        const pgkPath = path.join(process.cwd(), 'node_modules', moduleName, 'package.json')
        const pkg = require(pgkPath);
        // 导入 package.json 并读取 json 中的 module 字段
        ctx.path = path.join('/node_modules', moduleName, pkg.module)
    }
    await next()
})

// 1. 启动web服务
app.use(async (ctx, next) => {
    await send(ctx, ctx.path, { root: process.cwd(), index: 'index.html' });
    await next()
})

// 引入 @vue/compiler-sfc 模块 用于处理 vue单文件组件
app.use(async (ctx, next) => {
    // 处理文件后缀为 vue 的文件
    if (ctx.path.endsWith('.vue')) {
        const content = await streamToString(ctx.body);
        // @vue/compiler-sfc 返回 { descriptor, errors }
        const { descriptor } = compiler.parse(content);
        let code;
        // 首次处理单文件的时候是不会存在 type 的
        if (!ctx.query.type) {
            // 这一串字符串是根据 vue 编译结果来编写
            code = descriptor.script.content;
            code = code.replace(/export default/g, 'const __script = ');
            code += `
                import { render as __render } from "${ctx.path}?type=template"
                __script.render = __render
                export default __script
            `
        } else if (ctx.query.type === 'template') {
            // type = script | template | style
            const render = compiler.compileTemplate({
                source: descriptor.template.content
            });
            code = render.code
        }
        // request 时 Content-Type: application/octet-stream
        // reponse 时 修改为 application/javascript
        ctx.type = 'application/javascript';
        ctx.body = stringToStream(code);
    }
    await next()
})

// 2. 替换请求路径 
app.use(async (ctx, next) => {
    if (ctx.type === 'application/javascript') {
        const content = await streamToString(ctx.body);
        // Relative references must start with either "/", "./", or "../".
        // 支持 ESM 的浏览器仅支持以上三种路径
        // (from\s+['"]) => from + (任何空白字符) + (' 或 ")
        // ([^\.\/]+) => 除了 . 跟 /
        // 'vue' => '@modules/vue'
        ctx.body = content.replace(/(from\s+['"])([^\.\/]+)/g, '$1/@modules/$2')
    }
})

// 将数据流转字符串
const streamToString = stream => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    stream.on('error', reject)
})

const stringToStream = text => {
    const stream = new Readable();
    stream.push(text);
    stream.push(null);
    return stream
}

app.listen(3000);

console.log('Serve running http://localhost:3000')