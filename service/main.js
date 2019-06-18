import express from 'express'
import {join} from 'path'
import * as darksky from './darksky.js'
import config from '../config.js'

const app = express()

app.use(express.static(join(__dirname, '..', 'static')))

app.listen(config.port, () => {
  console.log(`Lekaro listening on port ${config.port}`)
})
