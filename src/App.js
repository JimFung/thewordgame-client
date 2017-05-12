import React, { Component } from 'react'
import Hero from './Hero'
// import Highscores from './HighScores'

import 'bulma/css/bulma.css'
import './App.css'

const initialState = {
  currWord: '',
  score: 0,
  textValue: '',
  timer: 0,
  intervalID: null
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = initialState
  }

  componentWillMount() {
    let socket = this.props.socket

    socket.on('connect', data => {
      console.log('connecting')
      // socket.emit('join', 'New User Joined.')
    })

    socket.on('new_word', data => {
      this.setState({...this.state, currWord: data, textValue: '', timer: this.state.timer - 2})
    })

    socket.on('first_word', data => {
      //Setting up the timer
      const intervalID = setInterval(() => {
        this.state.timer < 100
          ? this.setState({...this.state, timer: this.state.timer + 0.1})
          : this.gameOver()
      }, 100)

        this.setState({...this.state, currWord: data, textValue: '', intervalID})
    })

    socket.on('game_over', () => this.gameOver())

    socket.on('update_score', score => {
      this.setState({...this.state, score: this.state.score + score})
    })
  }

  gameOver() {
    clearInterval(this.state.intervalID)
    alert('YOU LOST!')
    this.setState(initialState)
  }

  handleSubmit(event) {
    event.preventDefault()
    if(this.state.textValue.trim() !== '') {
      this.props.socket.emit('check_word', this.state.textValue.toLowerCase())
    }
  }

  handleTextChange(event) {
    this.setState({...this.state, textValue: event.target.value})
  }

  componentDidUpdate() {
    console.log('updated')
  }

  render() {
    const Controls = this.state.timer === 0
      ? <button className="button is-primary is-large" onClick={() => {this.props.socket.emit('start_game')}}>Start Game</button>
      : (
          <form id="chat_form" onSubmit={this.handleSubmit.bind(this)}>
            <input id="chat_input" type="text" autoComplete="off" value={this.state.textValue} onChange={this.handleTextChange.bind(this)} autoFocus />
          </form>
        )

    return (
      <div className="App">
        <Hero />
        <section className="section">
          <div className="container box">
            <h1 className="title is-1">{this.state.currWord}</h1>
            <progress className="progress is-danger is-medium" value={this.state.timer} max="100"></progress>
            <h3 className="subtitle is-3 is-spaced">Score: {this.state.score}</h3>
          </div>
          {Controls}
        </section>
      </div>
    )
  }
}

export default App
