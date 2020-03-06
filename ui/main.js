import {h, render} from 'preact'
import App from './component/App.js'
import StateContainer from './component/StateContainer.js'

let root = document.getElementById('root')
let dark = localStorage.getItem('lekaro.dark') === 'true'

if (dark) {
  document.body.classList.add('dark')
}

render(<StateContainer component={App} />, root)
