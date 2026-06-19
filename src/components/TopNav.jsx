import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, User, Lock, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function TopNav({ title, subtitle }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const isAdmin = localStorage.getItem('is_staff') === 'true'

  useEffect(() => {
    api.get('/auth/profile/').then(res => {
      setProfile({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const logout = () => { localStorage.clear(); navigate('/login') }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.patch('/auth/profile/', profile)
      setMessage('Profile updated successfully!')
      setTimeout(() => setShowProfileModal(false), 1500)
    } catch { setError('Failed to update profile') }
    finally { setSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.post('/auth/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      setMessage('Password changed! Logging out...')
      setTimeout(() => { localStorage.clear(); navigate('/login') }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm"

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-white border-b border-gray-100">
        <div className="pl-10 lg:pl-0">
          <h2 className="text-base lg:text-lg font-bold text-gray-800 truncate max-w-[180px] lg:max-w-none">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 hidden sm:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2" ref={dropdownRef}>
          <button onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-xl hover:bg-gray-50 transition-all border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {username?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                Hello, <span className="text-orange-500">{username}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{isAdmin ? 'Administrator' : 'Voter'}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-4 top-16 w-52 rounded-2xl border border-gray-100 shadow-xl bg-white overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{username}</p>
                      <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'Voter'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-1.5">
                  <button onClick={() => { setShowDropdown(false); setMessage(''); setError(''); setShowProfileModal(true) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all">
                    <User size={15} className="text-orange-500" /> Update Profile
                  </button>
                  <button onClick={() => { setShowDropdown(false); setMessage(''); setError(''); setShowPasswordModal(true) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all">
                    <Lock size={15} className="text-blue-500" /> Change Password
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Update Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-orange-50"><User size={18} className="text-orange-500" /></div>
                <h2 className="text-xl font-bold text-gray-800">Update Profile</h2>
              </div>
              {message && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 mb-4 text-sm">{message}</div>}
              {error && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-3 mb-4 text-sm">{error}</div>}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">First Name</label>
                    <input type="text" value={profile.first_name} onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                      className={inputClass} placeholder="John" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Last Name</label>
                    <input type="text" value={profile.last_name} onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                      className={inputClass} placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Email</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className={inputClass} placeholder="john@example.com" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowProfileModal(false)}
                    className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">Cancel</button>
                  <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-blue-50"><Lock size={18} className="text-blue-500" /></div>
                <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
              </div>
              {message && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 mb-4 text-sm">{message}</div>}
              {error && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-3 mb-4 text-sm">{error}</div>}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Current Password</label>
                  <input type="password" value={passwordForm.old_password}
                    onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className={inputClass} placeholder="Enter current password" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">New Password</label>
                  <input type="password" value={passwordForm.new_password}
                    onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className={inputClass} placeholder="Min. 6 characters" required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className={inputClass} placeholder="Repeat new password" required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPasswordModal(false)}
                    className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">Cancel</button>
                  <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                    {saving ? 'Changing...' : 'Change Password'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}