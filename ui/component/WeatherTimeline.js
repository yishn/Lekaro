import {h, Component} from 'preact'
import classnames from 'classnames'

function LabeledTicks({columnWidth, labels, labelPosition}) {
  return <ol
    class={classnames('labeled-ticks', {
      labelpositionbottom: labelPosition === 'bottom'
    })}
  >{
    labels.map(label =>
      <li style={{flexBasis: columnWidth}}>
        <span class="label">{label}</span>
      </li>
    )
  }</ol>
}

function CloudCover({columnWidth, cloudCover}) {
  let getCloudCoverDescription = cover =>
    `${Math.round(cover * 100)}%: ${(
      cover < .25 ? 'Clear'
      : cover < .5 ? 'Partly Cloudy'
      : cover < .75 ? 'Mostly Cloudy'
      : 'Overcast'
    )}`

  return <ol class="cloud-cover" style={{width: cloudCover.length * columnWidth}}>{
    cloudCover.map(cover =>
      <li
        style={{flexBasis: columnWidth, opacity: cover}}
        title={getCloudCoverDescription(cover)}
      >
        {getCloudCoverDescription(cover)}
      </li>
    )
  }</ol>
}

export default class WeatherTimeline extends Component {
  render() {
    let {
      columnWidth = 32,
      labels = [],
      cloudCover = []
    } = this.props

    return <div class="weather-timeline">
      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels}
        labelPosition="top"
      />
      <CloudCover
        columnWidth={columnWidth}
        cloudCover={cloudCover}
      />
      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels}
        labelPosition="bottom"
      />
    </div>
  }
}
