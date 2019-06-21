import {h, Component} from 'preact'
import classnames from 'classnames'
import SmoothInterpolatingPath from './SmoothInterpolatingPath.js'

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

function TemperatureGraph({columnWidth, height, temperature, apparentTemperature}) {
  if (temperature.length === 0) return

  let min = Math.floor(Math.min(...temperature, ...apparentTemperature)) - 3
  let max = Math.ceil(Math.max(...temperature, ...apparentTemperature)) + 3
  min = min - min % 5
  max = max + 5 - max % 5

  let width = columnWidth * temperature.length
  let xs = temperature.map((_, i) => i * columnWidth + columnWidth / 2)
  let getY = t => height * (min === max ? .5 : (max - t) / (max - min))
  let tys = temperature.map(getY)
  let atys = apparentTemperature.map(getY)

  let helperLineStep = 5
  let helperLinesCount = (max - min) / helperLineStep + 1

  if (helperLinesCount >= 6) {
    helperLineStep *= 2
    helperLinesCount = Math.round((helperLinesCount - 1) / 2 + 1)
  }

  return <svg
    class="temperature-graph"
    width={width}
    height={height}
  >
    <g class="helperlines">{
      [...Array(helperLinesCount)].map((_, i) =>
        <line
          x1="0"
          y1={getY(min + i * helperLineStep)}
          x2={width}
          y2={getY(min + i * helperLineStep)}
          stroke-width="1"
        />
      )
    }</g>

    <SmoothInterpolatingPath
      xs={[0, ...xs, width]}
      ys={[atys[0], ...atys, ...atys.slice(-1)]}
      innerProps={{
        class: 'apparent',
        fill: 'none',
        'stroke-width': 3
      }}
    />
    <SmoothInterpolatingPath
      xs={[0, ...xs, width]}
      ys={[tys[0], ...tys, ...tys.slice(-1)]}
      innerProps={{
        fill: 'none',
        'stroke-width': 3
      }}
    />

    {xs.map((x, i) => [
      <circle class="apparent" cx={x} cy={atys[i]} r="4" stroke="white" stroke-width="1"/>,
      <circle cx={x} cy={tys[i]} r="4" stroke="white" stroke-width="1"/>
    ])}
  </svg>
}

export default class WeatherTimeline extends Component {
  render() {
    let {
      columnWidth = 28,
      labels = [],
      cloudCover = [],
      temperature = [],
      apparentTemperature = []
    } = this.props

    return <div class="weather-timeline">
      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels.map(_ => '')}
        labelPosition="top"
      />

      <CloudCover
        columnWidth={columnWidth}
        cloudCover={cloudCover}
      />

      <div class="graph" style={{width: columnWidth * labels.length, height: 200}}>
        <TemperatureGraph
          columnWidth={columnWidth}
          height={200}
          temperature={temperature}
          apparentTemperature={apparentTemperature}
        />
      </div>

      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels}
        labelPosition="bottom"
      />
    </div>
  }
}
