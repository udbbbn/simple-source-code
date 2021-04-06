import { ReactDom } from './src'
import * as React from './src'
import Component from './src/component'
import Child from './demo/child'

const Welcome = <h1>Hello, react-like</h1>

export const MyContext = React.createContext({ a: 'test' })

class App extends Component<any, any> {
    constructor(props) {
        super(props)
        this.state = {
            count: 0
        }
    }

    componentWillMount() {
        console.log('componentWillMount #test dom:', document.querySelector('#test'))
    }

    componentDidMount() {
        console.log('componentDidMount #test dom:', document.querySelector('#test'))
        this.setState({ count: Math.random() })
    }

    render() {
        return (
            <div id="test">
                Hello, react-like {this.state.count}
                <React.Fragment key="fragment">
                    <div key='hello'>hello</div>
                    fragment
                </React.Fragment>
                <div
                    onClick={() =>
                        this.setState({
                            count: Math.random()
                        })
                    }
                >
                    random Count
                </div>
                <MyContext.Provider value={{ a: this.state.count }}>
                    <Child></Child>
                </MyContext.Provider>
            </div>
        )
    }
}

ReactDom.render(<App />, document.querySelector('#root'))
