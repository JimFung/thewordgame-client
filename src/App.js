import React, { Component } from 'react'
import Hero from './Hero'
import Menu from './Menu'

import { clamp } from './utils'

import 'bulma/css/bulma.css'
import './App.css'

/**
TODO:
  - Keep multiplayer timers in fixed state after game to show how much you won/lost by
  - input should be rendered after multiplayer game is over
  - should render score for single player games
  - should gracefully disconnect/cleanup room
*/

const initialState = {
  currWord: undefined,
  score: 0,
  textValue: '',
  timer: 0,
  timerIntervalID: null,
  difficulty: 100,
  room: null,
  opponentTimer: 0,
  ointerval: null,
  oid: null
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
      const timerIntervalID = setInterval(() => {
        this.state.timer < 100
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      }, this.state.difficulty)

        this.setState({...this.state, currWord: data, textValue: '', timerIntervalID})
    })

    socket.on('penalty', () => this.setState({...this.state, textValue: '', timer: timerClamp(this.state.timer + 2)}))

    socket.on('update_score', score => {
      const newScore = this.state.score + score
      if(newScore % 5 === 0) {
        const { difficulty, timerIntervalID } = this.increaseSpeed()

        //trigger render
        this.setState({...this.state, score: newScore, difficulty, timerIntervalID})
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

    socket.on('oid', oid => this.setState({...this.state, oid}))

    socket.on('update_opponent_timer', newTime => this.setState({...this.state, opponentTimer: newTime}))

    socket.on('increase_speed', () => {
      //clear the old timer
      console.log('increasing speed')
      const { difficulty, timerIntervalID } = this.increaseSpeed()
      this.setState({...this.state, difficulty, timerIntervalID})
    })

    socket.on('game_over', () => this.gameOver())

    socket.on('both_players_ready', () => {
      const ointerval = setInterval(() => socket.emit('trigger_update_opponent_timer', {to: this.state.oid, newTime: this.state.timer}), 10)
      this.setState({...this.state, ointerval})
    })
  }

  increaseSpeed() {
    //clear the old timer
    clearInterval(this.state.timerIntervalID)

    const difficulty = difficultyClamp(this.state.difficulty - 15)
    //start a new one
    const timerIntervalID = setInterval(() => {
      if(this.state.oid) {
        // Multiplayer Logic
        (this.state.timer < 100 && this.state.opponentTimer < 100)
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      } else {
        // Single Player Logic
        this.state.timer < 100
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      }
    }, difficulty)
    return { difficulty, timerIntervalID }
  }

  gameOver() {
    if(this.state.oid) {
      //Multiplayer logic
      // clear ointerval, tell opponent that you've finished the game.
      clearInterval(this.state.timerIntervalID)
      clearInterval(this.state.ointerval)
      let currWord
      if(this.state.timer > this.state.opponentTimer) {
        currWord = `You Lose!`
      } else if(this.state.timmer === this.state.opponentTimer) {
        currWord = `Draw!`
      } else {
        currWord = `You Win!`
      }
      this.setState({...initialState, currWord})
    } else {
      //Single player logic
      clearInterval(this.state.timerIntervalID)
      this.setState({...initialState, currWord: "Game Over", score: this.state.score})
    }
  }

  handleSubmit(event) {
    event.preventDefault()
    if(this.state.textValue.trim() !== '') {
      this.props.socket.emit('check_word', {
        currWord: this.state.currWord,
        answer: this.state.textValue.toLowerCase(),
        isMultiplayer: Boolean(this.state.oid)
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

    const HUD = (
      <div className="container box">
        <h1 className="title is-1">{this.state.currWord}</h1>
        { this.state.room
          ? <p className="subtitle is-5 is-pulled-left">YOU</p>
          : <span></span>
        }
        <progress className="progress is-success is-medium" value={this.state.timer} max="100"></progress>
        { this.state.room
          ? (
              <div>
                <p className="subtitle is-5 is-pulled-left">THE OTHER GUY</p>
                <progress className="progress is-danger is-medium" value={this.state.opponentTimer} max="100"></progress>
              </div>
            )
          : <span></span> }
      </div>
    )
    return (
      <div className="App">
        <Hero />
        <section className="section">
          {HUD}
          {Controls}
        </section>
      </div>
    )
  }
}

export default App
