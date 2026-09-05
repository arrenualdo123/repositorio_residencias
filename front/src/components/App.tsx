import { useState } from 'react'
import './App.css'
import { Landing } from './Landing'
import { AuthModal } from './AuthModal'

export default function App() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  return (
    <>
      <Landing
        openAuth={(mode) => {
          setAuthMode(mode)
          setAuthOpen(true)
        }}
      />

      {authOpen && (
        <AuthModal
          key={authMode}
          initialMode={authMode}
        />
      )}
    </>
  )
}