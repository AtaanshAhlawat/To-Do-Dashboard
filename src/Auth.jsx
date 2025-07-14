import { useState } from 'react'
import { login, register } from './apiService'

export default function Auth({ onAuth }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const fn = isLogin ? login : register
    const res = await fn(username, password)
    if (res.token) {
      localStorage.setItem('token', res.token)
      onAuth()
    } else if (res.message) {
      setIsLogin(true)
    } else {
      setError(res.error || 'Error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
      <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  )
}