import {h} from 'preact'
import {useEffect, useRef, useCallback} from 'preact/hooks'
import classnames from 'classnames'
import scrollIntoView from 'scroll-into-view-if-needed'
import SmoothInterpolatingCurve from './SmoothInterpolatingCurve.js'
import * as time from '../time.js'

export function getPlaceholderProps({columns = 7 * 24 + 1} = {}) {
  let now = Math.round(new Date().getTime() / 1000)
  let columnArray = [...Array(columns)].map((_, i) => i)
  let timeArray = columnArray.map(i =>
    time.fromUnixTimestamp(now + i * 60 * 60)
  )
  let temperature = columnArray.map(
    i => 20 - 10 * Math.cos(((i - 3) * 2 * Math.PI) / 24)
  )

  let zeroes = columnArray.map(_ => 0)

  return {
    columns,
    tickLabels: columnArray.map(_ => ''),
    nightColumns: [...Array(8)].map((_, i) => ({
      key: timeArray[i * 24] && timeArray[i * 24].toFormat('DDD'),
      start: i * 24,
      end: Math.min(6 + i * 24, columns),
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
  return (
    <ol class="night-background">
      {nightColumns[0] && nightColumns[0].start === 0 && (
        <li class="leftpadding" key="leftpadding"></li>
      )}

      {nightColumns.map(({key, start, end, moonPhase}) => (
        <li
          key={key}
          style={{
            transform: `translateX(${Math.round(start * columnWidth)}px)`,
            width: Math.ceil((end - start) * columnWidth)
          }}
        >
          {moonPhase != null && end - start >= 1.5 && (
            <svg
              class="moon"
              style={{width: '1.2rem', height: '1.2rem'}}
              viewBox="0 0 1 1"
            >
              <title>
                {moonPhase === 0
                  ? 'New Moon'
                  : moonPhase < 0.25
                  ? 'Waxing Crescent'
                  : moonPhase === 0.25
                  ? 'First Quarter Moon'
                  : moonPhase < 0.5
                  ? 'Waxing Gibbous'
                  : moonPhase === 0.5
                  ? 'Full Moon'
                  : moonPhase < 0.75
                  ? 'Waning Gibbous'
                  : moonPhase === 0.75
                  ? 'Last Quarter Moon'
                  : 'Waning Crescent'}
                {'\n'}
                Illumination:{' '}
                {Math.round(
                  (moonPhase <= 0.5 ? moonPhase * 2 : 2 - moonPhase * 2) * 100
                )}
                %
              </title>

              <circle
                cx=".5"
                cy=".5"
                r=".4"
                stroke-width=".1"
                fill="transparent"
              />

              <path
                stroke-width="0"
                d={
                  [...Array(51)]
                    .map((_, i) => {
                      let midFraction =
                        moonPhase <= 0.5 ? 1 - moonPhase * 2 : 2 - moonPhase * 2

                      let right =
                        Math.sqrt(0.4 ** 2 - ((i * 0.8) / 50 - 0.4) ** 2) + 0.5
                      let left = 1 - right
                      let type = i === 0 ? 'M' : 'L'
                      let coord = [
                        right * midFraction + left * (1 - midFraction),
                        (i * 0.8) / 50 + 0.1
                      ]

                      return `${type}${coord.join(',')}`
                    })
                    .join(' ') +
                  ' ' +
                  [...Array(51)]
                    .map((_, i) => {
                      let x =
                        Math.sqrt(0.4 ** 2 - ((i * 0.8) / 50 - 0.4) ** 2) + 0.5
                      if (moonPhase > 0.5) x = 1 - x

                      let coord = [x, 0.9 - (i * 0.8) / 50]

                      return `L${coord.join(',')}`
                    })
                    .join(' ')
                }
              />
            </svg>
          )}
        </li>
      ))}

      {nightColumns.slice(-1)[0] &&
        nightColumns.slice(-1)[0].end * columnWidth === width && (
          <li class="rightpadding" key="righpadding"></li>
        )}
    </ol>
  )
}

function SunBar({columnWidth, uvIndex}) {
  let getColor = uv =>
    uv == null || uv === 0
      ? ''
      : uv < 3
      ? 'green'
      : uv < 6
      ? 'yellow'
      : uv < 8
      ? 'orange'
      : uv < 11
      ? 'red'
      : 'violet'

  return (
    <ol class="sun-bar">
      {uvIndex.map((x, i) => (
        <li
          class={classnames(
            'uv',
            getColor(x),
            i > 0 && getColor(x) === getColor(uvIndex[i - 1]) && 'extendleft',
            i < uvIndex.length - 1 &&
              getColor(x) === getColor(uvIndex[i + 1]) &&
              'extendright'
          )}
          style={{
            flexBasis: columnWidth
          }}
        >
          {x != null && x !== 0 && <span>{Math.floor(x)}</span>}
        </li>
      ))}
    </ol>
  )
}

function LabeledTicks({
  columnWidth,
  labels,
  showLabels,
  labelPosition,
  nightColumns
}) {
  return (
    <ol
      class={classnames('labeled-ticks', {
        labelpositionbottom: labelPosition === 'bottom',
        showlabels: showLabels
      })}
    >
      {labels.map((label, i) => (
        <li style={{flexBasis: columnWidth}}>
          {showLabels && (
            <span
              class={classnames('label', {
                invert: nightColumns.some(
                  ({start, end}) => start <= i && i <= end
                )
              })}
            >
              {label}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

function CloudBar({columnWidth, units, cloudCover, precipitation}) {
  let percent = p => `${Math.round(p * 100)}%`
  let avg = (x, y) => (x + y) / 2

  let getCloudCoverDescription = i => {
    return `${percent(cloudCover[i])}: ${
      cloudCover[i] < 0.25
        ? 'Clear'
        : cloudCover[i] < 0.5
        ? 'Partly Cloudy'
        : cloudCover[i] < 0.75
        ? 'Mostly Cloudy'
        : 'Overcast'
    }`
  }

  return (
    <ol class="cloud-bar" style={{width: cloudCover.length * columnWidth}}>
      {cloudCover.map((cover, i) => {
        let prevCover = i === 0 ? cover : cloudCover[i - 1]
        let nextCover = i === cloudCover.length - 1 ? cover : cloudCover[i + 1]

        return (
          <li
            style={{flexBasis: columnWidth}}
            title={getCloudCoverDescription(i)}
          >
            <div
              class="cover"
              style={{
                background: `linear-gradient(
              to right,
              rgba(135, 143, 154, ${avg(prevCover, cover)}),
              rgba(135, 143, 154, ${cover}),
              rgba(135, 143, 154, ${avg(nextCover, cover)})
            )`
              }}
            >
              {getCloudCoverDescription(i)}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PrecipitationGraph({
  columnWidth,
  graphHeight,
  width,
  precipitation,
  humidity
}) {
  if (precipitation.length === 0 || humidity.length === 0) return

  let xs = humidity.map((_, i) => i * columnWidth)
  let hys = humidity.map(x => (1 - x) * graphHeight)
  let pxs = precipitation.map(entry => entry.x * columnWidth)
  let pys = precipitation.map(entry => entry.probability * graphHeight)

  let precipMaxIntensity = Math.max(
    ...precipitation.map(entry => entry.intensity)
  )
  let precipRelIntensities = precipitation.map(entry =>
    Math.min(entry.intensity / precipMaxIntensity, 1)
  )
  let precipMinColor = [69, 121, 185]
  let precipMaxColor = [27, 44, 130]

  return (
    <div class="precipitation-graph">
      <svg width={width} height={graphHeight}>
        <mask id="probabilityMask">
          <SmoothInterpolatingCurve
            xs={[0, ...pxs]}
            ys={[pys[0], ...pys]}
            additionalPoints={[
              [width, pys.slice(-1)[0]],
              [width, 0],
              [0, 0]
            ]}
            innerProps={{
              fill: 'white',
              stroke: 'white',
              'stroke-width': 3
            }}
          />
        </mask>

        <g class="probability" mask="url('#probabilityMask')">
          {pxs.map((x, i) => {
            let color = precipMinColor.map(
              (x, j) =>
                (1 - precipRelIntensities[i]) * x +
                precipRelIntensities[i] * precipMaxColor[j]
            )

            return (
              <rect
                x={x}
                y="0"
                width={columnWidth}
                height={graphHeight}
                fill={`rgb(${color.join(', ')})`}
              />
            )
          })}
        </g>

        <SmoothInterpolatingCurve
          xs={xs}
          ys={hys}
          additionalPoints={[
            [width, hys.slice(-1)[0]],
            [width, graphHeight],
            [0, graphHeight]
          ]}
          innerProps={{
            class: 'humidity'
          }}
        />
      </svg>
    </div>
  )
}

function TemperatureGraph({
  columnWidth,
  graphHeight,
  width,
  temperature,
  apparentTemperature,
  dewPoint
}) {
  let min =
    Math.floor(Math.min(...temperature, ...apparentTemperature, ...dewPoint)) -
    3
  let max =
    Math.ceil(Math.max(...temperature, ...apparentTemperature, ...dewPoint)) + 3
  min = min - (((min % 5) + 5) % 5)
  max = max + ((5 - (((max % 5) + 5) % 5)) % 5)

  if (isNaN(min) || isNaN(max)) return

  let helperLineStep = 5
  let helperLineCount = (max - min) / helperLineStep + 1

  while (helperLineCount > 7) {
    helperLineStep += helperLineStep === 5 ? 5 : 10
    let mod = x => ((x % helperLineStep) + helperLineStep) % helperLineStep

    min = min - mod(min)
    max = max + ((helperLineStep - mod(max)) % helperLineStep)
    helperLineCount = (max - min) / helperLineStep + 1
  }

  let xs = temperature.map((_, i) => i * columnWidth + columnWidth / 2)

  let getY = t => graphHeight * (min === max ? 0.5 : (max - t) / (max - min))
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
        acc.length === 0 ||
        (extrema.index - acc.slice(-1)[0].index >= 2 &&
          Math.round(temperature[extrema.index]) !==
            Math.round(temperature[acc.slice(-1)[0].index]))
      ) {
        acc.push(extrema)
      }

      return acc
    }, [])

  return (
    <div class="temperature-graph">
      <svg width={width} height={graphHeight}>
        <g class="helperlines">
          {[...Array(helperLineCount)].map((_, i) => (
            <line
              x1="0"
              y1={getY(min + i * helperLineStep)}
              x2={width}
              y2={getY(min + i * helperLineStep)}
              stroke-width="1"
            />
          ))}
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
            cx={0}
            cy={0}
            r="4"
          />,
          <circle
            class="apparent"
            style={{transform: `translate(${x}px, ${atys[i]}px)`}}
            cx={0}
            cy={0}
            r="4"
          />,
          <circle
            class="temperature"
            style={{transform: `translate(${x}px, ${tys[i]}px)`}}
            cx={0}
            cy={0}
            r="4"
          />
        ])}
      </svg>

      <ol class="labels">
        {labels.map(({index: i, position}) => (
          <li
            style={{
              left: i * columnWidth + columnWidth / 2,
              top:
                position === 'bottom'
                  ? getY(Math.min(temperature[i], apparentTemperature[i]))
                  : 'auto',
              bottom:
                position === 'top'
                  ? graphHeight -
                    getY(Math.max(temperature[i], apparentTemperature[i]))
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
              <br />
            ]}
            {Math.round(temperature[i])}°
            {temperature[i] - apparentTemperature[i] >= 1 && [
              <br />,
              <em>{Math.round(apparentTemperature[i])}°</em>
            ]}
          </li>
        ))}
      </ol>
    </div>
  )
}

function MainLabels({columnWidth, labels}) {
  return (
    <ol class="main-labels">
      {labels.map(({key, x, type, label}) => (
        <li
          key={key}
          class={type}
          style={{transform: `translateX(${x * columnWidth}px)`}}
        >
          {label}
        </li>
      ))}
    </ol>
  )
}

export default function WeatherTimeline({
  style = {},
  columnWidth = 24,
  graphHeight = 150,
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
  precipitation = [],
  onColumnClick = () => {}
}) {
  let width = columnWidth * tickLabels.length

  let graphProps = {
    columnWidth,
    graphHeight,
    width
  }

  let elementRef = useRef()
  let scrollContainerRef = useRef(null)
  let scrollColumnIntoViewTimeoutIdRef = useRef(null)

  useEffect(function getRefs() {
    function findScrollContainer(node) {
      if (node == null) {
        return null
      }

      if (node.scrollWidth > node.clientWidth) {
        return node
      } else {
        return findScrollContainer(node.parentNode)
      }
    }

    scrollContainerRef.current = findScrollContainer(elementRef.current)
  }, [])

  useEffect(
    function scrollColumnIntoView() {
      if (selectedColumn != null) {
        clearTimeout(scrollColumnIntoViewTimeoutIdRef.current)

        scrollColumnIntoViewTimeoutIdRef.current = setTimeout(() => {
          scrollIntoView(elementRef.current.querySelector('.selected'), {
            behavior: 'smooth',
            boundary: scrollContainerRef.current
          })
        }, 100)
      }
    },
    [selectedColumn]
  )

  let selectColumnDeps = [
    columnWidth,
    tickLabels.length,
    selectedColumn,
    onColumnClick
  ]

  let selectColumnByClientX = useCallback(clientX => {
    elementRef.current.focus()

    let {left} = elementRef.current.getBoundingClientRect()
    let paddingLeft = elementRef.current.querySelector('.graph').offsetLeft
    let column = Math.floor((clientX - left - paddingLeft) / columnWidth)

    if (
      column !== selectedColumn &&
      column >= 0 &&
      column < tickLabels.length
    ) {
      onColumnClick({column})
    }
  }, selectColumnDeps)

  let handleMouseMove = useCallback(evt => {
    if (evt.buttons === 1) {
      evt.preventDefault()

      selectColumnByClientX(evt.clientX)
    }
  }, selectColumnDeps)

  return (
    <div
      ref={elementRef}
      class="weather-timeline"
      style={{...style, boxSizing: 'content-box', width}}
      tabIndex="0"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseMove}
      onTouchStart={useCallback(evt => {
        let touch = evt.touches.item(0)
        if (touch == null) return

        selectColumnByClientX(touch.clientX)
      }, selectColumnDeps)}
      onKeyDown={useCallback(
        evt => {
          if (['ArrowLeft', 'ArrowRight'].includes(evt.key)) {
            evt.preventDefault()

            let step = evt.key === 'ArrowLeft' ? -1 : 1
            if (selectedColumn == null) selectedColumn = 0

            onColumnClick({
              column: Math.max(
                0,
                Math.min(selectedColumn + step, tickLabels.length - 1)
              )
            })
          }
        },
        [selectedColumn, tickLabels.length, onColumnClick]
      )}
    >
      <NightBackground
        columnWidth={columnWidth}
        width={width}
        nightColumns={nightColumns}
      />

      <SunBar columnWidth={columnWidth} uvIndex={uvIndex} />

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
        precipitation={precipitation
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
              let result = Math.max(
                ...entries.filter(x => x[key] != null).map(x => x[key])
              )
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
          })}
      />

      <div
        class="graph"
        style={{
          width: columnWidth * tickLabels.length,
          height: graphHeight
        }}
      >
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

      <MainLabels columnWidth={columnWidth} labels={labels} />

      {selectedColumn != null && (
        <div
          class="selected"
          style={{
            width: columnWidth,
            transform: `translateX(${columnWidth * selectedColumn}px)`
          }}
        />
      )}
    </div>
  )
}
