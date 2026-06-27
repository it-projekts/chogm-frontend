import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, Users } from 'lucide-react'
import VoterSidebar from '../components/VoterSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function VotePage() {
  const { electionId } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/elections/${electionId}/`)
      .then(res => setElection(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [electionId])

  const handleVote = async () => {
    if (!selected) return
    setSubmitting(true)
    setError('')
    try {
      await api.post('/votes/cast/', { election_id: parseInt(electionId), candidate_id: selected })
      setVoted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cast vote.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <main className="flex-1 lg:ml-60 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </main>
    </div>
  )

  if (voted) return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Vote Cast!" subtitle="Your vote has been recorded" />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-gray-100 p-8 text-center w-full max-w-sm shadow-lg">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
              className="flex justify-center mb-5">
              <div className="bg-green-100 p-5 rounded-full">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </motion.div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Vote Cast Successfully!</h2>
            <p className="text-gray-400 mb-1 text-sm">You voted for</p>
            <p className="text-lg font-bold text-orange-500 mb-6">
              {election?.candidates?.find(c => c.id === selected)?.full_name}
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
              Back to Dashboard
            </motion.button>
          </motion.div>
        </main>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VoterSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title={election?.title || 'Vote'} subtitle="Select your candidate carefully" />
        <main className="flex-1 p-4 lg:p-8">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-800 mb-1">{election?.title}</h1>
            {election?.description && <p className="text-gray-400 text-sm mb-2">{election?.description}</p>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Clock size={10} /> Ends: {new Date(election?.end_date).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Users size={10} /> {election?.candidates?.length} candidates</span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 mb-5 text-sm text-orange-700 flex items-start gap-2">
            <span>🔒</span>
            <p>Your vote is <strong>secret and secure</strong>. You can only vote once. Review your selection carefully.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-3 mb-4 text-sm">{error}</div>
          )}

          <h2 className="font-bold text-gray-800 mb-3 text-sm">Select Your Candidate</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {election?.candidates?.map((candidate, i) => (
              <motion.div key={candidate.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(candidate.id)}
                className={`bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
                  selected === candidate.id
                    ? 'border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-start gap-3">
                 {candidate.photo_url ? (
  <img
    src={candidate.photo_url}
    alt={candidate.full_name}
    className={`w-14 h-14 rounded-xl object-cover border-2 transition-all flex-shrink-0 ${
      selected === candidate.id ? 'border-orange-400' : 'border-gray-100'
    }`}
    onError={(e) => {
      e.target.style.display = 'none'
      e.target.parentNode.querySelector('.photo-fallback').style.display = 'flex'
    }}
  />
) : null}
<div className={`photo-fallback w-14 h-14 rounded-xl items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
  candidate.photo_url ? 'hidden' : 'flex'
} ${selected === candidate.id ? 'bg-orange-500' : 'bg-gray-200 text-gray-500'}`}>
  {candidate.full_name.charAt(0)}
</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{candidate.full_name}</h3>
                      {selected === candidate.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-orange-500" />
                        </motion.div>
                      )}
                    </div>
                    {candidate.party && (
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-lg mt-1 font-medium ${
                        selected === candidate.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                      }`}>{candidate.party}</span>
                    )}
                    {candidate.bio && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{candidate.bio}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mb-3">
            Once submitted, your vote <strong className="text-gray-600">cannot</strong> be changed.
          </p>

          <motion.button
            whileHover={{ scale: selected ? 1.02 : 1 }}
            whileTap={{ scale: selected ? 0.98 : 1 }}
            onClick={handleVote}
            disabled={!selected || submitting}
            className={`w-full font-semibold py-4 rounded-xl transition-all text-base ${
              selected
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : selected ? '🗳️ Confirm & Submit Vote' : '👆 Select a candidate above'}
          </motion.button>
        </main>
      </div>
    </div>
  )
}