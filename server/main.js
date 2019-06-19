import express from 'express'
import {join} from 'path'
import * as geocoding from './geocoding.js'
import * as weather from './weather.js'
import config from '../config.js'

const app = express()

app.use(express.static(join(__dirname, '..', 'static')))

function route(func) {
  return async (req, res) => {
    try {
      let result = await func(req, res)

      if (result !== undefined) {
        res.send(result)
      }
    } catch (err) {
      console.log('error:', err.stack)
      res.status(500).type('text/plain').send(err.message)
    }
  }
}

app.get('/forecast', route(async (req, res) => {
  let {name, lon, lat, units} = req.query
  let info = {location: [lon, lat]}

  if (lon == null || lat == null) {
    info = await geocoding.get(name)

    if (info == null) {
      throw new Error('No location found by given name')
    }
  } else {
    info = await geocoding.reverse([lon, lat])
  }

  let forecast = await weather.getForecast(info.location, {units})

  return {
    info,
    forecast
  }
}))

app.listen(config.port, () => {
  console.log(`info: Lekaro listening on port ${config.port}`)
})
