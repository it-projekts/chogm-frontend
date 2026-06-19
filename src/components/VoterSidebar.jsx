import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Vote, History, LogOut, Shield, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/elections', icon: Vote, label: 'Elections' },
  { to: '/my-votes', icon: History, label: 'My Votes' },
]

export default function VoterSidebar() {
  const [open, setOpen] = useState(false)
  const logout = () => { localStorage.clear(); window.location.href = '/login' }
  const username = localStorage.getItem('username')
  const voterId = localStorage.getItem('voter_id')

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#1a1c2e' }}>
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">CHOGM 16th - INT</p>
            <p className="text-xs text-slate-500 mt-0.5">Voter Portal</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs text-slate-600 uppercase font-semibold px-3 mb-2 tracking-widest">Menu</p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-orange-400' : 'text-slate-500'} />
                <span>{label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            {username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{username}</p>
            <p className="text-xs text-slate-500 font-mono truncate">{voterId}</p>
          </div>
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-orange-500 text-white shadow-lg">
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 h-full w-64 z-50 shadow-2xl">
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 z-40">
        <SidebarContent />
      </aside>
    </>
  )
}