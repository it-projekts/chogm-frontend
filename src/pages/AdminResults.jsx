import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function AdminResults() {
  const [elections, setElections] = useState([])
  const [selected, setSelected] = useState('')
  const [election, setElection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/elections/').then(res => {
      setElections(res.data)
      if (res.data.length > 0) setSelected(res.data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selected) api.get(`/elections/${selected}/`).then(res => setElection(res.data))
  }, [selected])

  const totalVotes = election?.total_votes || 0
  const sorted = [...(election?.candidates || [])].sort((a, b) => b.vote_count - a.vote_count)
  const barColors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Election Results" subtitle="View detailed results and vote distribution." />
        <main className="flex-1 p-4 lg:p-8">

          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">Election Results</h1>
            <p className="text-gray-400 text-sm">View detailed results and vote distribution.</p>
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Select Election</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm shadow-sm">
              {elections.map(e => (
                <option key={e.id} value={e.id}>{e.title} [{e.status}]</option>
              ))}
            </select>
          </div>

          {election && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 lg:gap-5 mb-6">
                {[
                  { label: 'Total Votes', value: totalVotes, icon: '📊', color: 'text-orange-500' },
                  { label: 'Candidates', value: election.candidates?.length || 0, icon: '👥', color: 'text-blue-600' },
                  { label: 'Leading', value: sorted[0]?.full_name?.split(' ')[0] || 'N/A', icon: '🏆', color: 'text-green-600' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-5 shadow-sm">
                    <span className="text-xl lg:text-2xl">{stat.icon}</span>
                    <div className={`text-xl lg:text-2xl font-bold mt-1 truncate ${stat.color}`}>{stat.value}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Results */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-gray-800">{election.title}</h2>
                    <p className="text-gray-400 text-xs">{totalVotes} total votes cast</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    election.status === 'active' ? 'bg-green-100 text-green-600' :
                    election.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                    'bg-amber-100 text-amber-600'}`}>
                    {election.status.toUpperCase()}
                  </span>
                </div>

                {sorted.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">No candidates yet.</div>
                ) : (
                  <div className="space-y-5">
                    {sorted.map((candidate, i) => {
                      const pct = totalVotes > 0 ? Math.round((candidate.vote_count / totalVotes) * 100) : 0
                      const color = barColors[i % barColors.length]
                      const isLeading = i === 0 && candidate.vote_count > 0
                      return (
                        <div key={candidate.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {candidate.photo_url ? (
  <img src={candidate.photo_url} alt={candidate.full_name}
    className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0"
    onError={(e) => { e.target.style.display = 'none' }}
  />
) : (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
    style={{ background: color }}>
    {isLeading ? '🏆' : candidate.full_name.charAt(0)}
  </div>
)}
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">{candidate.full_name}</p>
                                <p className="text-xs text-gray-400">{candidate.party || 'Independent'}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <p className="font-bold text-gray-800 text-lg">{pct}%</p>
                              <p className="text-xs text-gray-400">{candidate.vote_count} vote{candidate.vote_count !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.15 }}
                              className="h-3 rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}

          {!loading && elections.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              No elections found.
            </div>
          )}
        </main>
      </div>
    </div>
  )
}