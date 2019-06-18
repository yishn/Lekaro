import request from "request"

async function darkSkyRequest(apiKey, path) {
  return new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://api.darksky.net/forecast/${apiKey}/`,
      json: true
    }, (err, response, body) => {
      err != null ? reject(err)
      : response.statusCode < 200 || response.statusCode >= 300 ? reject(new Error(body.error))
      : resolve(body)
    })
  })
}

export function getForecast() {

}
