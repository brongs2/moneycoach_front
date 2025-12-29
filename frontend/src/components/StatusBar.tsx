import { useState, useEffect } from 'react'
import './StatusBar.css'

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="status-bar">
      <div className="status-bar-time">{formatTime(currentTime)}</div>
      <div className="status-bar-icons">
        <div className="status-bar-icon signal" />
        <div className="status-bar-icon wifi" />
        <div className="status-bar-icon battery" />
      </div>
    </div>
  )
}

export default StatusBar
