import * as React from '../src/index'
import { MyContext } from '..'

export default function Child() {
    return (
        <div>
            <MyContext.Consumer>
                {val => {
                    console.log('context', val)
                    return <div> context: {val.a}</div>
                }}
            </MyContext.Consumer>
        </div>
    )
}
