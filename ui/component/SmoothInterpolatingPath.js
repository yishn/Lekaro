import {h, Component} from 'preact'
import {getMonotoneCubicInterpolation} from '../interpolation.js'

export default class SmoothInterpolatingPath extends Component {
  render() {
    let {xs, ys, innerProps = {}} = this.props
    let interpolation = getMonotoneCubicInterpolation(xs, ys)
    let [xStart, xEnd] = [xs[0], xs.slice(-1)[0]]

    return <path
      {...innerProps}

      d={[...Array((xEnd - xStart) + 1)].map((_, i) => xStart + i).map((x, i) =>
        `${i === 0 ? 'M' : 'L'}${x},${interpolation(x)}`
      ).join(' ')}
    />
  }
}
