import {h, Component} from 'preact'
import {getCurrentCoordinates} from '../geolocation.js'

export default class StateContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      error: true,
      locationInfo: {},
      forecastData: {},
      units: 'si',
      selectedTime: Math.round(new Date().getTime() / 1000)
    }
  }

  loadForecastFromURL = (options = {}) => {
    let {hash} = window.location

    if (hash != null && hash.length > 1) {
      if (hash.slice(1) === 'error') {
        return this.setState({
          error: true
        })
      } else {
        let coordinates = hash.slice(1).split(',').slice(0, 2).reverse()
        this.loadForecast({coordinates, ...options})
      }
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
    let historyMethod = replaceHistory ? 'replaceState'
      : pushHistory ? 'pushState'
      : null
    let url = name != null
      ? `/forecast?name=${enc(name)}`
      : `/forecast?lat=${enc(coordinates[1])}&lon=${enc(coordinates[0])}`

    try {
      let response = await fetch(`${url}&units=${enc(this.state.units)}&language=en-US`)
      if (!response.ok) throw new Error()

      let {info, forecast} = await response.json()

      if (historyMethod != null) {
        history[historyMethod](null, '', `#${info.coordinates.reverse().join(',')}`)
      }

      this.setState({
        loading: false,
        error: false,
        locationInfo: info,
        forecastData: forecast
      })
    } catch (err) {
      if (historyMethod != null) {
        history[historyMethod](null, '', `#error`)
      }

      this.setState({
        loading: false,
        error: true
      })
    }
  }

  selectTime = timestamp => {
    this.setState({selectedTime: timestamp})
  }

  selectUnits = units => {
    this.setState({units})
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
