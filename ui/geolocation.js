import {stringify as qs} from 'querystring'

let nominatimCache = {}

async function nominatimRequest(path, options = {}) {
  let key = JSON.stringify([path, options])
  if (key in nominatimCache) return nominatimCache[key]

  console.log('info: Request Nominatim', path, options)

  let response = await fetch(
    `https://nominatim.openstreetmap.org${path}?${qs({...options, format: 'jsonv2'})}`,
    {
      headers: {
        'User-Agent': 'Lekaro',
        'Accept-Language': options.language
      }
    }
  )

  if (!response.ok) throw new Error('Response not OK')

  let body = await response.json()
  if (body.error != null) throw new Error(body.error)

  nominatimCache[key] = body
  setTimeout(() => {
    delete nominatimCache[key]
  }, 24 * 60 * 60 * 1000 /* 1 day */)

  return body
}

function transformNominatimResponse(response) {
  let result = {
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

  if (
    result.address.country == null
    && result.address.state == null
    && result.address.city == null
  ) {
    result.address.city = 'Middle of Nowhere'
  }

  return result
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

export async function current() {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation not supported')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve([pos.coords.longitude, pos.coords.latitude])
    }, reject)
  })
}
