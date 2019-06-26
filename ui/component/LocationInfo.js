import {h, Component} from 'preact'
import classnames from 'classnames'
import CurrentLocationIcon from '../resources/location.svg'

export default class LocationInfo extends Component {
  constructor(props) {
    super(props)

    this.state = {
      prevLoading: false,
      prevCity: null,
      prevState: null,
      prevCountry: null,
      input: ''
    }
  }

  static getDerivedStateFromProps(props, state) {
    let result = {
      prevLoading: props.loading,
      prevCity: props.city,
      prevState: props.state,
      prevCountry: props.country,
    }

    if (
      props.city !== state.prevCity
      || props.state !== state.prevState
      || props.country !== state.prevCountry
      || !props.loading && state.prevLoading
    ) {
      result = {
        ...result,
        input: props.city || props.state || props.country
      }
    }

    return result
  }

  handleInputInput = evt => {
    this.setState({
      input: evt.currentTarget.value
    })
  }

  handleInputKeyDown = evt => {
    if (evt.key === 'Enter') {
      let {onSearch = () => {}} = this.props
      onSearch({value: this.state.input})
    }
  }

  handleInputBlur = () => {
    if (!this.props.loading) {
      this.setState({
        input: this.props.city || this.props.state || this.props.country
      })
    }
  }

  handleCurrentLocationClick = evt => {
    evt.preventDefault()

    let {onCurrentLocationClick = () => {}} = this.props
    onCurrentLocationClick(evt)
  }

  render() {
    let {inputRef, loading, state, country} = this.props

    return <div class={classnames('location-info', {loading})}>
      <h2>
        <input
          ref={inputRef}

          disabled={loading}
          value={this.state.input}
          placeholder="Location"
          autofocus={!this.state.input}

          onInput={this.handleInputInput}
          onKeyDown={this.handleInputKeyDown}
          onBlur={this.handleInputBlur}
        />
      </h2>

      <div class="toolbar">
        <a
          class="currentlocation"
          href="#"
          title="Current Location"
          onClick={this.handleCurrentLocationClick}
        >
          <CurrentLocationIcon viewBox="0 0 24 24"/>
        </a>{' '}

        <h3>{([state, country].filter(x => !!x).join(', ') || 'Unknown')}</h3>
      </div>
    </div>
  }
}
