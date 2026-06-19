import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, LogIn, Vote, UserCheck, UserX, Shield, Upload, AlertTriangle } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

const actionConfig = {
  login_success: { label: 'Login Success', color: 'text-green-600 bg-green-100', icon: LogIn },
  login_failed: { label: 'Login Failed', color: 'text-red-500 bg-red-100', icon: AlertTriangle },
  vote_cast: { label: 'Vote Cast', color: 'text-blue-600 bg-blue-100', icon: Vote },
  voter_registered: { label: 'Voter Registered', color: 'text-purple-600 bg-purple-100', icon: UserCheck },
  voter_deactivated: { label: 'Deactivated', color: 'text-red-500 bg-red-100', icon: UserX },
  voter_activated: { label: 'Activated', color: 'text-green-600 bg-green-100', icon: UserCheck },
  election_created: { label: 'Election Created', color: 'text-orange-500 bg-orange-100', icon: Shield },
  election_activated: { label: 'Election Activated', color: 'text-green-600 bg-green-100', icon: Shield },
  election_closed: { label: 'Election Closed', color: 'text-gray-600 bg-gray-100', icon: Shield },
  bulk_upload: { label: 'Bulk Upload', color: 'text-blue-600 bg-blue-100', icon: Upload },
}

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = filterAction ? `?action=${filterAction}` : ''
      const { data } = await api.get(`/audit-log/${params}`)
      setLogs(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [filterAction])

  const filtered = logs.filter(log =>
    log.username.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.ip_address?.includes(search)
  )

  const stats = {
    total: logs.length,
    logins: logs.filter(l => l.action === 'login_success').length,
    failed: logs.filter(l => l.action === 'login_failed').length,
    votes: logs.filter(l => l.action === 'vote_cast').length,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Audit Trail" subtitle="Track all system activity and login attempts." />
        <main className="flex-1 p-4 lg:p-8">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Audit Trail</h1>
              <p className="text-gray-400 text-sm">Last 200 system events.</p>
            </div>
            <button onClick={fetchLogs}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            {[
              { label: 'Total Events', value: stats.total, icon: '📋', color: 'text-blue-600' },
              { label: 'Successful Logins', value: stats.logins, icon: '✅', color: 'text-green-600' },
              { label: 'Failed Logins', value: stats.failed, icon: '⚠️', color: 'text-red-500' },
              { label: 'Votes Cast', value: stats.votes, icon: '🗳️', color: 'text-purple-600' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-4 shadow-sm">
                <span className="text-lg lg:text-xl">{stat.icon}</span>
                <div className={`text-xl lg:text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all text-sm shadow-sm"
                placeholder="Search logs..." />
            </div>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:outline-none focus:border-orange-400 transition-all text-sm shadow-sm">
              <option value="">All Actions</option>
              {Object.entries(actionConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Mobile Cards */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              No audit logs found.
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="lg:hidden space-y-3">
                {filtered.map((log) => {
                  const config = actionConfig[log.action] || { label: log.action, color: 'text-gray-600 bg-gray-100', icon: Shield }
                  const Icon = config.icon
                  return (
                    <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${config.color}`}>
                          <Icon size={10} /> {config.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {log.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{log.username || 'Unknown'}</span>
                        {log.ip_address && (
                          <span className="font-mono text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">{log.ip_address}</span>
                        )}
                      </div>
                      {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Action', 'User', 'IP Address', 'Details', 'Timestamp'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((log) => {
                        const config = actionConfig[log.action] || { label: log.action, color: 'text-gray-600 bg-gray-100', icon: Shield }
                        const Icon = config.icon
                        return (
                          <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg w-fit ${config.color}`}>
                                <Icon size={10} /> {config.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                                  {log.username?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{log.username || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{log.ip_address || '—'}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                            <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}