import React, { Component } from 'react'
import Hero from './Hero'
import Menu from './Menu'

import { clamp } from './utils'

import 'bulma/css/bulma.css'
import './App.css'

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
  oid: null,
  renderMenu: true,
  renderHUD: false
}

const timerClamp = clamp(0, 100)
const difficultyClamp = clamp(10, 100)

class App extends Component {
  constructor(props) {
    super(props)
    this.state = initialState
    this.socket = this.props.socket
  }

  componentWillMount() {
    let socket = this.socket

    socket.on('new_word',
      data => this.setState({...this.state, currWord: data.newWord, textValue: '', timer: timerClamp(this.state.timer - data.reduction)}))

    socket.on('first_word', data => {

      //Setting up the timer
      const timerIntervalID = setInterval(() => {
        this.state.timer < 100
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      }, this.state.difficulty)

        this.setState({...this.state, currWord: data, textValue: '', timerIntervalID, renderMenu: false, opponentTimer: 0, timer: 0})
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
      socket.emit('join', room)
      this.setState({...this.state, room, renderMenu: false, currWord: ''})
    })

    socket.on('oid', oid => this.setState({...this.state, oid}))

    socket.on('update_opponent_timer', newTime => this.setState({...this.state, opponentTimer: newTime}))

    socket.on('increase_speed', () => {
      //clear the old timer
      const { difficulty, timerIntervalID } = this.increaseSpeed()
      this.setState({...this.state, difficulty, timerIntervalID})
    })

    socket.on('game_over', leaver => this.gameOver(leaver))

    socket.on('both_players_ready', () => {
      const ointerval = setInterval(() => socket.emit('trigger_update_opponent_timer', {to: this.state.oid, newTime: this.state.timer}), 10)
      this.setState({...this.state, ointerval})
    })
  }

  increaseSpeed() {
    //clear the old timer
    clearInterval(this.state.timerIntervalID)

    const difficulty = difficultyClamp(this.state.difficulty - 20)
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

  gameOver(leaver) {
    if(this.state.oid) {
      //Multiplayer logic
      this.socket.emit('leave', this.state.room)
      clearInterval(this.state.timerIntervalID)
      clearInterval(this.state.ointerval)
      let currWord = ''
      if(leaver) {
        currWord = `Your opponent has disconnected.`
      } else {
        if(this.state.timer > this.state.opponentTimer) {
          currWord = `You Lose!`
        } else if(this.state.timmer === this.state.opponentTimer) {
          currWord = `Draw!`
        } else {
          currWord = `You Win!`
        }
      }
      this.setState({...initialState, currWord, renderHUD: true, timer: this.state.timer, opponentTimer: this.state.opponentTimer})
    } else {
      //Single player logic
      clearInterval(this.state.timerIntervalID)
      this.setState({...initialState, currWord: "Game Over", score: this.state.score, renderHUD: true})
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

  renderControls() {
    if(this.state.renderMenu) {
      return <Menu socket={this.socket} renderHUD={() => this.setState({...this.state, renderHUD: true, renderMenu: false})}/>
    } else {
      if(this.state.room) {
        if(this.state.oid) {
          return (<form id="chat_form" onSubmit={this.handleSubmit.bind(this)}>
            <input id="chat_input" type="text" autoComplete="off" value={this.state.textValue} onChange={this.handleTextChange.bind(this)} autoFocus />
          </form>)
        } else {
          return (<div>Waiting for an opponent!</div>)
        }
      } else {
        return (<form id="chat_form" onSubmit={this.handleSubmit.bind(this)}>
          <input id="chat_input" type="text" autoComplete="off" value={this.state.textValue} onChange={this.handleTextChange.bind(this)} autoFocus />
        </form>)
      }
    }
  }

  render() {
    const Controls = this.renderControls()

    const HUD = this.state.renderHUD
      ? (
        <div className="container box">
          <h1 className="title is-1">{this.state.currWord}</h1>
          { this.state.room || this.state.opponentTimer > 0
            ? <p className="subtitle is-5 is-pulled-left">YOU</p>
            : <span></span>
          }
          <progress className="progress is-success is-medium" value={this.state.timer} max="100"></progress>
          { this.state.room || this.state.opponentTimer > 0
            ? (
                <div>
                  <p className="subtitle is-5 is-pulled-left">THE OTHER GUY</p>
                  <progress className="progress is-danger is-medium" value={this.state.opponentTimer} max="100"></progress>
                </div>
              )
            : <h1 className="subtitle is-3">Score: {this.state.score}</h1> }
        </div>
      )
      : <div></div>

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
