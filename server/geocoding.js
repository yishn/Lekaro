import request from 'request'

let cache = {}

async function nominatimRequest(path, options = {}) {
  let key = JSON.stringify([path, options])
  if (key in cache) return cache[key]

  console.log('info: Request Nominatim', path, options)

  return await new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://nominatim.openstreetmap.org/`,
      headers: {'User-Agent': 'Lekaro'},
      qs: {...options, format: 'jsonv2'},
      json: true
    }, (err, response, body) => {
      if (err != null) return reject(err)
      if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error('Response not OK'))
      if (body.error != null) return reject(new Error(body.error))

      cache[key] = body
      resolve(body)
    })
  })
}

export async function search(query, options = {}) {
  let response = await nominatimRequest('/search', {
    ...options,
    q: query
  })

  let result = response.map(entry => ({
    license: entry.licence,
    location: [entry.lon, entry.lat],
    text: entry.display_name,
    type: entry.type
  }))

  return result
}

export async function get(query, options = {}) {
  let result = await search(query, options)

  return result[0]
}

export async function reverse([lon, lat], options = {}) {
  try {
    let response = await nominatimRequest('/reverse', {
      ...options,
      lon,
      lat,
      osm_type: 'N',
      zoom: 10
    })

    return {
      license: response.licence,
      location: [lon, lat],
      text: response.display_name,
      type: response.type
    }
  } catch (err) {}

  return {
    license: '',
    location: [lon, lat],
    text: 'Middle of Nowhere',
    type: 'nowhere'
  }
}
