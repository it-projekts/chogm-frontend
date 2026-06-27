import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, ChevronDown, ChevronUp, Users } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

export default function AdminElections() {
  const [elections, setElections] = useState([])
  const [showElectionModal, setShowElectionModal] = useState(false)
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [selectedElection, setSelectedElection] = useState(null)
  const [expandedElection, setExpandedElection] = useState(null)
  const [electionForm, setElectionForm] = useState({ title: '', description: '', start_date: '', end_date: '', status: 'draft' })
  const [candidateForm, setCandidateForm] = useState({ full_name: '', party: '', bio: '', display_order: 0, photo: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm"

  const fetchElections = async () => {
    try {
      const { data } = await api.get('/elections/')
      setElections(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchElections() }, [])

  const handleCreateElection = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/elections/', electionForm)
      setShowElectionModal(false)
      setElectionForm({ title: '', description: '', start_date: '', end_date: '', status: 'draft' })
      fetchElections()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('full_name', candidateForm.full_name)
      formData.append('party', candidateForm.party)
      formData.append('bio', candidateForm.bio)
      formData.append('display_order', candidateForm.display_order)
      formData.append('election', selectedElection.id)
      if (candidateForm.photo) formData.append('photo', candidateForm.photo)
      await api.post('/candidates/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowCandidateModal(false)
      setCandidateForm({ full_name: '', party: '', bio: '', display_order: 0, photo: null })
      fetchElections()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try { await api.patch(`/elections/${id}/`, { status }); fetchElections() }
    catch (err) { console.error(err) }
  }

  const deleteCandidate = async (id) => {
    if (!window.confirm('Delete this candidate?')) return
    try { await api.delete(`/candidates/${id}/`); fetchElections() }
    catch (err) { console.error(err) }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Elections" subtitle="Create and manage voting elections." />
        <main className="flex-1 p-4 lg:p-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">All Elections</h1>
              <p className="text-gray-400 text-sm">Manage your voting elections.</p>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowElectionModal(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-orange-500/20">
              <Plus size={15} /> New Election
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : elections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              No elections yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map((election) => (
                <motion.div key={election.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 lg:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 text-sm lg:text-base">{election.title}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg flex-shrink-0 ${
                            election.status === 'active' ? 'bg-green-100 text-green-600' :
                            election.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                            'bg-amber-100 text-amber-600'}`}>
                            {election.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          {election.candidates?.length || 0} candidates · {election.total_votes || 0} votes · Ends {new Date(election.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {election.status === 'draft' && (
                          <button onClick={() => updateStatus(election.id, 'active')}
                            className="text-xs bg-green-100 hover:bg-green-200 text-green-600 px-2.5 py-1.5 rounded-lg font-medium transition-all">
                            Activate
                          </button>
                        )}
                        {election.status === 'active' && (
                          <button onClick={() => updateStatus(election.id, 'closed')}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition-all">
                            Close
                          </button>
                        )}
                        <button onClick={() => { setSelectedElection(election); setShowCandidateModal(true) }}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1">
                          <Plus size={11} /> Candidate
                        </button>
                        <button onClick={() => setExpandedElection(expandedElection === election.id ? null : election.id)}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-all">
                          {expandedElection === election.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedElection === election.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-t border-gray-50 px-4 lg:px-5 pb-4 pt-3 bg-gray-50/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Users size={13} className="text-gray-400" />
                        <h4 className="font-semibold text-gray-600 text-sm">Candidates</h4>
                      </div>
                      {!election.candidates?.length ? (
                        <p className="text-gray-400 text-sm">No candidates yet. Add some!</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {election.candidates.map(candidate => (
                            <div key={candidate.id}
                              className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                              <div className="flex items-center gap-2 min-w-0">
                               {candidate.photo_url ? (
  <img src={candidate.photo_url} alt={candidate.full_name}
    className="w-9 h-9 rounded-xl object-cover border border-gray-100 flex-shrink-0"
    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
  />
) : (
  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
    {candidate.full_name.charAt(0)}
  </div>
)}
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm truncate">{candidate.full_name}</p>
                                  <p className="text-xs text-gray-400 truncate">{candidate.party || 'Independent'} · {candidate.vote_count} votes</p>
                                </div>
                              </div>
                              <button onClick={() => deleteCandidate(candidate.id)}
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0 ml-2">
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Election Modal */}
      {showElectionModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create Election</h2>
              <button onClick={() => setShowElectionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateElection} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Title *</label>
                <input type="text" value={electionForm.title}
                  onChange={e => setElectionForm({ ...electionForm, title: e.target.value })}
                  className={inputClass} placeholder="e.g. Guild Elections 2026" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Description</label>
                <textarea value={electionForm.description}
                  onChange={e => setElectionForm({ ...electionForm, description: e.target.value })}
                  className={inputClass + ' resize-none'} rows={3} placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">Start Date *</label>
                  <input type="datetime-local" value={electionForm.start_date}
                    onChange={e => setElectionForm({ ...electionForm, start_date: e.target.value })}
                    className={inputClass} required />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block font-medium">End Date *</label>
                  <input type="datetime-local" value={electionForm.end_date}
                    onChange={e => setElectionForm({ ...electionForm, end_date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Status</label>
                <select value={electionForm.status}
                  onChange={e => setElectionForm({ ...electionForm, status: e.target.value })}
                  className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowElectionModal(false)}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <motion.button type="submit" disabled={saving}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Election'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">Add Candidate</h2>
              <button onClick={() => setShowCandidateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Adding to: <span className="text-orange-500 font-medium">{selectedElection?.title}</span>
            </p>
            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Full Name *</label>
                <input type="text" value={candidateForm.full_name}
                  onChange={e => setCandidateForm({ ...candidateForm, full_name: e.target.value })}
                  className={inputClass} placeholder="e.g. James Brown" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Party / Affiliation</label>
                <input type="text" value={candidateForm.party}
                  onChange={e => setCandidateForm({ ...candidateForm, party: e.target.value })}
                  className={inputClass} placeholder="e.g. Independent" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Bio / Description</label>
                <textarea value={candidateForm.bio}
                  onChange={e => setCandidateForm({ ...candidateForm, bio: e.target.value })}
                  className={inputClass + ' resize-none'} rows={3} placeholder="Brief biography..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Photo (optional)</label>
                <input type="file" accept="image/*"
                  onChange={e => setCandidateForm({ ...candidateForm, photo: e.target.files[0] })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-500 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-500 file:text-xs file:font-medium hover:file:bg-orange-100 transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCandidateModal(false)}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <motion.button type="submit" disabled={saving}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Candidate'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}