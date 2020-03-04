import {h} from 'preact'
import classnames from 'classnames'

import AdvisoryIcon from '../resources/advisory.svg'
import WatchIcon from '../resources/watch.svg'
import WarningIcon from '../resources/warning.svg'

export default function AlertStrip({
  severity,
  uri,
  title,
  meta,
  description,
  regions
}) {
  return (
    <div class={classnames('alert-strip', severity)}>
      {severity === 'advisory' ? (
        <AdvisoryIcon class="icon" />
      ) : severity === 'watch' ? (
        <WatchIcon class="icon" />
      ) : severity === 'warning' ? (
        <WarningIcon class="icon" />
      ) : null}

      <div class="details">
        <h4 class="title">
          <a href={uri}>{title}</a>
        </h4>
        <p class="meta">{meta}</p>
        <p class="description">{description}</p>

        {regions && regions.length > 0 && (
          <ul class="regions">
            {regions.map(region => (
              <li>{region}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
