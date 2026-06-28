import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, ChevronDown, ChevronUp, Users, ImageIcon } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'

const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'
const CLOUDINARY_UPLOAD_PRESET = 'chogm_candidates'

export default function AdminElections() {
  const [elections, setElections] = useState([])
  const [showElectionModal, setShowElectionModal] = useState(false)
  const [showCandidateModal, setShowCandidateModal] = useState(false)
  const [selectedElection, setSelectedElection] = useState(null)
  const [expandedElection, setExpandedElection] = useState(null)
  const [electionForm, setElectionForm] = useState({
    title: '', description: '', start_date: '', end_date: '', status: 'draft'
  })
  const [candidateForm, setCandidateForm] = useState({
    full_name: '', party: '', bio: '', display_order: 0
  })
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm"

  const fetchElections = async () => {
    try {
      const { data } = await api.get('/elections/')
      setElections(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchElections() }, [])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be less than 2MB')
      return
    }

    setUploadingPhoto(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'chogm_candidates')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()

      if (data.secure_url) {
        setPhotoUrl(data.secure_url)
        setPhotoPreview(data.secure_url)
      } else {
        setError('Photo upload failed. Check your Cloudinary preset settings.')
        console.error('Cloudinary error:', data)
      }
    } catch (err) {
      console.error('Photo upload failed:', err)
      setError('Photo upload failed. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

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
    if (uploadingPhoto) {
      setError('Please wait for the photo to finish uploading')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/candidates/', {
        full_name: candidateForm.full_name,
        party: candidateForm.party,
        bio: candidateForm.bio,
        display_order: candidateForm.display_order,
        election: selectedElection.id,
        photo_url_direct: photoUrl || null,
      })
      setShowCandidateModal(false)
      setCandidateForm({ full_name: '', party: '', bio: '', display_order: 0 })
      setPhotoUrl('')
      setPhotoPreview('')
      fetchElections()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to add candidate')
    } finally { setSaving(false) }
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

  const resetCandidateModal = () => {
    setShowCandidateModal(false)
    setCandidateForm({ full_name: '', party: '', bio: '', display_order: 0 })
    setPhotoUrl('')
    setPhotoPreview('')
    setError('')
    setUploadingPhoto(false)
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
                        <button onClick={() => { setSelectedElection(election); setShowCandidateModal(true); setError('') }}
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
                                    className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {candidate.full_name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm truncate">{candidate.full_name}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {candidate.party || 'Independent'} · {candidate.vote_count} votes
                                  </p>
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
              <button onClick={resetCandidateModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Adding to: <span className="text-orange-500 font-medium">{selectedElection?.title}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-3 mb-4 text-sm">{error}</div>
            )}

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

              {/* Photo Upload */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                  Photo (optional)
                </label>

                {/* Preview */}
                {photoPreview ? (
                  <div className="mb-3 relative w-fit">
                    <img src={photoPreview} alt="Preview"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-200" />
                    <button type="button"
                      onClick={() => { setPhotoUrl(''); setPhotoPreview('') }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">
                      <X size={10} />
                    </button>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50">
                    <ImageIcon size={20} className="text-gray-300 mb-1" />
                    <span className="text-xs text-gray-300">No photo</span>
                  </div>
                )}

                <label className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border transition-all text-sm font-medium w-fit ${
                  uploadingPhoto
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                }`}>
                  {uploadingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                      Uploading to Cloudinary...
                    </>
                  ) : (
                    <>
                      <ImageIcon size={14} />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">Max 2MB. JPG, PNG supported.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetCandidateModal}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl hover:bg-gray-50 font-medium text-sm">
                  Cancel
                </button>
                <motion.button type="submit" disabled={saving || uploadingPhoto}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : uploadingPhoto ? 'Wait for upload...' : 'Save Candidate'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}