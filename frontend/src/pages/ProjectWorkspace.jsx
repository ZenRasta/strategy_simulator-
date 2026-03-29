import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAppStore from '../store/appStore';

const MOCK_SCENARIOS = [
  { id: 's1', name: 'Baseline - Normal Conditions', type: 'financial', rounds: 50, nashEnabled: true, status: 'completed', runs: 3, createdAt: '2026-03-25T10:00:00Z' },
  { id: 's2', name: 'Stress Test - Rate Shock', type: 'financial', rounds: 80, nashEnabled: true, status: 'completed', runs: 2, createdAt: '2026-03-26T14:00:00Z' },
  { id: 's3', name: 'Fintech Disruption Entry', type: 'market_entry', rounds: 40, nashEnabled: false, status: 'running', runs: 1, createdAt: '2026-03-27T09:00:00Z' },
  { id: 's4', name: 'Regulatory Crackdown', type: 'regulatory', rounds: 60, nashEnabled: true, status: 'idle', runs: 0, createdAt: '2026-03-28T16:00:00Z' },
];

const MOCK_RUNS = [
  { id: 'r1', scenarioName: 'Baseline', startedAt: '2026-03-28T14:30:00Z', duration: '4m 32s', rounds: 50, status: 'completed', nashDev: '+3.2%' },
  { id: 'r2', scenarioName: 'Stress Test', startedAt: '2026-03-27T11:00:00Z', duration: '8m 15s', rounds: 80, status: 'completed', nashDev: '+11.8%' },
  { id: 'r3', scenarioName: 'Fintech Disruption', startedAt: '2026-03-28T16:45:00Z', duration: '---', rounds: 22, status: 'running', nashDev: '---' },
];

const TYPE_COLORS = {
  financial: 'badge-amber',
  market_entry: 'badge-teal',
  regulatory: 'badge-violet',
  geopolitical: 'badge-red',
};

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { scenarios, fetchScenarios } = useAppStore();

  const displayScenarios = scenarios.length > 0 ? scenarios : MOCK_SCENARIOS;

  useEffect(() => {
    fetchScenarios(projectId);
  }, [projectId, fetchScenarios]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div className="pw-breadcrumb fade-up">
          <Link to="/dashboard" className="pw-breadcrumb-link">Projects</Link>
          <span className="pw-breadcrumb-sep">/</span>
          <span>Project Workspace</span>
        </div>

        <div className="pw-header fade-up-d1">
          <div>
            <h1 className="pw-title">Caribbean Financial Contagion</h1>
            <div className="pw-meta">
              <span className="badge badge-amber">Finance</span>
              <span className="text-dim text-sm">{displayScenarios.length} scenarios</span>
              <span className="text-dim text-sm">{MOCK_RUNS.length} total runs</span>
            </div>
          </div>
          <Link to={`/projects/${projectId}/scenarios/new`}>
            <button className="btn-primary">+ New Scenario</button>
          </Link>
        </div>

        {/* Scenarios */}
        <section className="pw-section fade-up-d2">
          <h2 className="pw-section-title">Scenarios</h2>
          <div className="pw-scenarios">
            {displayScenarios.map((sc) => (
              <Link
                key={sc.id}
                to={`/projects/${projectId}/scenarios/${sc.id}`}
                className="pw-scenario-card card card-interactive"
              >
                <div className="pw-scenario-top">
                  <span className={`badge ${TYPE_COLORS[sc.type] || 'badge-teal'}`}>{sc.type.replace('_', ' ')}</span>
                  <span className={`status-dot ${sc.status === 'running' ? 'status-dot--live' : sc.status === 'completed' ? 'status-dot--live' : 'status-dot--idle'}`} />
                </div>
                <h3 className="pw-scenario-name">{sc.name}</h3>
                <div className="pw-scenario-meta">
                  <span>{sc.rounds} rounds</span>
                  <span>{sc.nashEnabled ? 'Nash ON' : 'Nash OFF'}</span>
                  <span>{sc.runs} runs</span>
                </div>
                <div className="pw-scenario-date">{formatDate(sc.createdAt)}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Runs */}
        <section className="pw-section fade-up-d4">
          <h2 className="pw-section-title">Recent Runs</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Rounds</th>
                  <th>Status</th>
                  <th>Nash Dev.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RUNS.map((run) => (
                  <tr key={run.id}>
                    <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                      {run.scenarioName}
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(run.startedAt)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{run.duration}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{run.rounds}</td>
                    <td>
                      <span className={`badge ${run.status === 'running' ? 'badge-teal' : run.status === 'completed' ? 'badge-teal' : 'badge-amber'}`}>
                        {run.status}
                      </span>
                    </td>
                    <td style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 12,
                      color: run.nashDev === '---' ? 'var(--text-dim)' : 'var(--amber)',
                    }}>
                      {run.nashDev}
                    </td>
                    <td>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/projects/${projectId}/scenarios/s1/run/${run.id}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .pw-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .pw-breadcrumb-link { color: var(--text-secondary); }
        .pw-breadcrumb-sep { color: var(--border-bright); }
        .pw-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .pw-title {
          font-family: var(--display);
          font-size: 28px;
          margin-bottom: 12px;
        }
        .pw-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pw-section { margin-bottom: 48px; }
        .pw-section-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 16px;
        }
        .pw-scenarios {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .pw-scenario-card {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pw-scenario-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pw-scenario-name {
          font-family: var(--display);
          font-size: 15px;
          font-weight: 600;
        }
        .pw-scenario-meta {
          display: flex;
          gap: 16px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
        }
        .pw-scenario-date {
          font-size: 11px;
          color: var(--text-dim);
          margin-top: auto;
        }
        @media (max-width: 768px) {
          .pw-scenarios { grid-template-columns: 1fr; }
          .pw-header { flex-direction: column; gap: 16px; }
        }
      `}</style>
    </div>
  );
}
