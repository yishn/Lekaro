import {h, Component} from 'preact'

export default class StateContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  render() {
    let Component = this.props.component

    return <Component ref={x => x.actions = this}/>
  }
}
