import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MOCK_RUNS = [
  { id: 'r1', startedAt: '2026-03-28T14:30:00Z', duration: '4m 32s', rounds: 50, status: 'completed', nashDev: '+3.2%' },
  { id: 'r2', startedAt: '2026-03-27T11:00:00Z', duration: '8m 15s', rounds: 80, status: 'completed', nashDev: '+11.8%' },
];

export default function ScenarioView() {
  const { projectId, scenarioId } = useParams();
  const navigate = useNavigate();

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleNewRun = () => {
    const runId = Date.now().toString();
    navigate(`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}`);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="pw-breadcrumb fade-up">
          <Link to="/dashboard" className="pw-breadcrumb-link">Projects</Link>
          <span className="pw-breadcrumb-sep">/</span>
          <Link to={`/projects/${projectId}`} className="pw-breadcrumb-link">Project</Link>
          <span className="pw-breadcrumb-sep">/</span>
          <span>Scenario</span>
        </div>

        <div className="pw-header fade-up-d1">
          <div>
            <h1 className="pw-title">Baseline - Normal Conditions</h1>
            <div className="pw-meta">
              <span className="badge badge-amber">financial</span>
              <span className="badge badge-violet">Nash ON</span>
              <span className="text-dim text-sm">50 rounds</span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleNewRun}>
            Start New Run
          </button>
        </div>

        <div className="sv-description card fade-up-d2">
          <h3 className="card-title">Description</h3>
          <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
            Baseline scenario modeling normal market conditions in the Caribbean financial system.
            Six actors interact over 50 rounds: CentralBank, RegulatorX, CommBank, FintechCo, IMF,
            and Ministry. Nash equilibrium pre-pass is enabled to establish rational baselines.
          </p>
        </div>

        <section className="pw-section fade-up-d3" style={{ marginTop: 32 }}>
          <h2 className="pw-section-title">Runs</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Run ID</th>
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
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-primary)' }}>{run.id}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(run.startedAt)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{run.duration}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{run.rounds}</td>
                    <td><span className="badge badge-teal">{run.status}</span></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)' }}>{run.nashDev}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${run.id}`}>
                          <button className="btn-ghost btn-sm">View</button>
                        </Link>
                        <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${run.id}/gods-eye`}>
                          <button className="btn-ghost btn-sm">God's Eye</button>
                        </Link>
                        <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${run.id}/report`}>
                          <button className="btn-ghost btn-sm">Report</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pw-section fade-up-d4" style={{ marginTop: 32 }}>
          <h2 className="pw-section-title">Seed Configuration</h2>
          <div className="sv-seed-block">
            <pre>{`{
  "simulation_title": "Caribbean Financial Baseline",
  "actors": [
    { "name": "CentralBank", "type": "institution", "role": "Monetary authority" },
    { "name": "RegulatorX", "type": "regulator", "role": "Financial oversight" },
    { "name": "CommBank", "type": "commercial", "role": "Largest commercial bank" },
    { "name": "FintechCo", "type": "startup", "role": "Digital lending platform" },
    { "name": "IMF", "type": "international", "role": "Stability monitor" },
    { "name": "Ministry", "type": "government", "role": "Fiscal policy authority" }
  ],
  "environment": {
    "inflation_rate": 3.2,
    "gdp_growth": 1.8,
    "market_volatility": "moderate"
  }
}`}</pre>
          </div>
        </section>
      </div>

      <style>{`
        .sv-description { margin-bottom: 0; }
        .sv-seed-block {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 20px;
          overflow-x: auto;
        }
        .sv-seed-block pre {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
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
          margin-bottom: 24px;
        }
        .pw-title { font-family: var(--display); font-size: 28px; margin-bottom: 12px; }
        .pw-meta { display: flex; align-items: center; gap: 12px; }
        .pw-section { margin-bottom: 32px; }
        .pw-section-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
