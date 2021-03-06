import React, { Component } from 'react'
import 'bulma/css/bulma.css'
import './Menu.css'

/**
  The buttons to start the game and instructions on how the game works.
  The buttons will fire off an event to the server to start the game in whichever mode was selected.
  The component has access to the socket through its props
*/

class Menu extends Component {
  render() {
    return (
      <section className="section">
        <div className="container">
          <div className="field is-grouped">
            <div className="control left-button">
              <div className="button is-success is-large" onClick={() => {this.props.renderHUD(); this.props.socket.emit('start_single')}}>
                Start Single Player
              </div>
            </div>
            <div className="control right-button">
              <div className="button is-info is-large" onClick={() => {this.props.renderHUD(); this.props.socket.emit('start_multiplayer')}}>
                Start Multiplayer game
              </div>
            </div>
          </div>
        </div>

        <div className="container instructions">
          <h2 className="title is-2">How to Play</h2>
          <ol>
            <li>Type the word on the screen.</li>
            <li>Get it right and the timer goes down. The longer the word, the more the timer drops.</li>
            <li>Get it wrong and the timer increases.</li>
            <li>The timer gets faster the higher your score. Watch out!</li>
          </ol>
        </div>
      </section>
    )
  }
}

export default Menu
