import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

// Routes for future pages are registered now so navigation works;
// each renders a placeholder until that page is built.
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ComingSoon title="All Projects" />} />
        <Route path="projects/:projectId" element={<ComingSoon title="Project" />} />
        <Route path="clients" element={<ComingSoon title="Clients" />} />
        <Route path="completed" element={<ComingSoon title="Completed Projects" />} />
        <Route path="settings" element={<ComingSoon title="Settings" />} />
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Route>
    </Routes>
  );
}
