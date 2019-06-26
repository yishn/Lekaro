import {h, Component} from 'preact'
import classnames from 'classnames'
import SmoothInterpolatingCurve from './SmoothInterpolatingCurve.js'

function NightBackground({columnWidth, width, nightColumns}) {
  return <ol class="night-background">
    {nightColumns[0] && nightColumns[0].start === 0 &&
      <li class="leftpadding"></li>
    }

    {nightColumns.map(({start, end, moonPhase}) =>
      <li
        style={{
          left: start * columnWidth,
          width: (end - start) * columnWidth
        }}
      >
        {moonPhase != null && end - start >= 1 &&
          <svg class="moon" width="1.2rem" height="1.2rem" viewBox="0 0 1 1">
            <title>
              {moonPhase === 0 ? 'New Moon'
                : moonPhase < .25 ? 'Waxing Crescent'
                : moonPhase === .25 ? 'First Quarter Moon'
                : moonPhase < .5 ? 'Waxing Gibbous'
                : moonPhase === .5 ? 'Full Moon'
                : moonPhase < .75 ? 'Waning Gibbous'
                : moonPhase === .75 ? 'Last Quarter Moon'
                : 'Waning Crescent'}{'\n'}
              Illumination: {
                Math.round((moonPhase <= .5 ? moonPhase * 2 : 2 - moonPhase * 2) * 100)
              }%
            </title>

            <circle cx=".5" cy=".5" r=".4" stroke-width=".1" fill="transparent" />

            <path
              stroke-width="0"
              d={
                [...Array(51)].map((_, i) => {
                  let midFraction = moonPhase <= .5
                    ? 1 - moonPhase * 2
                    : 2 - moonPhase * 2

                  let right = Math.sqrt(.4 ** 2 - (i * .8 / 50 - .4) ** 2) + .5
                  let left = 1 - right
                  let type = i === 0 ? 'M' : 'L'
                  let coord = [right * midFraction + left * (1 - midFraction), i * .8 / 50 + .1]

                  return `${type}${coord.join(',')}`
                }).join(' ') + ' ' + [...Array(51)].map((_, i) => {
                  let x = Math.sqrt(.4 ** 2 - (i * .8 / 50 - .4) ** 2) + .5
                  if (moonPhase > .5) x = 1 - x

                  let coord = [x, .9 - i * .8 / 50]

                  return `L${coord.join(',')}`
                }).join(' ')
              }
            />
          </svg>
        }
      </li>
    )}

    {nightColumns.slice(-1)[0] && nightColumns.slice(-1)[0].end * columnWidth === width &&
      <li class="rightpadding"></li>
    }
  </ol>
}

function SunBar({columnWidth, uvIndex}) {
  let getColor = uv =>
    uv == null || uv === 0 ? ''
    : uv < 3 ? 'green'
    : uv < 6 ? 'yellow'
    : uv < 8 ? 'orange'
    : uv < 11 ? 'red'
    : 'violet'

  return <ol class="sun-bar">
    {uvIndex.map((x, i) =>
      <li
        class={classnames(
          'uv',
          getColor(x),
          i > 0 && getColor(x) === getColor(uvIndex[i - 1]) && 'extendleft',
          i < uvIndex.length - 1 && getColor(x) === getColor(uvIndex[i + 1]) && 'extendright'
        )}
        style={{
          flexBasis: columnWidth
        }}
      >
        {x != null && x !== 0 &&
          <span>{Math.floor(x)}</span>
        }
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
              invert: nightColumns.some(({start, end}) => start <= i && i <= end)
            })}
          >
            {label}
          </span>
        }
      </li>
    )}
  </ol>
}

function CloudBar({columnWidth, cloudCover, precipitation}) {
  let percent = p => `${Math.round(p * 100)}%`
  let capitalize = str => str[0].toUpperCase() + str.slice(1).toLowerCase()

  let getCloudCoverDescription = i => [
    `${(
      cloudCover[i] < .25 ? 'Clear'
      : cloudCover[i] < .5 ? 'Partly Cloudy'
      : cloudCover[i] < .75 ? 'Mostly Cloudy'
      : 'Overcast'
    )}: ${percent(cloudCover[i])}`,

    precipitation[i].probability && precipitation[i].type &&
      `${capitalize(precipitation[i].type)} Probability: ${percent(precipitation[i].probability)}`,
  ].filter(x => !!x).join('\n')

  return <ol class="cloud-bar" style={{width: cloudCover.length * columnWidth}}>
    {cloudCover.map((cover, i) =>
      <li
        style={{flexBasis: columnWidth}}
        title={getCloudCoverDescription(i)}
      >
        <div class="cover" style={{opacity: cover}}>{getCloudCoverDescription(i)}</div>
      </li>
    )}
  </ol>
}

function PrecipitationGraph({columnWidth, graphHeight, width, precipitation}) {
  let xs = precipitation.map(entry => entry.x * columnWidth)
  let ys = precipitation.map(entry => entry.probability * graphHeight)

  return <div class="precipitation-graph">
    <svg
      width={width}
      height={graphHeight}
    >
      <SmoothInterpolatingCurve
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

function TemperatureGraph({columnWidth, graphHeight, width, temperature, apparentTemperature}) {
  if (temperature.length === 0) return

  let min = Math.floor(Math.min(...temperature, ...apparentTemperature)) - 3
  let max = Math.ceil(Math.max(...temperature, ...apparentTemperature)) + 3
  min = min - (min % 5 + 5) % 5
  max = max + 5 - (max % 5 + 5) % 5

  let helperLineStep = 5
  let helperLineCount = (max - min) / helperLineStep + 1

  while (helperLineCount >= 7) {
    helperLineStep += 5
    min = min - (min % helperLineStep + helperLineStep) % helperLineStep
    max = max + helperLineStep - (max % helperLineStep + helperLineStep) % helperLineStep
    helperLineCount = (max - min) / helperLineStep + 1
  }

  let xs = temperature.map((_, i) => i * columnWidth + columnWidth / 2)
  let getY = t => graphHeight * (min === max ? .5 : (max - t) / (max - min))
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

  return <div class="temperature-graph">
    <svg
      width={width}
      height={graphHeight}
    >
      <g class="helperlines">
        {[...Array(helperLineCount)].map((_, i) =>
          <line
            x1="0"
            y1={getY(min + i * helperLineStep)}
            x2={width}
            y2={getY(min + i * helperLineStep)}
            stroke-width="1"
          />
        )}
      </g>

      <SmoothInterpolatingCurve
        xs={[0, ...xs, width]}
        ys={[atys[0], ...atys, ...atys.slice(-1)]}
        innerProps={{
          class: 'apparent',
          fill: 'none',
          'stroke-width': 3
        }}
      />
      <SmoothInterpolatingCurve
        xs={[0, ...xs, width]}
        ys={[tys[0], ...tys, ...tys.slice(-1)]}
        innerProps={{
          class: 'temperature',
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
          class="temperature"
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
              ? graphHeight - getY(Math.max(temperature[i], apparentTemperature[i]))
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

function MainLabels({columnWidth, labels}) {
  return <ol class="main-labels">
    {labels.map(({x, type, label}) =>
      <li class={type} style={{left: x * columnWidth}}>{label}</li>
    )}
  </ol>
}

export default class WeatherTimeline extends Component {
  render() {
    let {
      innerProps = {},
      columnWidth = 24,
      graphHeight = 200,
      tickLabels = [],
      labels = [],
      uvIndex = [],
      nightColumns = [],
      cloudCover = [],
      temperature = [],
      apparentTemperature = [],
      precipitation = []
    } = this.props

    let width = columnWidth * tickLabels.length

    let graphProps = {
      columnWidth,
      graphHeight,
      width
    }

    return <div
      innerProps={innerProps}
      class="weather-timeline"
      style={{boxSizing: 'content-box', width}}
    >
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
        labels={tickLabels.map(_ => '')}
        showLabels={false}
        labelPosition="top"
        nightColumns={nightColumns}
      />

      <CloudBar
        columnWidth={columnWidth}
        cloudCover={cloudCover}
        precipitation={
          precipitation
            .reduce((acc, entry) => {
              let index = Math.floor(entry.x)

              while (acc[index] == null) {
                acc.push([])
              }

              acc[index].push(entry)
              return acc
            }, [])
            .map(entries => {
              let max = key => {
                let result = Math.max(...entries.filter(x => x[key] != null).map(x => x[key]))
                return isFinite(result) ? result : undefined
              }

              return {
                intensity: max('intensity'),
                accumulation: max('accumulation'),
                probability: max('probability'),
                type: (Object.entries(
                  entries
                  .filter(x => x.type != null)
                  .map(x => x.type)
                  .reduce((acc, type) => {
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                  }, {})
                ).find(([_, count], __, arr) =>
                  arr.every(([_, count2]) => count >= count2)
                ) || {})[0]
              }
            })
        }
      />

      <div class="graph" style={{width: columnWidth * tickLabels.length, height: 200}}>
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
        labels={tickLabels}
        showLabels={true}
        labelPosition="bottom"
        nightColumns={nightColumns}
      />

      <MainLabels
        columnWidth={columnWidth}
        labels={labels}
      />
    </div>
  }
}
