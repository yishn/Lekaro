import request from 'request'

let lastRequestTime = null
let cache = {}

async function nominatimRequest(path, options = {}) {
  let key = JSON.stringify([path, options])
  if (key in cache) return cache[key]

  if (lastRequestTime != null) {
    let deltaTime = new Date().getTime() - lastRequestTime.getTime()

    if (deltaTime < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - deltaTime))
    }
  }

  lastRequestTime = new Date()

  console.log('info: Request Nominatim', path, options)

  return await new Promise((resolve, reject) => {
    request({
      url: path,
      baseUrl: `https://nominatim.openstreetmap.org/`,
      headers: {
        'User-Agent': 'Lekaro',
        'Accept-Language': options.language
      },
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
    coordinates: [response.lon, response.lat],
    type: response.type,

    address: {
      country: response.address.country
        || response.address.continent,
      state: response.address.state
        || response.address.state_district,
      city: response.address.city
        || response.address.town
        || response.address.village
        || response.address.county
        || response.address.city_district
        || response.address.region
        || response.address.island
        || response.address.administrative
    }
  }
}

export async function search(query, options = {}) {
  let response = await nominatimRequest('/search', {
    ...options,
    q: query,
    addressdetails: 1
  })

  let isSubobjectOf = (x, y) => Object.keys(x).every(key => x[key] === y[key])

  return response
    .reduce((acc, entry) => {
      // Automatic location merging

      for (let pushedEntry of acc) {
        if (isSubobjectOf(pushedEntry.address, entry.address)) {
          Object.assign(pushedEntry, entry)
          return acc
        } else if (isSubobjectOf(entry.address, pushedEntry.address)) {
          return acc
        }
      }

      acc.push(entry)
      return acc
    }, [])
    .map(transformNominatimResponse)
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
      addressdetails: 1
    })

    return transformNominatimResponse(response)
  } catch (err) {}

  return {
    license: '',
    coordinates: [lon, lat],
    type: 'nowhere',
    address: {
      city: 'Middle of Nowhere'
    }
  }
}
