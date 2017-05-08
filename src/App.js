import React, { Component } from 'react'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    console.log(props.socket)
    this.state = {
      currWord: '',
      score: 0,
      textValue: ''
    }
  }

  componentWillMount() {
    let socket = this.props.socket

    socket.on('connect', data => {
      console.log('connecting')
      socket.emit('join', 'New User Joined.')
    })

    socket.on('new_word', data => {
      console.log('setting new word')
      this.setState({...this.state, currWord: data, textValue: ''})
    })

    socket.on('game_over', () => {
      alert('YOU LOST!')
      this.setState({
        currWord: '',
        score: 0,
        textValue: ''
      })
    })

    socket.on('update_score', score => {
      console.log(document.getElementById('chat_input'))
      this.setState({...this.state, score: this.state.score + score})
    })
  }

  handleSubmit(event) {
    console.log('SUBMITTING')
    event.preventDefault()
    this.props.socket.emit('messages', this.state.textValue.toLowerCase())
  }

  handleTextChange(event) {
    console.log('updating text change')
    this.setState({...this.state, textValue: event.target.value})
  }

  render() {
    console.log('hi from render')
    return (
      <div className="App">
        <h1>The Word Game</h1>
        <div id="score">{this.state.score}</div>
        <div id="target_word">{this.state.currWord}</div>
        <form id="chat_form" onSubmit={this.handleSubmit.bind(this)}>
            <input type="text" autoComplete="off" id="chat_input" value={this.state.textValue} onChange={this.handleTextChange.bind(this)}/>
        </form>
      </div>
    )
  }
}

export default App
