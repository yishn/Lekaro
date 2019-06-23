import {DateTime} from 'luxon'

export function supportsTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en', {timeZone: timezone, hour: 'numeric'}).format()
    return true
  } catch (err) {}

  return false
}

export function fromUnixTimestamp(timestamp, timezone = null) {
  if (timezone != null && !supportsTimezone(timezone)) {
    timezone = null
  }

  return DateTime.fromSeconds(timestamp, {zone: timezone})
}
