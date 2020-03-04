import {stringify as qs} from 'querystring'
import {h, Component} from 'preact'
import * as geolocation from '../geolocation.js'

export default class StateContainer extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      error: true,
      locationInfo: {},
      forecastData: {},
      units: localStorage.getItem('lekaro.units') || 'si',
      selectedTime: Math.round(Date.now() / 1000)
    }
  }

  loadForecastFromURL = async (options = {}) => {
    let {hash} = window.location

    if (hash != null && hash.length > 1) {
      if (hash.slice(1) === 'error') {
        return this.setState({
          error: true
        })
      } else {
        let coordinates = hash
          .slice(1)
          .split(',')
          .slice(0, 2)
          .reverse()
        await this.loadForecast({coordinates, ...options})
      }
    } else {
      await this.loadForecast(options)
    }
  }

  loadForecast = async ({
    name,
    coordinates,
    units = this.state.units,
    replaceHistory = false,
    pushHistory = true
  } = {}) => {
    this.setState({loading: true})

    if (name == null && coordinates == null) {
      // Get current location

      try {
        coordinates = await geolocation.current()
      } catch (err) {
        name = 'Heidelberg'
      }
    }

    // Determine location

    let locationInfo =
      name != null
        ? await geolocation.get(name, {language: 'en-US'})
        : coordinates != null
        ? await geolocation.reverse(coordinates, {language: 'en-US'})
        : null

    let historyMethod = replaceHistory
      ? 'replaceState'
      : pushHistory
      ? 'pushState'
      : null

    try {
      if (coordinates == null) {
        coordinates = locationInfo.coordinates
      }

      let response = await fetch(
        `/forecast?${qs({
          lat: coordinates[1],
          lon: coordinates[0],
          units
        })}`
      )

      if (!response.ok) throw new Error()

      let {info, forecast} = await response.json()

      if (historyMethod != null) {
        history[historyMethod](
          null,
          '',
          `#${info.coordinates.reverse().join(',')}`
        )
      }

      this.setState({
        loading: false,
        error: false,
        locationInfo,
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

  refreshForecast = async (options = {}) => {
    await this.loadForecastFromURL({pushHistory: false, ...options})
  }

  selectTime = timestamp => {
    this.setState({selectedTime: timestamp})
  }

  selectUnits = async units => {
    if (units !== this.state.units) {
      await this.refreshForecast({units})

      localStorage.setItem('lekaro.units', units)
      this.setState({units})
    }
  }

  render() {
    let Component = this.props.component

    return (
      <Component ref={x => (window.App = x)} actions={this} {...this.state} />
    )
  }
}
