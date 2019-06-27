import {h, Component} from 'preact'
import {getMonotoneCubicInterpolation} from '../interpolation.js'

export default class SmoothInterpolatingCurve extends Component {
  render() {
    try {
      let {xs, ys, step = 6, additionalPoints = [], innerProps = {}} = this.props
      let interpolation = getMonotoneCubicInterpolation(xs, ys)
      let [xStart, xEnd] = [xs[0], xs.slice(-1)[0]]
      let count = Math.ceil((xEnd - xStart) / step) + 1

      return <path
        {...innerProps}

        d={
          [...Array(count)].map((_, i) => Math.min(xStart + step * i, xEnd)).map((x, i) =>
            `${i === 0 ? 'M' : 'L'}${x},${interpolation(x)}`
          ).join(' ') + ' ' + additionalPoints.map(([x, y]) =>
            `L${x},${y}`
          ).join(' ')
        }
      />
    } catch (err) {}
  }
}
