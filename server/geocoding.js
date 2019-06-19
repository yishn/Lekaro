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

function transformNominatimResponse(response) {
  return {
    license: response.licence,
    location: [response.lon, response.lat],
    type: response.type,

    address: {
      country: response.address.country,
      state: response.address.state
        || response.address.county
        || response.address.region,
      city: response.address.city
        || response.address.island
        || response.address.town
        || response.address.village
    }
  }
}

export async function search(query, options = {}) {
  let response = await nominatimRequest('/search', {
    ...options,
    q: query,
    addressdetails: 1
  })

  let result = response.map(transformNominatimResponse)

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
      addressdetails: 1,
      zoom: 10
    })

    return transformNominatimResponse(response)
  } catch (err) {}

  return {
    license: '',
    location: [lon, lat],
    type: 'nowhere',
    address: {
      city: 'Middle of Nowhere'
    }
  }
}
