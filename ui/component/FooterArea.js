import {h, Component} from 'preact'

export default class FooterArea extends Component {
  render() {
    return <div class="footer-area">
      <p>Geocoding powered by <a href="https://nominatim.openstreetmap.org/">Nominatim</a></p>
      <p>Weather forecasts by <a href="https://darksky.net/poweredby/">Dark Sky</a></p>
    </div>
  }
}
