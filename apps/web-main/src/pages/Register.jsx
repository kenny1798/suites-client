import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {apiAuth} from '@suite/api-clients'
import { Input, Button } from '@suite/ui'

export default function Register() {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setErrMsg('')
    try { await apiAuth.post('/auth/register', { name, email, password }); nav('/login') }
    catch (err) { setErrMsg(err.response?.data?.error || err.message || String(err)) }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">CREATE ACCOUNT</h1>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="text-sm">Full Name</label><Input value={name} onChange={e=>setName(e.target.value)} required/></div>
        <div><label className="text-sm">Email</label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div><label className="text-sm">Password</label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
        <Button type="submit" className="w-full mt-2">Sign Up</Button>
      </form>
      {errMsg && <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errMsg}</div>}
      <p className="mt-3 text-center text-sm">Already have an account? <Link to="/login" className="text-blue-600">Sign in</Link></p>
    </div>
  )
}
