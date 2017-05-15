import React, { Component } from 'react'
import 'bulma/css/bulma.css'
import './Hero.css'

/**
  The Banner at the top of the page.
*/
class Hero extends Component {
  render() {
    return (
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title is-spaced">The Word Game</h1>
            <h2 className="subtitle">Typos incoming</h2>
          </div>
        </div>
      </section>
    )
  }
}

export default Hero
