import {h, render} from 'preact'
import App from './component/App.js'
import StateContainer from './component/StateContainer.js'

let root = document.getElementById('root')

render(<StateContainer component={App} />, root)
