import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Vote, Clock, CheckCircle } from 'lucide-react'
import VoterSidebar from '../components/VoterSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function VoterDashboard() {
  const [elections, setElections] = useState([])
  const [myVotes, setMyVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const username = localStorage.getItem('username')
  const voterId = localStorage.getItem('voter_id')

  useEffect(() => {
    Promise.all([api.get('/elections/'), api.get('/votes/my/')])
      .then(([e, v]) => { setElections(e.data); setMyVotes(v.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hasVoted = (id) => myVotes.some(v => v.election_id === id)
  const activeElections = elections.filter(e => e.status === 'active')

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <main className="flex-1 lg:ml-60 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title={`Welcome, ${username}! 👋`} subtitle={`Voter ID: ${voterId}`} />
        <main className="flex-1 p-4 lg:p-8">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Active', value: activeElections.length, icon: '🗳️', color: 'text-green-600' },
              { label: 'Voted', value: myVotes.length, icon: '✅', color: 'text-blue-600' },
              { label: 'Closed', value: elections.filter(e => e.status === 'closed').length, icon: '📊', color: 'text-purple-600' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-3 lg:p-5 shadow-sm text-center">
                <span className="text-xl lg:text-2xl">{stat.icon}</span>
                <div className={`text-2xl lg:text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-400 text-xs mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Active Elections */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Vote size={16} className="text-orange-500" />
              <h2 className="font-bold text-gray-800">Active Elections</h2>
            </div>
            {activeElections.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
                No active elections at the moment.
              </div>
            ) : (
              <div className="space-y-3">
                {activeElections.map((election, i) => (
                  <motion.div key={election.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <span className="bg-green-100 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-lg">ACTIVE</span>
                      {hasVoted(election.id) && (
                        <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle size={10} /> Voted
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{election.title}</h3>
                    {election.description && <p className="text-gray-400 text-sm mb-2 line-clamp-2">{election.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><Clock size={10} /> {new Date(election.end_date).toLocaleDateString()}</span>
                      <span>👥 {election.candidates?.length || 0} candidates</span>
                    </div>
                    {hasVoted(election.id) ? (
                      <div className="w-full bg-gray-100 text-gray-400 font-medium py-3 rounded-xl text-center text-sm">
                        ✅ You have already voted
                      </div>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/vote/${election.id}`)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                        🗳️ Cast Your Vote
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Voting History */}
          <div>
            <h2 className="font-bold text-gray-800 mb-3">My Voting History</h2>
            {myVotes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
                You haven't voted in any election yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {myVotes.map((vote, i) => (
                  <div key={i} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${i !== myVotes.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={14} className="text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{vote.election}</p>
                        <p className="text-xs text-gray-400 truncate">For: <span className="text-orange-500 font-medium">{vote.candidate}</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(vote.cast_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}