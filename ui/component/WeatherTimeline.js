import {h, Component} from 'preact'
import classnames from 'classnames'
import SmoothInterpolatingPath from './SmoothInterpolatingPath.js'

function LabeledTicks({columnWidth, labels, showLabels, labelPosition}) {
  return <ol
    class={classnames('labeled-ticks', {
      labelpositionbottom: labelPosition === 'bottom',
      showlabels: showLabels
    })}
  >{
    labels.map(label =>
      <li style={{flexBasis: columnWidth}}>
        {showLabels && <span class="label">{label}</span>}
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

function PrecipitationGraph({columnWidth, width, height, precipitation}) {
  let xs = precipitation.map(entry => entry.x * columnWidth)
  let ys = precipitation.map(entry => (1 - entry.probability) * height)

  return <div class="precipitation-graph">
    <svg
      width={width}
      height={height}
    >
      <SmoothInterpolatingPath
        xs={[0, ...xs]}
        ys={[ys[0], ...ys]}
        additionalPoints={[[width, ys.slice(-1)[0]], [width, height], [0, height]]}
        innerProps={{
          class: 'probability'
        }}
      />
    </svg>
  </div>
}

function TemperatureGraph({columnWidth, width, height, temperature, apparentTemperature}) {
  if (temperature.length === 0) return

  let min = Math.floor(Math.min(...temperature, ...apparentTemperature)) - 3
  let max = Math.ceil(Math.max(...temperature, ...apparentTemperature)) + 3
  min = min - min % 5
  max = max + 5 - max % 5

  let xs = temperature.map((_, i) => i * columnWidth + columnWidth / 2)
  let getY = t => height * (min === max ? .5 : (max - t) / (max - min))
  let tys = temperature.map(getY)
  let atys = apparentTemperature.map(getY)

  let labels = temperature
    .map((t, i, ts) => {
      if (i === 0) {
        return {
          index: i,
          position: t - min < max - t ? 'top' : 'bottom'
        }
      }

      let strip = [...Array(13)]
        .map((_, j) => i + j - 6)
        .filter(j => j >= 0 && j < ts.length)
        .map(j => t - ts[j])

      if (strip.every(x => x >= 0)) {
        return {
          index: i,
          position: 'bottom'
        }
      } else if (strip.every(x => x <= 0)) {
        return {
          index: i,
          position: 'top'
        }
      }
    })
    .filter(x => !!x)
    .reduce((acc, extrema) => {
      if (acc.length === 0 || extrema.index - acc.slice(-1)[0].index >= 2) {
        acc.push(extrema)
      }

      return acc
    }, [])

  let helperLineStep = 5
  let helperLinesCount = (max - min) / helperLineStep + 1

  if (helperLinesCount >= 7) {
    helperLineStep *= 2
    helperLinesCount = Math.round((helperLinesCount - 1) / 2 + 1)
  }

  return <div class="temperature-graph">
    <svg
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
        <circle
          class="apparent"
          cx={x} cy={atys[i]} r="4"
        />,

        <circle
          cx={x} cy={tys[i]} r="4"
        />
      ])}
    </svg>

    <ol class="labels">{
      labels.map(({index: i, position}) =>
        <li
          style={{
            left: i * columnWidth + columnWidth / 2,
            top: position === 'bottom'
              ? getY(Math.min(temperature[i], apparentTemperature[i]))
              : 'auto',
            bottom: position === 'top'
              ? height - getY(Math.max(temperature[i], apparentTemperature[i]))
              : 'auto'
          }}
        >
          {Math.abs(temperature[i] - apparentTemperature[i]) >= 1 && [
            <em title="Feels Like Temperature">{Math.round(apparentTemperature[i])}°</em>,
            <br/>
          ]}
          {Math.round(temperature[i])}°
        </li>
      )
    }</ol>
  </div>
}

export default class WeatherTimeline extends Component {
  render() {
    let {
      columnWidth = 28,
      labels = [],
      cloudCover = [],
      temperature = [],
      apparentTemperature = [],
      precipitation = []
    } = this.props

    let graphProps = {
      columnWidth,
      height: 200,
      width: columnWidth * labels.length
    }

    return <div class="weather-timeline">
      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels.map(_ => '')}
        showLabels={false}
        labelPosition="top"
      />

      <CloudCover
        columnWidth={columnWidth}
        cloudCover={cloudCover}
      />

      <div class="graph" style={{width: columnWidth * labels.length, height: 200}}>
        <PrecipitationGraph
          {...graphProps}
          precipitation={precipitation}
        />

        <TemperatureGraph
          {...graphProps}
          temperature={temperature}
          apparentTemperature={apparentTemperature}
        />
      </div>

      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels}
        showLabels={true}
        labelPosition="bottom"
      />
    </div>
  }
}
