import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'

//importing socket io client
import io from 'socket.io-client'

//connecting to the server
let socket = io.connect('http://localhost:8000')

//Rendering the application, the socket created above is passed in as a prop to the application.
ReactDOM.render(
  <App socket={socket}/>,
  document.getElementById('root')
)
