import { ReactDom } from './src'
import * as React from './src'
import Component from './src/component'

const Welcome = <h1>Hello, react-like</h1>

class App extends Component {
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
                <React.Fragment>
                    <div>hello</div>
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
            </div>
        )
    }
}

ReactDom.render(<App />, document.querySelector('#root'))
