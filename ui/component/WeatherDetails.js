import {h, Component} from 'preact'

export default class WeatherDetails extends Component {
  render() {
    let {
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

    return <div class="weather-details">

    </div>
  }
}
