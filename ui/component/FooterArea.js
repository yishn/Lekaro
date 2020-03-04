import {h} from 'preact'

export default function FooterArea() {
  return (
    <div class="footer-area">
      <p>
        Geocoding powered by{' '}
        <a href="https://nominatim.openstreetmap.org/">Nominatim</a>
      </p>
      <p>
        Weather forecasts by{' '}
        <a href="https://darksky.net/poweredby/">Dark Sky</a>
      </p>
    </div>
  )
}
