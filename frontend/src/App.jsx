import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MusicianDashboard from './pages/MusicianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminSeasons from './pages/AdminSeasons';
import AdminRehearsals from './pages/AdminRehearsals';
import AdminAttendance from './pages/AdminAttendance';
import AdminMusicians from './pages/AdminMusicians';
import AdminMessages from './pages/AdminMessages';
import AdminNews from './pages/AdminNews';
import AdminPages from './pages/AdminPages';
import MusicianInbox from './pages/MusicianInbox';
import MusicianNews from './pages/MusicianNews';
import MaestroDashboard from './pages/MaestroDashboard';
import SectionLeaderDashboard from './pages/SectionLeaderDashboard';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Common/Header';
import PublicLayout from './components/Public/PublicLayout';
import PublicHome from './pages/PublicHome';
import PublicConcerts from './pages/PublicConcerts';
import PublicNewsPage from './pages/PublicNewsPage';
import PublicPage from './pages/PublicPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function DashboardRouter() {
  const { user, viewMode } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (viewMode === 'musician') return <MusicianDashboard />;
  if (viewMode === 'admin') return <AdminDashboard />;
  if (viewMode === 'maestro') return <MaestroDashboard />;
  if (viewMode === 'section_leader') return <SectionLeaderDashboard />;
  return <MusicianDashboard />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Routes>
        {/* Public website */}
        <Route path="/site" element={<PublicLayout />}>
          <Route index element={<PublicHome />} />
          <Route path="concerts" element={<PublicConcerts />} />
          <Route path="news" element={<PublicNewsPage />} />
          <Route path=":slug" element={<PublicPage />} />
        </Route>

        {/* Member app */}
        <Route path="*" element={
          <>
            {user && <Header />}
            <main className={user ? 'pt-16' : ''}>
              <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                {/* Default route based on role / view mode */}
                <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin/seasons" element={<ProtectedRoute roles={['admin']}><AdminSeasons /></ProtectedRoute>} />
                <Route path="/admin/seasons/:seasonId/rehearsals" element={<ProtectedRoute roles={['admin']}><AdminRehearsals /></ProtectedRoute>} />
                <Route path="/admin/rehearsals/:rehearsalId/attendance" element={<ProtectedRoute roles={['admin']}><AdminAttendance /></ProtectedRoute>} />
                <Route path="/admin/musicians" element={<ProtectedRoute roles={['admin']}><AdminMusicians /></ProtectedRoute>} />
                <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><AdminMessages /></ProtectedRoute>} />
                <Route path="/admin/news" element={<ProtectedRoute roles={['admin']}><AdminNews /></ProtectedRoute>} />
                <Route path="/admin/pages" element={<ProtectedRoute roles={['admin']}><AdminPages /></ProtectedRoute>} />

                {/* Musician routes */}
                <Route path="/inbox" element={<ProtectedRoute><MusicianInbox /></ProtectedRoute>} />
                <Route path="/news" element={<ProtectedRoute><MusicianNews /></ProtectedRoute>} />

                {/* Profile (any authenticated user) */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}
