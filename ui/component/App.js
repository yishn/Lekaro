import {h, Component} from 'preact'
import * as time from '../time.js'
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

    let getColumnFromTimestamp = timestamp => {
      if (timestamp < forecastData.hourly[0].time) return 0
      if (timestamp > forecastData.hourly.slice(-1)[0].time) return forecastData.hourly.length

      let dateTime = time.fromUnixTimestamp(timestamp, forecastData.timezone)
      let column = forecastData.hourly.findIndex(y => timestamp < y.time)
      if (column < 0) column = forecastData.hourly.length

      return column - 1 + dateTime.minute / 60
    }

    let hourLabels = forecastData.hourly
      && forecastData.hourly.map((entry, i) => {
        let hour = time.fromUnixTimestamp(entry.time, forecastData.timezone).toFormat('h')

        return i === 0 ? 'Now'
          : i === 1 || hour % 2 === 1 ? ''
          : hour
      })

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

      <div class="timeline-wrapper">
        <WeatherTimeline
          nightColumns={
            forecastData.daily
            && forecastData.hourly
            && [...forecastData.daily, null]
              .map((entry, i, entries) => ({
                moonPhase: (entries[i - 1] || entry).moonPhase,
                ...(
                  entry == null ? {
                    start: getColumnFromTimestamp(
                      entries[i - 1] == null ? 0
                        : entries[i - 1].sunsetTime != null ? entries[i - 1].sunsetTime
                        : entries[i - 1].time
                    ),
                    end: forecastData.hourly.length
                  }
                  : (
                    entry.sunriseTime == null
                      ? [entry.time, (entries[i + 1] || {}).time || entry.time + 24 * 60 * 60]
                    : i === 0
                      ? [entry.time, entry.sunriseTime]
                    : entries[i - 1].sunsetTime != null
                      ? [entries[i - 1].sunsetTime, entry.sunriseTime]
                    : [entry.time, entry.sunriseTime]
                  )
                  .map(getColumnFromTimestamp)
                  .reduce((acc, x, i) => {
                    acc[i === 0 ? 'start' : 'end'] = x
                    return acc
                  }, {})
                )
              }))
              .filter(({start, end}) => start !== end)
          }
          ticksLabels={hourLabels}
          uvIndex={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.uvIndex)
          }
          cloudCover={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.cloudCover)
          }
          temperature={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.temperature)
          }
          apparentTemperature={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.apparentTemperature)
          }
          precipitation={
            forecastData.precipitation
            && forecastData.hourly
            && forecastData.precipitation.map((entry, i) => ({
              x: i === 0 ? 0 : getColumnFromTimestamp(entry.time),
              intensity: entry.intensity,
              accumulation: entry.accumulation,
              probability: entry.probability,
              type: entry.type
            }))
          }
        />
      </div>
    </div>
  }
}
