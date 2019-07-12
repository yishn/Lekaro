import {h, Component} from 'preact'
import {useMemo} from 'preact/hooks'
import {Duration} from 'luxon'
import * as time from '../time.js'
import LocationInfo from './LocationInfo.js'
import WeatherTimeline, {getPlaceholderProps} from './WeatherTimeline.js'
import WeatherDetails from './WeatherDetails.js'

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

  get title() {
    let result = ''

    if (!this.props.error) {
      let {city, state, country} = this.props.locationInfo.address || {}
      result += `${[city, state, country].filter(x => !!x).join(', ')}`

      if (result.trim() !== '') result += ' - '
    }

    return result + 'Lekaro Weather'
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

    let getColumnFromTimestamp = (timestamp, precise = false) => {
      if (!forecastData.hourly || timestamp < forecastData.hourly[0].time) return 0
      if (timestamp > forecastData.hourly.slice(-1)[0].time) return forecastData.hourly.length

      let column = forecastData.hourly.findIndex(y => timestamp < y.time)
      if (column < 0) column = forecastData.hourly.length

      let minute = 0

      if (precise) {
        let date = new Date(timestamp * 1000)
        minute = date.getMinutes()
      }

      return column - 1 + minute / 60
    }

    let hourlyTimestamps = (forecastData.hourly || []).map(entry => entry.time)
    let dailyTimestamps = (forecastData.daily || []).map(entry => entry.time)

    let hourlyTimes = useMemo(() => {
      return hourlyTimestamps.map(timestamp =>
        time.fromUnixTimestamp(timestamp, forecastData.timezone)
      )
    }, [...hourlyTimestamps, forecastData.timezone])

    let dailyTimes = useMemo(() => {
      return dailyTimestamps.map(timestamp =>
        time.fromUnixTimestamp(timestamp, forecastData.timezone)
      )
    }, [...dailyTimestamps, forecastData.timezone])

    let nightColumns = forecastData.daily && forecastData.hourly &&
      [...forecastData.daily, null]
      .map((entry, i, entries) => ({
        key: (
          entries[i - 1] != null ? dailyTimes[i - 1]
          : entry != null ? dailyTimes[i].minus(Duration.fromObject({days: 1}))
          : 0
        ).toFormat('DDD'),

        moonPhase: (entries[i - 1] || entry).moonPhase,
        ...(
          entry == null ? {
            start: getColumnFromTimestamp(
              entries[i - 1] == null ? 0
                : entries[i - 1].sunsetTime != null ? entries[i - 1].sunsetTime
                : entries[i - 1].time,
              true
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
          .map(timestamp => getColumnFromTimestamp(timestamp, true))
          .reduce((acc, x, i) => {
            acc[i === 0 ? 'start' : 'end'] = x
            return acc
          }, {})
        )
      }))
      .filter(({start, end}) => start !== end)

    let hourLabels = forecastData.hourly &&
      forecastData.hourly.map((_, i) => {
        if (i === 0) return 'Now'

        let hour = hourlyTimes[i].toFormat('h')
        return i === 1 || hour % 2 === 1 ? '' : hour
      })

    let dayLabels = dailyTimes &&
      dailyTimes
      .map((t, i) => i === 0 ? hourlyTimes[0] : t)
      .map(dateTime => {
        let x = getColumnFromTimestamp(dateTime.toMillis() / 1000)

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

    let selectedColumn = getColumnFromTimestamp(selectedTime)
    let selectedHour = forecastData.hourly && forecastData.hourly[selectedColumn]

    let selectedHourPrecipitation = selectedHour && forecastData.precipitation && (() => {
      let entries = forecastData.precipitation
        .filter(entry =>
          selectedHour.time <= entry.time
          && entry.time < (
            forecastData.hourly[selectedColumn + 1]
            ? forecastData.hourly[selectedColumn + 1].time
            : selectedHour.time + 24 * 60 * 60
          )
        )

      let max = key => {
        let result = Math.max(...entries.filter(x => x[key] != null).map(x => x[key]))
        return isFinite(result) ? result : undefined
      }

      return {
        intensity: max('intensity'),
        accumulation: max('accumulation'),
        probability: max('probability'),
        type: (Object.entries(
          entries
          .filter(x => x.type != null)
          .map(x => x.type)
          .reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {})
        ).find(([_, count], __, arr) =>
          arr.every(([_, count2]) => count >= count2)
        ) || {})[0]
      }
    })() || {}

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
          selectedColumn={selectedColumn}
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

          humidity={
            forecastData.hourly
            && forecastData.hourly.map(entry => entry.humidity)
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
              x: i === 0 ? 0 : getColumnFromTimestamp(entry.time, true),
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

      {!error && selectedHour &&
        <WeatherDetails
          units={unitsData[units]}

          temperature={selectedHour.temperature}
          apparentTemperature={selectedHour.apparentTemperature}
          dewPoint={selectedHour.dewPoint}
          humidity={selectedHour.humidity}
          ozone={selectedHour.ozone}
          pressure={selectedHour.pressure}
          windBearing={selectedHour.windBearing}
          windSpeed={selectedHour.windSpeed}
          windGust={selectedHour.windGust}
          visibility={selectedHour.visibility}
          precipProbability={selectedHourPrecipitation.probability}
          precipType={selectedHourPrecipitation.type}
          precipIntensity={selectedHourPrecipitation.intensity}
          precipAccumulation={selectedHourPrecipitation.accumulation}
        />
      }
    </div>
  }
}
