import {h, Component} from 'preact'
import {DateTime} from 'luxon'
import LocationInfo from './LocationInfo.js'
import WeatherTimeline from './WeatherTimeline.js'

export default class App extends Component {
  get title() {
    let {city, state, country} = this.props.locationInfo.address || {}
    let result = `${[city, state, country].filter(x => !!x).join(', ')}`

    if (result.trim() !== '') result += ' - '
    result += 'Lekaro Weather'

    return result
  }

  componentDidMount() {
    // Load forecast

    this.actions.loadForecastFromURL()

    // Handle events

    window.addEventListener('popstate', () => {
      this.actions.loadForecastFromURL({pushHistory: false})
    })
  }

  componentDidUpdate() {
    document.title = this.title
  }

  handleSearch = evt => {
    this.actions.loadForecast({name: evt.value})
  }

  handleCurrentLocationClick = () => {
    this.actions.loadForecast()
  }

  render() {
    let {loading, locationInfo, forecastData} = this.props

    let hourLabels = forecastData.hourly
      && forecastData.hourly.map((entry, i) =>
        i === 0 ? 'Now'
        : i % 2 === 1 ? ''
        : DateTime
          .fromSeconds(entry.time, {zone: forecastData.timezone})
          .toFormat('h')
          .toLowerCase()
      )

    return <div class="lekaro-app">
      <h1>Lekaro Weather</h1>

      <LocationInfo
        loading={loading}
        city={locationInfo.address && locationInfo.address.city}
        state={locationInfo.address && locationInfo.address.state}
        country={locationInfo.address && locationInfo.address.country}

        onSearch={this.handleSearch}
        onCurrentLocationClick={this.handleCurrentLocationClick}
      />

      <WeatherTimeline
        labels={hourLabels}
        cloudCover={
          forecastData.hourly && forecastData.hourly.map(entry => entry.cloudCover)
        }
        temperature={
          forecastData.hourly && forecastData.hourly.map(entry => entry.temperature)
        }
        apparentTemperature={
          forecastData.hourly && forecastData.hourly.map(entry => entry.apparentTemperature)
        }
      />
    </div>
  }
}
