import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { LocationDetailPage } from './pages/LocationDetailPage';
import { ObjectDetailPage } from './pages/ObjectDetailPage';
import { MySessionsPage } from './pages/MySessionsPage';
import { RoomPage } from './pages/RoomPage';
import { SessionPlayPage } from './pages/SessionPlayPage';
import { BoardPage } from './pages/BoardPage';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminCasesPage } from './pages/admin/AdminCasesPage';
import { AdminCaseNewPage } from './pages/admin/AdminCaseNewPage';
import { AdminCaseEditPage } from './pages/admin/AdminCaseEditPage';
import { SessionResultPage } from './pages/SessionResultPage';
import { AdminFiguresPage } from './pages/admin/AdminFiguresPage';
import { SceneEditorPage } from './pages/admin/SceneEditorPage';
import { MapEditorPage } from './pages/admin/MapEditorPage';



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/cases" element={<RequireAuth><CasesPage /></RequireAuth>} />
            <Route path="/cases/:id" element={<RequireAuth><CaseDetailPage /></RequireAuth>} />
            <Route path="/cases/:caseId/locations/:locationId" element={<RequireAuth><LocationDetailPage /></RequireAuth>} />
            <Route path="/cases/:caseId/locations/:locationId/objects/:objectId" element={<RequireAuth><ObjectDetailPage /></RequireAuth>} />
            <Route path="/my-sessions" element={<RequireAuth><MySessionsPage /></RequireAuth>} />
            <Route path="/rooms/:roomCode" element={<RequireAuth><RoomPage /></RequireAuth>} />
            <Route path="/sessions/:id/play" element={<RequireAuth><SessionPlayPage /></RequireAuth>} />
            <Route path="/sessions/:id/board" element={<RequireAuth><BoardPage /></RequireAuth>} />
            <Route path="/sessions/:id/result" element={<RequireAuth><SessionResultPage /></RequireAuth>} />

            {/* Админка */}
              <Route path="/admin" element={<RequireAdmin><AdminCasesPage /></RequireAdmin>} />
              <Route path="/admin/cases/new" element={<RequireAdmin><AdminCaseNewPage /></RequireAdmin>} />
              <Route path="/admin/cases/:id" element={<RequireAdmin><AdminCaseEditPage /></RequireAdmin>} />
              <Route path="/admin/cases/:caseId/scene/:locationId" element={<RequireAdmin><SceneEditorPage /></RequireAdmin>}/>
              <Route path="/admin/cases/:caseId/map" element={<RequireAdmin><MapEditorPage /></RequireAdmin>}/>
              <Route path="/admin/figures" element={<RequireAdmin><AdminFiguresPage />
            </RequireAdmin>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;