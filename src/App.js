import React, { Component } from 'react'
import Hero from './Hero'
// import Highscores from './HighScores'
import GameOver from './GameOver'

import { clamp } from './utils'

import 'bulma/css/bulma.css'
import './App.css'

/**
TODO:
 - Better Game over screen
 - keep score during game over, should show you the highest score you've gotten so far.
 - if you typed the word wrong a punishment needs to be added
 - timer needs to get faster overtime
*/

const initialState = {
  currWord: undefined,
  score: 0,
  textValue: '',
  timer: 0,
  intervalID: null,
  difficulty: 100
}

const timerClamp = clamp(0, 100)
const difficultyClamp = clamp(10, 100)

class App extends Component {
  constructor(props) {
    super(props)
    this.state = initialState
  }

  componentWillMount() {
    let socket = this.props.socket

    socket.on('connect', data => {
      console.log('connecting')
    })

    socket.on('new_word', data => {
      this.setState({...this.state, currWord: data.newWord, textValue: '', timer: timerClamp(this.state.timer - data.reduction)})
    })

    socket.on('first_word', data => {
      //Setting up the timer
      const intervalID = setInterval(() => {
        this.state.timer < 100
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      }, this.state.difficulty)

        this.setState({...this.state, currWord: data, textValue: '', intervalID})
    })

    socket.on('increase_timer', () => {
      this.setState({...this.state, textValue: '', timer: timerClamp(this.state.timer + 2)})
    })

    socket.on('game_over', () => this.gameOver())

    socket.on('update_score', score => {
      let newScore = this.state.score + score
      if(newScore % 10 === 0) {
        //clear the old timer
        clearInterval(this.state.intervalID)

        const newDifficulty = difficultyClamp(this.state.difficulty - 30)
        //start a new one
        const intervalID = setInterval(() => {
          this.state.timer < 100
            ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
            : this.gameOver()
        }, newDifficulty)

        //trigger render
        this.setState({...this.state, score: newScore, difficulty: newDifficulty, intervalID})
      } else {
        this.setState({...this.state, score: newScore})
      }
    })
  }

  gameOver() {
    clearInterval(this.state.intervalID)
    // alert('YOU LOST!')
    GameOver()
    this.setState(initialState)
  }

  handleSubmit(event) {
    event.preventDefault()
    if(this.state.textValue.trim() !== '') {
      this.props.socket.emit('check_word', {
        currWord: this.state.currWord,
        answer: this.state.textValue.toLowerCase()
      })
    }
  }

  handleTextChange(event) {
    this.setState({...this.state, textValue: event.target.value})
  }

  render() {
    const Controls = this.state.currWord === undefined
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
