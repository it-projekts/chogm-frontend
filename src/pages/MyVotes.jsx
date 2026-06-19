import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import VoterSidebar from '../components/VoterSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function MyVotes() {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/votes/my/').then(res => setVotes(res.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="My Votes" subtitle="Your complete voting history." />
        <main className="flex-1 p-4 lg:p-8">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Voting History</h1>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : votes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              You haven't voted in any election yet.
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((vote, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="bg-green-100 p-2.5 rounded-xl flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{vote.election}</p>
                    <p className="text-gray-400 text-xs">For: <span className="text-orange-500 font-semibold">{vote.candidate}</span>{vote.party ? ` · ${vote.party}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{new Date(vote.cast_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-300">{new Date(vote.cast_at).toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}