import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, Vote, BarChart2, ArrowUpRight } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

const MiniChart = ({ color, values }) => {
  const max = Math.max(...values, 1)
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 80}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#g${color.replace('#', '')})`} />
    </svg>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/stats/')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Elections', value: stats?.total_elections ?? 0, icon: Vote, color: '#10b981', bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', values: [2,4,3,6,5,8,7] },
    { label: 'Active Elections', value: stats?.active_elections ?? 0, icon: TrendingUp, color: '#f97316', bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-500', values: [1,3,2,5,4,6,5] },
    { label: 'Registered Voters', value: stats?.total_voters ?? 0, icon: Users, color: '#8b5cf6', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', values: [3,5,4,7,6,9,8] },
    { label: 'Votes Cast', value: stats?.total_votes ?? 0, icon: BarChart2, color: '#3b82f6', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', values: [1,2,4,3,6,5,7] },
  ]

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 lg:ml-60 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Dashboard" subtitle="Welcome back, System Administrator." />
        <main className="flex-1 p-4 lg:p-8">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-6">
            {statCards.map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-0.5">{card.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-800">{card.value}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${card.iconBg}`}>
                    <card.icon size={16} className={card.iconColor} />
                  </div>
                </div>
                <MiniChart color={card.color} values={card.values} />
              </motion.div>
            ))}
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Recent Elections */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Recent Elections</h2>
                  <p className="text-xs text-gray-400">Latest voting elections</p>
                </div>
                <button onClick={() => navigate('/admin/elections')}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium">
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              {!stats?.recent_elections?.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No elections yet.</div>
              ) : stats.recent_elections.map((e, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Vote size={14} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.total_votes} votes</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${
                    e.status === 'active' ? 'bg-green-100 text-green-600' :
                    e.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                    'bg-amber-100 text-amber-600'}`}>
                    {e.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Recent Voters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div>
                  <h2 className="font-bold text-gray-800 text-sm">Recent Voters</h2>
                  <p className="text-xs text-gray-400">Latest registered voters</p>
                </div>
                <button onClick={() => navigate('/admin/voters')}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium">
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              {!stats?.recent_voters?.length ? (
                <div className="p-8 text-center text-gray-400 text-sm">No voters yet.</div>
              ) : stats.recent_voters.map((v, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {v.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{v.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{v.phone_number}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${
                    v.is_used ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {v.is_used ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}