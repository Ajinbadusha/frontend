import React from 'react'
import Logo from './Logo'
import './LoadingScreen.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <Logo variant="default" size="xl" />
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">Initializing Crawler...</p>
      </div>
    </div>
  )
}

