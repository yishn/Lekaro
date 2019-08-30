import {h, Component} from 'preact'
import classnames from 'classnames'
import * as time from '../time.js'

import AdvisoryIcon from '../resources/advisory.svg'
import WarningIcon from '../resources/warning.svg'
import WatchIcon from '../resources/watch.svg'

export default class AlertStrip extends Component {
  render() {
    let {severity, uri, title, description, regions, meta} = this.props

    return <div class={classnames('alert-strip', severity)}>
      {
        severity === 'advisory' ? <AdvisoryIcon class="icon"/>
        : severity === 'warning' ? <WarningIcon class="icon"/>
        : severity === 'watch' ? <WatchIcon class="icon"/>
        : null
      }

      <h4 class="title"><a href={uri}>{title}</a></h4>
      <p class="meta">{meta}</p>
      <p class="description">{description}</p>

      <ul class="regions">
        {regions.map(region =>
          <li>{region}</li>
        )}
      </ul>
    </div>
  }
}
