import {h, Component} from 'preact'
import LocationInfo from './LocationInfo';

export default class App extends Component {
  componentDidMount() {
    this.actions.loadForecast()
  }

  handleSearch = evt => {
    this.actions.loadForecast(evt.value)
  }

  handleCurrentLocationClick = () => {
    this.actions.loadForecast()
  }

  render() {
    let {loading, locationInfo} = this.props

    return <div class="lekaro-app">
      <h1>Lekaro Weather</h1>

      <LocationInfo
        loading={loading}
        city={locationInfo.address && locationInfo.address.city}
        state={locationInfo.address && locationInfo.address.state}
        country={locationInfo.address && locationInfo.address.country}

        onSearch={this.handleSearch}
        onCurrentLocationClick={this.handleCurrentLocationClick}
      />
    </div>
  }
}
