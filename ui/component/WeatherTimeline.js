import {h, Component} from 'preact'
import classnames from 'classnames'
import SmoothInterpolatingCurve from './SmoothInterpolatingCurve.js'
import * as time from '../time.js';

export function getPlaceholderProps({columns = 7 * 24 + 6} = {}) {
  let now = Math.round(new Date().getTime() / 1000)
  let columnArray = [...Array(columns)].map((_, i) => i)
  let timeArray = columnArray.map(i => time.fromUnixTimestamp(now + i * 60 * 60))
  let temperature = columnArray.map(i =>
    20 - 10 * Math.cos((i - 3) * 2 * Math.PI / 24)
  )

  let zeroes = columnArray.map(_ => 0)

  return {
    columns: 7 * 24 + 6,
    tickLabels: columnArray.map(_ => ''),
    nightColumns: [...Array(8)].map((_, i) => ({
      key: timeArray[i * 24] && timeArray[i * 24].toFormat('DDD'),
      start: i * 24,
      end: 6 + i * 24,
      moonPhase: 0
    })),
    uvIndex: zeroes,
    cloudCover: zeroes,
    precipitation: columnArray.map(i => ({
      x: i,
      probability: 0
    })),
    humidity: zeroes,
    temperature: temperature.map(t => t - 3),
    apparentTemperature: temperature.map(t => t + 1),
    dewPoint: temperature.map(t => t - 7)
  }
}

function NightBackground({columnWidth, width, nightColumns}) {
  return <ol class="night-background">
    {nightColumns[0] && nightColumns[0].start === 0 &&
      <li class="leftpadding" key="leftpadding"></li>
    }

    {nightColumns.map(({key, start, end, moonPhase}) =>
      <li
        key={key}
        style={{
          transform: `translateX(${Math.round(start * columnWidth)}px)`,
          width: Math.ceil((end - start) * columnWidth)
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
      <li class="rightpadding" key="righpadding"></li>
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

function CloudBar({columnWidth, units, cloudCover, precipitation, humidity}) {
  let percent = p => `${Math.round(p * 100)}%`
  let capitalize = str => str[0].toUpperCase() + str.slice(1).toLowerCase()
  let round1 = x => Math.round(x * 10) / 10

  let getCloudCoverDescription = i => {
    let {
      probability: precipProbability,
      intensity: precipIntensity,
      accumulation: precipAccumulation,
      type: precipType
    } = precipitation[i] || {}

    return [
      `${(
        cloudCover[i] < .25 ? 'Clear'
        : cloudCover[i] < .5 ? 'Partly Cloudy'
        : cloudCover[i] < .75 ? 'Mostly Cloudy'
        : 'Overcast'
      )}: ${percent(cloudCover[i])}`,

      `Humidity: ${percent(humidity[i])}`,

      precipProbability && precipType &&
        `${capitalize(precipType)} Probability: ${percent(precipProbability)}`,

      precipIntensity && round1(precipIntensity) > 0 && precipType &&
        `${capitalize(precipType)} Intensity: ${round1(precipIntensity)} ${units.precipitation.intensity}`,

      precipAccumulation && round1(precipAccumulation) > 0 && precipType &&
        `${capitalize(precipType)} Accumulation: ${round1(precipAccumulation)} ${units.precipitation.accumulation}`
    ].filter(x => !!x).join('\n')
  }

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

function PrecipitationGraph({columnWidth, graphHeight, width, precipitation, humidity}) {
  if (precipitation.length === 0 || humidity.length === 0) return

  let xs = humidity.map((_, i) => i * columnWidth)
  let hys = humidity.map(x => (1 - x) * graphHeight)
  let pxs = precipitation.map(entry => entry.x * columnWidth)
  let pys = precipitation.map(entry => entry.probability * graphHeight)

  return <div class="precipitation-graph">
    <svg
      width={width}
      height={graphHeight}
    >
      <SmoothInterpolatingCurve
        xs={[0, ...pxs]}
        ys={[pys[0], ...pys]}
        additionalPoints={[[width, pys.slice(-1)[0]], [width, 0], [0, 0]]}
        innerProps={{
          class: 'probability'
        }}
      />
      <SmoothInterpolatingCurve
        xs={xs}
        ys={hys}
        additionalPoints={[[width, hys.slice(-1)[0]], [width, graphHeight], [0, graphHeight]]}
        innerProps={{
          class: 'humidity'
        }}
      />
    </svg>
  </div>
}

function TemperatureGraph({columnWidth, graphHeight, width, temperature, apparentTemperature, dewPoint}) {
  let min = Math.floor(Math.min(...temperature, ...apparentTemperature, ...dewPoint)) - 3
  let max = Math.ceil(Math.max(...temperature, ...apparentTemperature, ...dewPoint)) + 3
  min = min - (min % 5 + 5) % 5
  max = max + (5 - (max % 5 + 5) % 5) % 5

  if (isNaN(min) || isNaN(max)) return

  let helperLineStep = 5
  let helperLineCount = (max - min) / helperLineStep + 1

  while (helperLineCount >= 7) {
    helperLineStep += 5
    let mod = x => (x % helperLineStep + helperLineStep) % helperLineStep

    min = min - mod(min)
    max = max + (helperLineStep - mod(max)) % helperLineStep
    helperLineCount = (max - min) / helperLineStep + 1
  }

  let xs = temperature.map((_, i) => i * columnWidth + columnWidth / 2)

  let getY = t => graphHeight * (min === max ? .5 : (max - t) / (max - min))
  let dpys = dewPoint.map(getY)
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
        ys={[dpys[0], ...dpys, ...dpys.slice(-1)]}
        innerProps={{
          class: 'dewpoint',
          fill: 'none',
          'stroke-width': 3
        }}
      />
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
          class="dewpoint"
          style={{transform: `translate(${x}px, ${dpys[i]}px)`}}
          cx={0} cy={0} r="4"
        />,
        <circle
          class="apparent"
          style={{transform: `translate(${x}px, ${atys[i]}px)`}}
          cx={0} cy={0} r="4"
        />,
        <circle
          class="temperature"
          style={{transform: `translate(${x}px, ${tys[i]}px)`}}
          cx={0} cy={0} r="4"
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
          title={[
            `Temperature: ${Math.round(temperature[i])}°`,
            `Feels like ${Math.round(apparentTemperature[i])}°`,
            `Dew Point: ${Math.round(dewPoint[i])}°`
          ].join('\n')}
        >
          {apparentTemperature[i] - temperature[i] >= 1 && [
            <em>{Math.round(apparentTemperature[i])}°</em>,
            <br/>
          ]}
          {Math.round(temperature[i])}°
          {temperature[i] - apparentTemperature[i] >= 1 && [
            <br/>,
            <em>{Math.round(apparentTemperature[i])}°</em>
          ]}
        </li>
      )}
    </ol>
  </div>
}

function MainLabels({columnWidth, labels}) {
  return <ol class="main-labels">
    {labels.map(({key, x, type, label}) =>
      <li
        key={key}
        class={type}
        style={{transform: `translateX(${x * columnWidth}px)`}}
      >
        {label}
      </li>
    )}
  </ol>
}

export default class WeatherTimeline extends Component {
  handleMouseDown = evt => {
    if (evt.buttons === 1) {
      evt.preventDefault()

      let {columnWidth = 24, tickLabels = []} = this.props
      let {left} = this.element.getBoundingClientRect()
      let paddingLeft = this.element.querySelector('.graph').offsetLeft
      let column = Math.floor((evt.clientX - left - paddingLeft) / columnWidth)

      if (
        column !== this.props.selectedColumn
        && column >= 0
        && column < tickLabels.length
      ) {
        let {onColumnClick = () => {}} = this.props

        onColumnClick({column})
      }
    }
  }

  render() {
    let {
      innerProps = {},
      style = {},
      columnWidth = 24,
      graphHeight = 200,
      selectedColumn = null,
      tickLabels = [],
      labels = [],
      units = {precipitation: {}},
      uvIndex = [],
      nightColumns = [],
      cloudCover = [],
      humidity = [],
      temperature = [],
      apparentTemperature = [],
      dewPoint = [],
      precipitation = []
    } = this.props

    let width = columnWidth * tickLabels.length

    let graphProps = {
      columnWidth,
      graphHeight,
      width
    }

    return <div
      {...innerProps}
      ref={el => (this.element = el, innerProps.ref && innerProps.ref(el))}
      class="weather-timeline"
      style={{...style, boxSizing: 'content-box', width}}

      onMouseMove={this.handleMouseDown}
      onMouseDown={this.handleMouseDown}
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
        units={units}
        cloudCover={cloudCover}
        humidity={humidity}
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
          humidity={humidity}
        />

        <TemperatureGraph
          {...graphProps}
          temperature={temperature}
          apparentTemperature={apparentTemperature}
          dewPoint={dewPoint}
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

      {selectedColumn != null &&
        <div
          class="selected"
          style={{
            width: columnWidth,
            transform: `translateX(${columnWidth * selectedColumn}px)`
          }}
        />
      }
    </div>
  }
}
