import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Register() {
  const [step, setStep] = useState(1)
  const [secretCode, setSecretCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [form, setForm] = useState({ username: '', password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const verifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/verify-code/', { secret_code: secretCode })
      setFullName(data.full_name)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'No records found')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register/', {
        secret_code: secretCode,
        username: form.username,
        password: form.password,
        confirm_password: form.confirm_password,
      })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/30">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 transition-all ${step > s ? 'bg-blue-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1 - Enter Secret Code */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-white text-center mb-1">Verify Your Code</h1>
                <p className="text-slate-400 text-center text-sm mb-6">Enter the secret code sent to your phone</p>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">{error}</div>
                )}
                <form onSubmit={verifyCode} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Secret Code</label>
                    <input type="text" value={secretCode}
                      onChange={e => setSecretCode(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-center text-lg font-mono tracking-widest"
                      placeholder="ENTER CODE" required />
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowRight size={18} /> Verify Code</>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 2 - Complete Registration */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-white text-center mb-1">Complete Registration</h1>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-center">
                  <p className="text-green-400 text-sm">✅ Code verified! Welcome, <strong>{fullName}</strong></p>
                </div>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm text-center">{error}</div>
                )}
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Username</label>
                    <input type="text" value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="Choose a username" required />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Password</label>
                    <input type="password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="Min. 6 characters" required />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Confirm Password</label>
                    <input type="password" value={form.confirm_password}
                      onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="Repeat your password" required />
                  </div>
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✨ Complete Registration'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 3 - Success */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                  className="flex justify-center mb-4">
                  <div className="bg-green-500/20 p-4 rounded-full">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">You're Registered!</h2>
                <p className="text-slate-400 mb-6">Your account has been created. You can now log in and vote.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all">
                  Go to Login
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <p className="text-center text-slate-400 text-sm mt-6">
              Already registered?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}