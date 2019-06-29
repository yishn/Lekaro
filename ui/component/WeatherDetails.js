import {h, Component} from 'preact'
import DegreeIcon from '../resources/degree.svg'

export default class WeatherDetails extends Component {
  render() {
    let {
      units,
      temperature,
      apparentTemperature,
      dewPoint,
      humidity,
      ozone,
      pressure,
      windBearing,
      windSpeed,
      windGust,
      visibility,
      precipProbability,
      precipType,
      precipIntensity,
      precipAccumulation
    } = this.props

    return <ul class="weather-details">
      <li class="temperature" title="Temperature">
        <DegreeIcon class="icon"/>
        <span class="text">{temperature} {units.temperature}</span>
      </li>
      <li class="apparent" title="Perceived Temperature">
        <DegreeIcon class="icon"/>
        <span class="text">{apparentTemperature} {units.apparentTemperature}</span>
      </li>
      <li class="dewpoint" title="Dew Point">
        <DegreeIcon class="icon"/>
        <span class="text">{dewPoint} {units.dewPoint}</span>
      </li>
    </ul>
  }
}
