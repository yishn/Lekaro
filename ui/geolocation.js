export async function getCurrentCoordinates() {
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation not supported')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve([pos.coords.longitude, pos.coords.latitude])
    }, reject)
  })
}
