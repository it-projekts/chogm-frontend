import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle } from 'lucide-react'
import VoterSidebar from '../components/VoterSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function VoterElections() {
  const [elections, setElections] = useState([])
  const [myVotes, setMyVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.get('/elections/'), api.get('/votes/my/')])
      .then(([e, v]) => { setElections(e.data); setMyVotes(v.data) })
      .finally(() => setLoading(false))
  }, [])

  const hasVoted = (id) => myVotes.some(v => v.election_id === id)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Elections" subtitle="All available elections." />
        <main className="flex-1 p-4 lg:p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-4">All Elections</h1>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : elections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              No elections available.
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map((election, i) => (
                <motion.div key={election.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      election.status === 'active' ? 'bg-green-100 text-green-600' :
                      election.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-100 text-amber-600'}`}>
                      {election.status.toUpperCase()}
                    </span>
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
                  {election.status === 'active' && !hasVoted(election.id) && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/vote/${election.id}`)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-orange-500/20">
                      🗳️ Cast Your Vote
                    </motion.button>
                  )}
                  {hasVoted(election.id) && (
                    <div className="w-full bg-gray-100 text-gray-400 font-medium py-3 rounded-xl text-center text-sm">
                      ✅ You have already voted
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}