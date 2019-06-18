import request from 'request'
import config from '../config.js'

async function darkSkyRequest(path, options = {}) {
  return await new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://api.darksky.net/forecast/${config.apiKey}/`,
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

export async function getForecast([x, y], options = {}) {
  return await darkSkyRequest(`/${y},${x}`, options)
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

  return await darkSkyRequest(`/${y},${x},${time}`, options)
}
