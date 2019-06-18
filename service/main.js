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
      res.status(500).type('text/plain').send(err.stack)
    }
  }
}

app.get('/forecast', route(async (req, res) => {
  let {name} = req.query
  let info = await geocoding.get(name)

  if (info == null) {
    throw new Error('No location found by given name')
  }

  let forecast = await weather.getForecast(info.location, {extend: 'hourly'})

  return {
    info,
    forecast
  }
}))

app.listen(config.port, () => {
  console.log(`Lekaro listening on port ${config.port}`)
})
