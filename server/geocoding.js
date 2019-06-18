import request from 'request'

let cache = {}

async function nominatimRequest(path, options = {}) {
  console.log('info: Request Nominatim', path, options)

  return await new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://nominatim.openstreetmap.org/`,
      headers: {'User-Agent': 'Lekaro'},
      qs: {...options, format: 'json'},
      json: true
    }, (err, response, body) => {
      err != null ? reject(err)
      : response.statusCode < 200 || response.statusCode >= 300 ? reject(new Error('Response not OK'))
      : resolve(body)
    })
  })
}

export async function search(query, options = {}) {
  if (query in cache) return cache[query]

  let response = await nominatimRequest('/search', {
    ...options,
    q: query
  })

  let result = response.map(entry => ({
    license: entry.licence,
    location: [entry.lon, entry.lat],
    text: entry.display_name
  }))

  cache[query] = result

  return result
}

export async function get(query, options = {}) {
  let result = await search(query, options)

  return result[0]
}
