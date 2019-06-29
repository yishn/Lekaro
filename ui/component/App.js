import {h, Component} from 'preact'
import * as time from '../time.js'
import LocationInfo from './LocationInfo.js'
import WeatherTimeline, { getPlaceholderProps } from './WeatherTimeline.js'

const unitsData = {
  'si': {
    precipitation: {
      intensity: 'mm/h',
      accumulation: 'cm'
    },
    temperature: '°C',
    apparentTemperature: '°C',
    dewPoint: '°C',
    windSpeed: 'm/s',
    windGust: 'm/s',
    ozone: 'DU',
    pressure: 'hPa',
    visibility: 'km'
  },
  'us': {
    precipitation: {
      intensity: 'iph',
      accumulation: 'in'
    },
    temperature: '°F',
    apparentTemperature: '°F',
    dewPoint: '°F',
    windSpeed: 'mph',
    windGust: 'mph',
    ozone: 'DU',
    pressure: 'mb',
    visibility: 'mi'
  }
}

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

    this.actions.loadForecastFromURL({replaceHistory: true})

    // Handle events

    window.addEventListener('popstate', () => {
      this.actions.loadForecastFromURL({pushHistory: false})
    })
  }

  componentDidUpdate(prevProps) {
    document.title = this.title

    if (prevProps.loading && !this.props.loading && this.props.error) {
      this.inputElement.focus()
    }
  }

  handleSearch = evt => {
    this.actions.loadForecast({name: evt.value})
  }

  handleCurrentLocationClick = () => {
    this.actions.loadForecast()
  }

  handleTimelineWrapperWheel = evt => {
    if (evt.deltaY !== 0) {
      evt.preventDefault()

      evt.currentTarget.scrollLeft += evt.deltaY
    }
  }

  handleColumnClick = evt => {
    let {forecastData} = this.props

    this.actions.selectTime(forecastData.hourly[evt.column].time)
  }

  render() {
    let {loading, error, locationInfo, forecastData, units, selectedTime} = this.props

    let getColumnFromTimestamp = timestamp => {
      if (!forecastData.hourly || timestamp < forecastData.hourly[0].time) return 0
      if (timestamp > forecastData.hourly.slice(-1)[0].time) return forecastData.hourly.length

      let dateTime = time.fromUnixTimestamp(timestamp, forecastData.timezone)
      let column = forecastData.hourly.findIndex(y => timestamp < y.time)
      if (column < 0) column = forecastData.hourly.length

      return column - 1 + dateTime.minute / 60
    }

    let nightColumns = forecastData.daily && forecastData.hourly &&
      [...forecastData.daily, null]
      .map((entry, i, entries) => ({
        key: time.fromUnixTimestamp(
          entries[i - 1] != null ? entries[i - 1].time
            : entry != null ? entry.time - 24 * 60 * 60
            : 0,
          forecastData.timezone
        ).toFormat('DDD'),

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

    let hourLabels = forecastData.hourly &&
      forecastData.hourly.map((entry, i) => {
        let hour = time.fromUnixTimestamp(entry.time, forecastData.timezone).toFormat('h')

        return i === 0 ? 'Now'
          : i === 1 || hour % 2 === 1 ? ''
          : hour
      })

    let dayLabels = forecastData.daily &&
      forecastData.daily
      .map((entry, i) => i === 0 ? forecastData.hourly[0].time : entry.time)
      .map(timestamp => time.fromUnixTimestamp(timestamp, forecastData.timezone))
      .map(dateTime => {
        let x = Math.floor(getColumnFromTimestamp(dateTime.toMillis() / 1000))

        return {
          key: dateTime.toFormat('DDD'),
          x,
          type: nightColumns.some(({start, end}) => start <= x && x <= end) ? 'night' : 'day',
          label: dateTime.toFormat('cccc d')
        }
      })
      .filter(({x}, i, arr) =>
        i === 0 ? arr[i + 1] && arr[i + 1].x - x >= 6
        : i === arr.length - 1 ? hourLabels.length - x >= 6
        : true
      )

    return <div class="lekaro-app">
      <h1>Lekaro Weather</h1>

      <LocationInfo
        inputRef={el => this.inputElement = el}

        loading={loading}
        city={error ? '' : locationInfo.address && locationInfo.address.city}
        state={error ? '' : locationInfo.address && locationInfo.address.state}
        country={error ? '' : locationInfo.address && locationInfo.address.country}

        onSearch={this.handleSearch}
        onCurrentLocationClick={this.handleCurrentLocationClick}
      />

      <div class="timeline-wrapper" onWheel={this.handleTimelineWrapperWheel}>
        {!error ? <WeatherTimeline
          selectedColumn={Math.floor(getColumnFromTimestamp(selectedTime))}
          units={unitsData[units]}
          labels={dayLabels}
          tickLabels={hourLabels}
          nightColumns={nightColumns}

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

          dewPoint={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.dewPoint)
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

          onColumnClick={this.handleColumnClick}
        />
        : <WeatherTimeline {...getPlaceholderProps()} style={{opacity: .5}}/>}
      </div>
    </div>
  }
}
