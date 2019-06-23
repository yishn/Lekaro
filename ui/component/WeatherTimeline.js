import {h, Component} from 'preact'
import classnames from 'classnames'
import SmoothInterpolatingPath from './SmoothInterpolatingPath.js'

function NightBackground({columnWidth, width, nightColumns}) {
  return <ol class="night-background">
    {nightColumns[0] && nightColumns[0][0] === 0 &&
      <li class="leftpadding"></li>
    }

    {nightColumns.map(([start, end]) =>
      <li
        style={{
          left: start * columnWidth,
          width: (end - start) * columnWidth
        }}
      ></li>
    )}

    {nightColumns.slice(-1)[0] && nightColumns.slice(-1)[0][1] * columnWidth === width
      && <li class="rightpadding"></li>
    }
  </ol>
}

function SunBar({columnWidth, uvIndex}) {
  return <ol class="sun-bar">
    {uvIndex.map(x =>
      <li
        class={`uv ${
          x < 3 ? 'green'
          : x < 6 ? 'yellow'
          : x < 8 ? 'orange'
          : x < 11 ? 'red'
          : 'violet'
        }`}
        style={{
          flexBasis: columnWidth
        }}
      >
        {x !== 0 && <span>{x}</span>}
      </li>
    )}
  </ol>
}

function LabeledTicks({columnWidth, labels, showLabels, labelPosition, nightColumns}) {
  return <ol
    class={classnames('labeled-ticks', {
      labelpositionbottom: labelPosition === 'bottom',
      showlabels: showLabels
    })}
  >
    {labels.map((label, i) =>
      <li style={{flexBasis: columnWidth}}>
        {showLabels &&
          <span
            class={classnames('label', {
              invert: nightColumns.some(([start, end]) => start <= i && i <= end)
            })}
          >
            {label}
          </span>
        }
      </li>
    )}
  </ol>
}

function CloudCover({columnWidth, cloudCover}) {
  let getCloudCoverDescription = cover =>
    `${Math.round(cover * 100)}%: ${(
      cover < .25 ? 'Clear'
      : cover < .5 ? 'Partly Cloudy'
      : cover < .75 ? 'Mostly Cloudy'
      : 'Overcast'
    )}`

  return <ol class="cloud-cover" style={{width: cloudCover.length * columnWidth}}>
    {cloudCover.map(cover =>
      <li
        style={{flexBasis: columnWidth, opacity: cover}}
        title={getCloudCoverDescription(cover)}
      >
        {getCloudCoverDescription(cover)}
      </li>
    )}
  </ol>
}

function PrecipitationGraph({columnWidth, width, height, precipitation}) {
  let xs = precipitation.map(entry => entry.x * columnWidth)
  let ys = precipitation.map(entry => entry.probability * height)

  return <div class="precipitation-graph">
    <svg
      width={width}
      height={height}
    >
      <SmoothInterpolatingPath
        xs={[0, ...xs]}
        ys={[ys[0], ...ys]}
        additionalPoints={[[width, ys.slice(-1)[0]], [width, 0], [0, 0]]}
        innerProps={{
          class: 'probability',
          'stroke-width': 3
        }}
      />
    </svg>
  </div>
}

function TemperatureGraph({columnWidth, width, height, temperature, apparentTemperature}) {
  if (temperature.length === 0) return

  let min = Math.floor(Math.min(...temperature, ...apparentTemperature)) - 3
  let max = Math.ceil(Math.max(...temperature, ...apparentTemperature)) + 3
  min = min - (min % 5 + 5) % 5
  max = max + 5 - (max % 5 + 5)

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
      if (
        acc.length === 0
        || extrema.index - acc.slice(-1)[0].index >= 2
        && Math.round(temperature[extrema.index]) !== Math.round(temperature[acc.slice(-1)[0].index])
      ) {
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
      <g class="helperlines">
        {[...Array(helperLinesCount)].map((_, i) =>
          <line
            x1="0"
            y1={getY(min + i * helperLineStep)}
            x2={width}
            y2={getY(min + i * helperLineStep)}
            stroke-width="1"
          />
        )}
      </g>

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

    <ol class="labels">
      {labels.map(({index: i, position}) =>
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
          {apparentTemperature[i] - temperature[i] >= 1 && [
            <em title={`Feels like ${Math.round(apparentTemperature[i])}°`}>
              {Math.round(apparentTemperature[i])}°
            </em>,
            <br/>
          ]}
          {Math.round(temperature[i])}°
          {temperature[i] - apparentTemperature[i] >= 1 && [
            <br/>,
            <em title={`Feels like ${Math.round(apparentTemperature[i])}°`}>
              {Math.round(apparentTemperature[i])}°
            </em>
          ]}
        </li>
      )}
    </ol>
  </div>
}

export default class WeatherTimeline extends Component {
  render() {
    let {
      columnWidth = 28,
      labels = [],
      uvIndex = [],
      nightColumns = [],
      cloudCover = [],
      temperature = [],
      apparentTemperature = [],
      precipitation = []
    } = this.props

    let width = columnWidth * labels.length

    let graphProps = {
      columnWidth,
      height: 200,
      width
    }

    return <div class="weather-timeline" style={{boxSizing: 'content-box', width}}>
      <NightBackground
        columnWidth={columnWidth}
        width={width}
        nightColumns={nightColumns}
      />

      <SunBar
        columnWidth={columnWidth}
        uvIndex={uvIndex}
      />

      <LabeledTicks
        columnWidth={columnWidth}
        labels={labels.map(_ => '')}
        showLabels={false}
        labelPosition="top"
        nightColumns={nightColumns}
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
        nightColumns={nightColumns}
      />
    </div>
  }
}
