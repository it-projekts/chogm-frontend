import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Phone, User, CheckCircle, Clock, Search, ShieldOff, ShieldCheck, Upload, Download, Trash2 } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import TopNav from '../components/TopNav'
import api from '../api/axios'
import * as XLSX from 'xlsx'

export default function AdminVoters() {
  const [voters, setVoters] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone_number: '' })
  const [bulkData, setBulkData] = useState([])
  const [bulkErrors, setBulkErrors] = useState([])
  const [bulkSuccess, setBulkSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const fileRef = useRef()

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm"

  const fetchVoters = async () => {
    try {
      const { data } = await api.get('/voter-register/')
      setVoters(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchVoters() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/voter-register/', form)
      setShowModal(false)
      setForm({ full_name: '', phone_number: '' })
      fetchVoters()
    } catch (err) {
      setError(err.response?.data?.phone_number?.[0] || err.response?.data?.error || 'Failed to add voter')
    } finally { setSaving(false) }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (!lines.length) return
        const firstLine = lines[0].split(',').map(v => v.trim().replace(/"/g, '').toLowerCase())
        const hasHeaders = firstLine.some(h => h.includes('name') || h.includes('phone'))
        let mapped = []
        if (hasHeaders) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          mapped = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row = {}
            headers.forEach((h, i) => row[h] = values[i] || '')
            return {
              full_name: (row['Full Name'] || row['full_name'] || row['Name'] || row['name'] || '').trim(),
              phone_number: (row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || '').trim(),
            }
          })
        } else {
          mapped = lines.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            return { full_name: (values[0] || '').trim(), phone_number: (values[1] || '').trim() }
          })
        }
        setBulkData(mapped.filter(r => r.full_name && r.phone_number))
      }
      reader.readAsText(file)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'binary' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          if (!raw.length) return
          const firstRow = raw[0].map(v => String(v || '').toLowerCase().trim())
          const hasHeaders = firstRow.some(h => h.includes('name') || h.includes('phone'))
          const dataRows = hasHeaders ? raw.slice(1) : raw
          const mapped = dataRows
            .filter(row => row[0] || row[1])
            .map(row => ({
              full_name: String(row[0] || '').trim(),
              phone_number: String(row[1] || '').trim(),
            }))
            .filter(r => r.full_name && r.phone_number)
          setBulkData(mapped)
        } catch {
          setBulkErrors(['Failed to read Excel file. Please try CSV format.'])
        }
      }
      reader.readAsBinaryString(file)
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkData.length) return
    setSaving(true)
    setBulkErrors([])
    setBulkSuccess('')
    try {
      const cleanedVoters = bulkData.map(v => ({
        full_name: v.full_name.trim(),
        phone_number: v.phone_number.trim(),
      }))
      const { data } = await api.post('/voter-register/bulk/', { voters: cleanedVoters })
      setBulkSuccess(data.message)
      setBulkErrors(data.errors || [])
      fetchVoters()
      setBulkData([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setBulkErrors([err.response?.data?.error || 'Upload failed'])
    } finally { setSaving(false) }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Full Name', 'Phone Number'],
      ['John Doe', '+256700000000'],
      ['Jane Smith', '+256700000001'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Voters')
    XLSX.writeFile(wb, 'voter_template.xlsx')
  }

  const downloadVoterCodes = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Full Name', 'Phone Number', 'Secret Code', 'Status'],
      ...voters.map(v => [
        v.full_name,
        v.phone_number,
        v.secret_code,
        v.is_used ? 'Registered' : 'Pending'
      ])
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Voter Codes')
    XLSX.writeFile(wb, 'voter_codes.xlsx')
  }

  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Permanently delete "${fullName}"?\n\nThis will also delete their user account and any votes they have cast. This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/voter-register/${id}/`)
      fetchVoters()
    } catch (err) {
      alert('Failed to delete voter: ' + (err.response?.data?.error || err.message))
    } finally { setDeletingId(null) }
  }

  const handleToggle = async (id, currentState) => {
    const action = currentState ? 'deactivate' : 'activate'
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this voter?`)) return
    try { await api.post(`/voter-register/${id}/toggle/`); fetchVoters() }
    catch (err) { console.error(err) }
  }

  const filtered = voters.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.phone_number.includes(search) ||
    v.secret_code.includes(search.toUpperCase())
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        <TopNav title="Voter Register" subtitle="Add voters and manage their access." />
        <main className="flex-1 p-4 lg:p-8">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Voter Register</h1>
              <p className="text-gray-400 text-sm">Manage registered voters.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={downloadVoterCodes}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 lg:px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-green-500/20">
                <Download size={14} /> <span className="hidden sm:inline">Export</span> Codes
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowBulkModal(true); setBulkErrors([]); setBulkSuccess(''); setBulkData([]) }}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 lg:px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-500/20">
                <Upload size={14} /> <span className="hidden sm:inline">Bulk</span> Upload
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 lg:px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-orange-500/20">
                <Plus size={14} /> Add Voter
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:gap-5 mb-5">
            {[
              { label: 'Total', value: voters.length, color: 'text-purple-600', icon: '👥' },
              { label: 'Registered', value: voters.filter(v => v.is_used).length, color: 'text-green-600', icon: '✅' },
              { label: 'Pending', value: voters.filter(v => !v.is_used).length, color: 'text-orange-500', icon: '⏳' },
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

          {/* Search */}
          <div className="relative mb-4 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all text-sm shadow-sm"
              placeholder="Search voters..." />
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
              No voters found.
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {filtered.map((voter) => (
                  <div key={voter.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {voter.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{voter.full_name}</p>
                          <p className="text-xs text-gray-400">{voter.phone_number}</p>
                          {voter.registered_username && <p className="text-xs text-gray-300">@{voter.registered_username}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {voter.is_used ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                            <CheckCircle size={9} /> Registered
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">
                            <Clock size={9} /> Pending
                          </span>
                        )}
                        {voter.is_active ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                            <ShieldCheck size={9} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-100 px-2 py-0.5 rounded-lg">
                            <ShieldOff size={9} /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg text-xs tracking-widest">
                        {voter.secret_code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggle(voter.id, voter.is_active)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                            voter.is_active ? 'bg-amber-100 hover:bg-amber-200 text-amber-600' : 'bg-green-100 hover:bg-green-200 text-green-600'
                          }`}>
                          {voter.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(voter.id, voter.full_name)}
                          disabled={deletingId === voter.id}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all disabled:opacity-50">
                          {deletingId === voter.id
                            ? <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Full Name', 'Phone', 'Secret Code', 'Status', 'Access', 'Added', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((voter) => (
                        <tr key={voter.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                                {voter.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{voter.full_name}</p>
                                {voter.registered_username && <p className="text-xs text-gray-400">@{voter.registered_username}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-sm">{voter.phone_number}</td>
                          <td className="px-5 py-4">
                            <span className="font-mono bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs tracking-widest">
                              {voter.secret_code}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {voter.is_used ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg w-fit">
                                <CheckCircle size={10} /> Registered
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg w-fit">
                                <Clock size={10} /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {voter.is_active ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg w-fit">
                                <ShieldCheck size={10} /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-100 px-2.5 py-1 rounded-lg w-fit">
                                <ShieldOff size={10} /> Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{new Date(voter.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleToggle(voter.id, voter.is_active)}
                                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                                  voter.is_active ? 'bg-amber-100 hover:bg-amber-200 text-amber-600' : 'bg-green-100 hover:bg-green-200 text-green-600'
                                }`}>
                                {voter.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => handleDelete(voter.id, voter.full_name)}
                                disabled={deletingId === voter.id}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition-all disabled:opacity-50">
                                {deletingId === voter.id
                                  ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                  : <Trash2 size={11} />}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Single Voter Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Add Voter</h2>
              <button onClick={() => { setShowModal(false); setError('') }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
              <p className="text-sm text-orange-700">🔑 Secret code will be <strong>automatically generated</strong> and sent via SMS.</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-500 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium flex items-center gap-1.5">
                  <User size={11} /> Full Name *
                </label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className={inputClass} placeholder="e.g. John Doe" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium flex items-center gap-1.5">
                  <Phone size={11} /> Phone Number *
                </label>
                <input type="text" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })}
                  className={inputClass} placeholder="e.g. +256700000000" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError('') }}
                  className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl hover:bg-gray-50 font-medium text-sm">Cancel</button>
                <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add & Send SMS'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Bulk Upload Voters</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkData([]); setBulkErrors([]); setBulkSuccess('') }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 font-medium mb-1.5">📋 File format:</p>
              <p className="text-xs text-blue-600">• Column A — Full Name</p>
              <p className="text-xs text-blue-600">• Column B — Phone Number (e.g. +256700000000)</p>
              <p className="text-xs text-blue-500 mt-1">Headers optional. Secret codes auto-generated.</p>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-7 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all mb-4">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                {bulkData.length > 0 ? `${bulkData.length} voters loaded — click to change` : 'Click to choose CSV or Excel file'}
              </span>
              <span className="text-xs text-gray-400">.csv, .xlsx, .xls supported</span>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 mb-4 transition-colors">
              <Download size={14} /> Download Excel template
            </button>
            {bulkData.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{bulkData.length} voter{bulkData.length !== 1 ? 's' : ''} ready:</p>
                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50">
                  {bulkData.slice(0, 10).map((v, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {v.full_name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{v.full_name}</span>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{v.phone_number}</span>
                    </div>
                  ))}
                  {bulkData.length > 10 && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">+{bulkData.length - 10} more...</div>
                  )}
                </div>
              </div>
            )}
            {bulkSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm font-medium">✅ {bulkSuccess}</div>
            )}
            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 max-h-28 overflow-y-auto">
                {bulkErrors.map((e, i) => <p key={i} className="text-xs text-red-500">{e}</p>)}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowBulkModal(false); setBulkData([]); setBulkErrors([]); setBulkSuccess('') }}
                className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <motion.button onClick={handleBulkUpload} disabled={saving || !bulkData.length}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : `Upload ${bulkData.length} Voter${bulkData.length !== 1 ? 's' : ''}`}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}