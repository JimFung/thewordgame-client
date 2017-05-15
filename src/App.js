import React, { Component } from 'react'
import Hero from './Hero'
import Menu from './Menu'

import { clamp } from './utils'

import 'bulma/css/bulma.css'
import './App.css'

// initialte state of the application.
// Side note: Why did I use redux? it seemed like overkill for an application that didn't need to worry about routing, passing state between pages, or making HTTP requests
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

//Generateing 2 clamp functions (checkout utils.js for a longer explanation)
const timerClamp = clamp(0, 100)
const difficultyClamp = clamp(10, 100)

class App extends Component {
  constructor(props) {
    super(props)
    this.state = initialState
    this.socket = this.props.socket
  }

  componentWillMount() {
    //If the application will mount, then I set up all of the socket logic.
    let socket = this.socket

    //When we recieve a new word event, show it to the user, empty the form input, decrease the timer
    socket.on('new_word',
      data => this.setState({...this.state, currWord: data.newWord, textValue: '', timer: timerClamp(this.state.timer - data.reduction)}))

    //When we recieve the first word of the game, reset the timers, set the timer to start incrementing, show the word to the user, empty the text input, and make sure the menu doesn't render anymore.
    socket.on('first_word', data => {

      //Setting up the timer
      const timerIntervalID = setInterval(() => {
        this.state.timer < 100
          ? this.setState({...this.state, timer: timerClamp(this.state.timer + 0.1)})
          : this.gameOver()
      }, this.state.difficulty)

        this.setState({...this.state, currWord: data, textValue: '', timerIntervalID, renderMenu: false, opponentTimer: 0, timer: 0})
    })

    //increment the timer when the player gets the word wrong
    socket.on('penalty', () => this.setState({...this.state, textValue: '', timer: timerClamp(this.state.timer + 2)}))

    //Increment the score, if it hits a certain value then increase the difficulty
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
    //when we recieve the name of the room we're suppose to join, tell the server want want to join that room.
    socket.on('join_room', room => {
      socket.emit('join', room)
      this.setState({...this.state, room, renderMenu: false, currWord: ''})
    })

    //set the oid. the oid is the socket.id of the other player in your room.
    socket.on('oid', oid => this.setState({...this.state, oid}))

    //update the opponentTimer with its new time
    socket.on('update_opponent_timer', newTime => this.setState({...this.state, opponentTimer: newTime}))

    //increase the speed of the timer in a multiplayer game. In a single player game the speed of the timer depends on how the score (see update_score)
    socket.on('increase_speed', () => {
      const { difficulty, timerIntervalID } = this.increaseSpeed()
      this.setState({...this.state, difficulty, timerIntervalID})
    })

    //Your opponent has left the game.
    socket.on('game_over', leaver => this.gameOver(leaver))

    //Sets up the socket to send out our timer information every 10 ms, which is the fastest the timer can go.
    socket.on('both_players_ready', () => {
      const ointerval = setInterval(() => socket.emit('trigger_update_opponent_timer', {to: this.state.oid, newTime: this.state.timer}), 10)
      this.setState({...this.state, ointerval})
    })
  }

  //Logic to increase the timer speeds. since the intervals can't be changed, the previous interval is cleared and a new one is set in its place. the new intervalid is returned so it is the responsibilty of whoever calls this function to update the state with the new value.
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

  //takes an additional boolean param which signifies that the opponent left the game.
  //otherwise, stop timer callbacks, figure out the winner and let the playing know.
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
    //trim() prevents a blank string to be entered by accident.
    if(this.state.textValue.trim() !== '') {
      //if something was typed, send it to the server for validation
      this.props.socket.emit('check_word', {
        currWord: this.state.currWord,
        answer: this.state.textValue.toLowerCase(),
        isMultiplayer: Boolean(this.state.oid)
      })
    }
  }

  //update the value of the text input.
  handleTextChange(event) {
    this.setState({...this.state, textValue: event.target.value})
  }

  //Render helper. returns either the Menu component, or the text input for the game.
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

    //Render helping to determine which HUD should be displayed
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
