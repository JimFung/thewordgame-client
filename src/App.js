import React, { Component } from 'react'
import Hero from './Hero'
import Menu from './Menu'

import { clamp } from './utils'

import 'bulma/css/bulma.css'
import './App.css'

/**
TODO:
 - keep score during game over, should show you the highest score you've gotten so far.
 - MULTIPLAYER
*/

const initialState = {
  currWord: undefined,
  score: 0,
  textValue: '',
  timer: 0,
  intervalID: null,
  difficulty: 100,
  room: null
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
      if(newScore % 5 === 0) {
        //clear the old timer
        clearInterval(this.state.intervalID)

        const newDifficulty = difficultyClamp(this.state.difficulty - 25)
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

    //multiplayer events
    socket.on('join_room', room => {
      console.log(`requesting to join ${room}`)
      socket.emit('join', room)
      this.setState({...this.state, room})
    })

    socket.on('both_players_ready', () => {
      console.log('HELLO!?')
    })
  }

  gameOver() {
    clearInterval(this.state.intervalID)
    this.setState({...initialState, currWord: "Game Over", score: this.state.score})
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
    const Controls = (this.state.currWord === undefined || this.state.currWord === "Game Over")
      ? <Menu socket={this.props.socket} />
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
