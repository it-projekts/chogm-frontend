import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import VoterDashboard from './pages/VoterDashboard'
import VoterElections from './pages/VoterElections'
import MyVotes from './pages/MyVotes'
import AdminDashboard from './pages/AdminDashboard'
import AdminElections from './pages/AdminElections'
import AdminVoters from './pages/AdminVoters'
import AdminResults from './pages/AdminResults'
import AdminAudit from './pages/AdminAudit'
import VotePage from './pages/VotePage'

const isAuth = () => !!localStorage.getItem('access')
const isAdmin = () => localStorage.getItem('is_staff') === 'true'

function PrivateRoute({ children }) {
  return isAuth() ? children : <Navigate to="/login" />
}
function AdminRoute({ children }) {
  if (!isAuth()) return <Navigate to="/login" />
  if (!isAdmin()) return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><VoterDashboard /></PrivateRoute>} />
      <Route path="/elections" element={<PrivateRoute><VoterElections /></PrivateRoute>} />
      <Route path="/my-votes" element={<PrivateRoute><MyVotes /></PrivateRoute>} />
      <Route path="/vote/:electionId" element={<PrivateRoute><VotePage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/elections" element={<AdminRoute><AdminElections /></AdminRoute>} />
      <Route path="/admin/voters" element={<AdminRoute><AdminVoters /></AdminRoute>} />
      <Route path="/admin/results" element={<AdminRoute><AdminResults /></AdminRoute>} />
      <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}