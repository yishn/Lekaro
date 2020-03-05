import {h, Component} from 'preact'
import {useState, useEffect} from 'preact/hooks'
import DegreeIcon from '../resources/degree.svg'
import AreaIcon from '../resources/area.svg'
import OzoneIcon from '../resources/ozone.svg'
import PressureIcon from '../resources/pressure.svg'
import WindIcon from '../resources/wind.svg'
import GustIcon from '../resources/gust.svg'
import VisibilityIcon from '../resources/visibility.svg'
import RainIcon from '../resources/rain.svg'
import SnowIcon from '../resources/snow.svg'
import SleetIcon from '../resources/sleet.svg'
import AccumulationIcon from '../resources/accumulation.svg'

export default function WeatherDetails({
  units,
  temperature,
  apparentTemperature,
  dewPoint,
  cloudCover,
  humidity,
  ozone,
  pressure,
  windBearing: windBearingProp,
  windSpeed,
  windGust,
  visibility,
  precipProbability,
  precipType,
  precipIntensity,
  precipAccumulation
}) {
  let [windBearing, setWindBearing] = useState(0)
  let capitalize = str => str[0].toUpperCase() + str.slice(1).toLowerCase()
  let round = (x, n = 0) => Math.round(x * 10 ** n) / 10 ** n

  useEffect(function updateWindBearing() {
    let newWindBearing = windBearingProp

    while (Math.abs(windBearing - newWindBearing) > 180) {
      newWindBearing =
        newWindBearing + Math.sign(windBearing - newWindBearing) * 360
    }

    setWindBearing(newWindBearing)
  })

  return (
    <div class="weather-details">
      <ul>
        <li class="temperature" title="Temperature">
          <DegreeIcon class="icon" />
          <span class="text">
            {round(temperature, 1)} {units.temperature}
          </span>
        </li>
        <li class="apparent" title="Perceived Temperature">
          <DegreeIcon class="icon" />
          <span class="text">
            {round(apparentTemperature, 1)} {units.apparentTemperature}
          </span>
        </li>
        <li class="dewpoint" title="Dew Point">
          <DegreeIcon class="icon" />
          <span class="text">
            {round(dewPoint, 1)} {units.dewPoint}
          </span>
        </li>
      </ul>
      <ul>
        <li class="cloudcover" title="Cloud Cover">
          <AreaIcon class="icon" />
          <span class="text">{round(cloudCover * 100)}%</span>
        </li>
        <li
          class="precipitation"
          title={`${
            precipType != null ? capitalize(precipType) : 'Precipitation'
          } Probability`}
        >
          <AreaIcon class="icon" />
          <span class="text">{round(precipProbability * 100)}%</span>
        </li>
        <li class="humidity" title="Relative Humidity">
          <AreaIcon class="icon" />
          <span class="text">{round(humidity * 100)}%</span>
        </li>
      </ul>
      <ul>
        <li
          title={`${
            precipType != null ? capitalize(precipType) : 'Precipitation'
          } Intensity`}
        >
          {precipType === 'snow' ? (
            <SnowIcon class="icon" />
          ) : precipType === 'sleet' ? (
            <SleetIcon class="icon" />
          ) : (
            <RainIcon class="icon" />
          )}
          <span class="text">
            {precipType != null ? round(precipIntensity, 2) : '-'}{' '}
            {precipType != null && units.precipitation.intensity}
          </span>
        </li>
        {precipAccumulation != null && (
          <li title="Snow Accumulation">
            <AccumulationIcon class="icon" />
            <span class="text">
              {round(precipAccumulation, 2)} {units.precipitation.accumulation}
            </span>
          </li>
        )}
      </ul>
      <ul>
        <li title="Wind Speed">
          <WindIcon
            class="icon"
            style={{transform: `rotate(${windBearing}deg)`}}
          />
          <span class="text">
            {round(windSpeed, 2)} {units.windSpeed}
          </span>
        </li>
        <li title="Wind Gust Speed">
          <GustIcon class="icon" />
          <span class="text">
            {round(windGust, 2)} {units.windGust}
          </span>
        </li>
      </ul>
      <ul>
        <li title="Sea-Level Air Pressure">
          <PressureIcon class="icon" />
          <span class="text">
            {round(pressure, 2)} {units.pressure}
          </span>
        </li>
        <li title="Columnar Density of Total Atmospheric Ozone">
          <OzoneIcon class="icon" />
          <span class="text">
            {round(ozone, 2)} {units.ozone}
          </span>
        </li>
        <li title="Average Visibility">
          <VisibilityIcon class="icon" />
          <span class="text">
            {((units.visibility === 'km' && visibility >= 16.093) ||
            (units.visibility === 'mi' && visibility >= 10)
              ? '≥'
              : '') + round(visibility, 2)}{' '}
            {units.visibility}
          </span>
        </li>
      </ul>
    </div>
  )
}
