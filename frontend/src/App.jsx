import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HelpOverlay from './components/HelpOverlay';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProjectWorkspace from './pages/ProjectWorkspace';
import ScenarioWizard from './pages/ScenarioWizard';
import ScenarioView from './pages/ScenarioView';
import SimulationWorkspace from './pages/SimulationWorkspace';
import GodsEyeView from './pages/GodsEyeView';
import CompareView from './pages/CompareView';
import ReportView from './pages/ReportView';
import ScenariosListPage from './pages/ScenariosListPage';
import TemplatesPage from './pages/TemplatesPage';
import DocsPage from './pages/DocsPage';
import NewProject from './pages/NewProject';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0D1320',
            color: '#E8EBF0',
            border: '1px solid rgba(255,255,255,0.07)',
            fontFamily: '"DM Mono", monospace',
            fontSize: '13px',
          },
        }}
      />
      <HelpOverlay />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scenarios" element={<ScenariosListPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/projects/new" element={<NewProject />} />
        <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
        <Route path="/projects/:projectId/scenarios/new" element={<ScenarioWizard />} />
        <Route path="/projects/:projectId/scenarios/:scenarioId" element={<ScenarioView />} />
        <Route path="/projects/:projectId/scenarios/:scenarioId/run/:runId" element={<SimulationWorkspace />} />
        <Route path="/projects/:projectId/scenarios/:scenarioId/run/:runId/gods-eye" element={<GodsEyeView />} />
        <Route path="/projects/:projectId/scenarios/:scenarioId/run/:runId/compare" element={<CompareView />} />
        <Route path="/projects/:projectId/scenarios/:scenarioId/run/:runId/report" element={<ReportView />} />
      </Routes>
    </BrowserRouter>
  );
}
