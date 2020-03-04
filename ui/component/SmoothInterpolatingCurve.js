import {h} from 'preact'
import {useMemo} from 'preact/hooks'
import {getMonotoneCubicInterpolation} from '../interpolation.js'

export default function SmoothInterpolatingCurve({
  xs,
  ys,
  step = 6,
  additionalPoints = [],
  innerProps = {}
}) {
  try {
    let points = useMemo(() => {
      let [xStart, xEnd] = [xs[0], xs.slice(-1)[0]]
      let count = Math.ceil((xEnd - xStart) / step) + 1
      let interpolation = getMonotoneCubicInterpolation(xs, ys)

      return [...Array(count)]
        .map((_, i) => Math.min(xStart + step * i, xEnd))
        .map(x => [x, interpolation(x)])
    }, [step, ...xs, ...ys])

    return (
      <path
        {...innerProps}
        d={[...points, ...additionalPoints]
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`)
          .join(' ')}
      />
    )
  } catch (err) {}
}
