import {h, Component} from 'preact'
import {getCurrentCoordinates} from '../geolocation';

export default class StateContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      error: false,
      locationInfo: {},
      forecastData: {},
      units: 'us'
    }
  }

  loadForecast = async name => {
    let url

    this.setState({loading: true})

    if (name == null) {
      // Get current location

      try {
        let [lon, lat] = await getCurrentCoordinates()

        url = `/forecast?lon=${lon}&lat=${lat}`
      } catch (err) {
        url = `/forecast?name=Heidelberg`
      }
    } else {
      url = `/forecast?name=${encodeURIComponent(name)}`
    }

    try {
      let response = await fetch(`${url}&units=${encodeURIComponent(this.state.units)}`)
      if (!response.ok) throw new Error()

      let {info, forecast} = await response.json()

      this.setState({
        loading: false,
        locationInfo: info,
        forecastData: forecast
      })
    } catch (err) {
      this.setState({
        loading: false,
        error: true
      })
    }
  }

  render() {
    let Component = this.props.component

    return <Component
      {...this.state}

      ref={x => {
        x.actions = this
        window.App = x
      }}
    />
  }
}
