import request from 'request'
import config from '../config.js'

async function darkSkyRequest(path, options = {}) {
  console.log('info: Request Dark Sky', path, options)

  return await new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://api.darksky.net/forecast/${config.darkSkyApiKey}/`,
      qs: options,
      json: true,
      gzip: true
    }, (err, response, body) => {
      err != null ? reject(err)
      : response.statusCode < 200 || response.statusCode >= 300 ? reject(new Error(body.error))
      : resolve(body)
    })
  })
}

function transformDarkSkyResponse(response) {
  let {currently, minutely, hourly, daily} = response
  if (minutely == null) minutely = {data: []}

  minutely.data = minutely.data.filter(entry => entry.time > currently.time)
  hourly.data = hourly.data.filter(entry => entry.time > currently.time)

  let extract = (keys, obj) => keys.reduce((acc, key) => (acc[key] = obj[key], acc), {})

  let precipitation = [
    currently,
    ...minutely.data,
    ...(
      minutely.data.length === 0 ? hourly.data
      : hourly.data.filter(entry => entry.time > minutely.data.slice(-1)[0].time)
    )
  ]
  .map(entry => ({
    time: entry.time,
    intensity: entry.precipIntensity,
    intensityError: entry.precipIntensityError,
    accumulation: entry.precipAccumulation,
    probability: entry.precipProbability,
    type: entry.precipType
  }))

  return {
    license: 'Powered by Dark Sky',
    timezone: response.timezone,
    precipitation,
    hourly: [currently, ...hourly.data]
      .map(entry => extract([
        'time',
        'icon',
        'temperature',
        'apparentTemperature',
        'dewPoint',
        'humidity',
        'pressure',
        'windSpeed',
        'windGust',
        'windBearing',
        'cloudCover',
        'uvIndex',
        'visibility',
        'ozone'
      ], entry)),

    daily: daily.data
      .map(entry => extract([
        'time',
        'summary',
        'icon',
        'sunriseTime',
        'sunsetTime',
        'moonPhase'
      ], entry))
      .map((entry, i) => {
        if (
          entry.sunriseTime == null
          && entry.sunsetTime == null
          && daily.data[i].uvIndex === 0
        ) {
          // Always night, don't supply sunrise/sunset
        } else {
          if (entry.sunriseTime == null) {
            entry.sunriseTime = entry.time
          }

          if (entry.sunsetTime == null) {
            entry.sunsetTime = (entry[i + 1] || {}).time || entry.time + 24 * 60 * 60
          }
        }

        return entry
      })
  }
}

export async function getForecast([x, y], options = {}) {
  let response = await darkSkyRequest(`/${y},${x}`, {
    ...options,
    extend: 'hourly'
  })

  return transformDarkSkyResponse(response)
}

export async function getHistorical([x, y], date, options = {}) {
  let pad = n => x => x.toString().padStart(n, '0')
  let [pad2, pad4] = [2, 4].map(pad)

  let year = pad4(date.getFullYear())
  let month = pad2(date.getMonth() + 1)
  let day = pad2(date.getDate())
  let hours = pad2(date.getHours())
  let minute = pad2(date.getMinutes())
  let seconds = pad2(date.getSeconds())
  let time = `${year}-${month}-${day}T${hours}:${minute}:${seconds}`

  let response = await darkSkyRequest(`/${y},${x},${time}`, {
    ...options,
    extend: 'hourly'
  })

  return transformDarkSkyResponse(response)
}
