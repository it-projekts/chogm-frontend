import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const tokenRes = await api.post('/auth/token/', {
        username: form.username.trim(),
        password: form.password,
      })
      localStorage.setItem('access', tokenRes.data.access)
      localStorage.setItem('refresh', tokenRes.data.refresh)

      const profileRes = await api.get('/auth/profile/')
      const user = profileRes.data
      localStorage.setItem('is_staff', String(user.is_staff))
      localStorage.setItem('username', user.username)
      localStorage.setItem('voter_id', user.voter_id || '')

      if (user.is_staff === true) {
        window.location.replace('/admin')
      } else {
        window.location.replace('/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#1a1c2e' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-sm">

        <div className="rounded-2xl border border-white/10 p-8 shadow-2xl"
          style={{ background: '#22243a' }}>

          {/* Icon */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-white text-center mb-0.5">CHOGM 16th - INT</h1>
          <p className="text-slate-400 text-center text-sm mb-7">Secure Online Voting System</p>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Username</label>
              <input type="text" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all text-sm"
                placeholder="Enter your username" required />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all text-sm pr-12"
                  placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-sm">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : '🔐 Sign In'}
            </motion.button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            New voter?{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium">Register with secret code</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}