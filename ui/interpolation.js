export function getMonotoneCubicInterpolation(xs, ys) {
  if (xs.length !== ys.length) throw new Error('Lengths do not match')
  if (xs.length <= 1) return x => ys[0]

  let createSpline = (x1, y1, x2, y2, m1, m2) => {
    let dx = x2 - x1
    let dy = y2 - y1
    if (dx === 0 || dy === 0) return x => y2

    let m = dy / dx

    let limitSlope = m => Math.sign(m) * Math.min(Math.abs(m), 3)
    let [lm1, lm2] = [m1, m2].map(limitSlope)

    let c = lm1 / m
    let a = (lm1 + lm2) / (2 * m) - 1
    let b = 1 - a - c
    let f = x => a * x ** 3 + b * x ** 2 + c * x

    return x => f((x - x1) / dx) * dy + y1
  }

  let slopes = ys.map((y, i) =>
    i === 0 || i === ys.length - 1 ? 0
    : (ys[i + 1] - y) * (y - ys[i - 1]) <= 0 ? 0
    : (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])
  )

  let splines = slopes.map((m, i) =>
    i === 0 ? null
    : createSpline(xs[i - 1], ys[i - 1], xs[i], ys[i], slopes[i - 1], m)
  )

  return x0 => {
    if (x0 <= xs[0]) return ys[0]

    let i = xs.findIndex(x => x >= x0)
    if (i <= 0) return ys.slice(-1)[0]

    return splines[i](x0)
  }
}
