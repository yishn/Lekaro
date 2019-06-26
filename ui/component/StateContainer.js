import {h, Component} from 'preact'
import {getCurrentCoordinates} from '../geolocation.js'

export default class StateContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true,
      error: false,
      locationInfo: {},
      forecastData: {},
      units: 'si'
    }
  }

  loadForecastFromURL = (options = {}) => {
    let {hash} = window.location

    if (hash != null && hash.length > 1) {
      let coordinates = hash.slice(1).split(',').slice(0, 2).reverse()
      this.loadForecast({coordinates, ...options})
    } else {
      this.loadForecast(options)
    }
  }

  loadForecast = async ({name, coordinates, replaceHistory = false, pushHistory = true} = {}) => {
    this.setState({loading: true})

    if (name == null && coordinates == null) {
      // Get current location

      try {
        coordinates = await getCurrentCoordinates()
      } catch (err) {
        name = 'Heidelberg'
      }
    }

    let enc = encodeURIComponent
    let url = name != null
      ? `/forecast?name=${enc(name)}`
      : `/forecast?lat=${enc(coordinates[1])}&lon=${enc(coordinates[0])}`

    try {
      let response = await fetch(`${url}&units=${enc(this.state.units)}&language=en-US`)
      if (!response.ok) throw new Error()

      let {info, forecast} = await response.json()

      if (replaceHistory) {
        history.replaceState(null, '', `#${info.coordinates.reverse().join(',')}`)
      } else if (pushHistory) {
        history.pushState(null, '', `#${info.coordinates.reverse().join(',')}`)
      }

      this.setState({
        loading: false,
        error: false,
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
