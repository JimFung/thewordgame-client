import React, { Component } from 'react'
import 'bulma/css/bulma.css'

class GameOver extends Component {

  handleClick(e) {
    //TODO: close the notification
  }

  render() {
    return (
      <div className="notification is-danger column is-4 is-offset-4 is-overlay">
        <button className="delete" onClick={this.handleClick.bind(this)}></button>
        <h1 className="title is-large is-spaced">GAME OVER!!</h1>
        <h2 className="subtitle">Final Score</h2>
        <h1 className="title">10</h1>
      </div>
    )
  }
}

export default GameOver
