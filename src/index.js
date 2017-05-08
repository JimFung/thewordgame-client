import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'

import io from 'socket.io-client'
let socket = io.connect('http://localhost:8000')

ReactDOM.render(
  <App socket={socket}/>,
  document.getElementById('root')
)
