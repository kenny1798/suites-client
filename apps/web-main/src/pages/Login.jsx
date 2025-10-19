import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@suite/auth'
import { Input, Button } from '@suite/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const { loginWithEmail } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state?.from?.pathname) || '/'

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrMsg('')
    try { await loginWithEmail(email, password); nav(from, { replace: true }) }
    catch (err) {
      const msg = err.response?.data?.error || err.message || String(err)
      setErrMsg(msg)
    }
  }

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_SERVER}/auth/google`
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">SIGN IN</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <div><label className="text-sm">Email</label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div><label className="text-sm">Password</label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
        <Button type="submit" className="w-full mt-2">Sign In</Button>
      </form>
      <Button onClick={handleGoogle} className="w-full mt-3 bg-red-600 hover:bg-red-700">Sign in with Google</Button>
      {errMsg && <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errMsg}</div>}
      <p className="mt-3 text-center text-sm">No Account? <Link to="/register" className="text-blue-600">Register</Link></p>
    </div>
  )
}
