import {h} from 'preact'
import {useState, useEffect, useCallback} from 'preact/hooks'
import classnames from 'classnames'
import CurrentLocationIcon from '../resources/location.svg'

export default function LocationInfo({
  inputRef,
  units,
  loading,
  city,
  state,
  country,

  onSearch = () => {},
  onCurrentLocationClick = () => {},
  onUnitsButtonClick = () => {}
}) {
  let [input, setInput] = useState('')

  useEffect(
    function updateInput() {
      if (!loading) {
        setInput(city || state || country)
      }
    },
    [loading, city, state, country]
  )

  return (
    <div class={classnames('location-info', {loading})}>
      <h2>
        <input
          ref={inputRef}
          disabled={loading}
          value={input}
          placeholder="Location"
          autofocus={!input}
          onInput={useCallback(evt => {
            setInput(evt.currentTarget.value)
          }, [])}
          onKeyDown={useCallback(
            evt => {
              if (evt.key === 'Enter') {
                onSearch({value: input})
              }
            },
            [input]
          )}
          onBlur={useCallback(
            evt => {
              if (!loading) {
                setInput(city || state || country)
              }
            },
            [loading, city, state, country]
          )}
        />
      </h2>

      <div class="toolbar">
        <a
          class="currentlocation"
          href="#"
          title="Current Location"
          onClick={useCallback(
            evt => {
              evt.preventDefault()
              onCurrentLocationClick(evt)
            },
            [onCurrentLocationClick]
          )}
        >
          <CurrentLocationIcon viewBox="0 0 24 24" />
        </a>

        <h3>{[state, country].filter(x => !!x).join(', ') || 'Unknown'}</h3>

        <div class="options">
          <a
            class="units"
            href="#"
            title="Change Units"
            onClick={useCallback(
              evt => {
                evt.preventDefault()
                onUnitsButtonClick(evt)
              },
              [onUnitsButtonClick]
            )}
          >
            {units === 'si'
              ? 'Metric'
              : units === 'us'
              ? 'Imperial'
              : 'Unknown'}
          </a>
        </div>
      </div>
    </div>
  )
}
