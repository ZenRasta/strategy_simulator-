import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const RUNS = [
  { id: 'r1', label: 'Baseline Run #1', rounds: 50, nashEnabled: true, date: '2026-03-28', status: 'completed' },
  { id: 'r2', label: 'Stress Test Run #2', rounds: 80, nashEnabled: true, date: '2026-03-27', status: 'completed' },
  { id: 'r3', label: 'No-Nash Run #3', rounds: 50, nashEnabled: false, date: '2026-03-26', status: 'completed' },
  { id: 'r4', label: 'High Volatility #4', rounds: 60, nashEnabled: true, date: '2026-03-25', status: 'completed' },
];

const METRICS = [
  { label: 'Total Actions', r1: 312, r2: 498, r3: 287, r4: 405 },
  { label: 'Avg Sentiment', r1: 0.62, r2: 0.38, r3: 0.55, r4: 0.41 },
  { label: 'Nash Deviation', r1: '3.2%', r2: '11.8%', r3: 'N/A', r4: '8.9%' },
  { label: 'Coalitions Formed', r1: 3, r2: 4, r3: 2, r4: 3 },
  { label: 'Information Cascades', r1: 4, r2: 7, r3: 3, r4: 6 },
  { label: 'Peak Volatility', r1: 0.34, r2: 0.78, r3: 0.29, r4: 0.65 },
  { label: 'Stability Index', r1: 0.82, r2: 0.51, r3: 0.76, r4: 0.58 },
  { label: 'Compute Time', r1: '4m 32s', r2: '8m 15s', r3: '3m 48s', r4: '6m 21s' },
];

const ACTOR_DIFFS = [
  { actor: 'CentralBank', r1_strategy: 'Tighten', r2_strategy: 'Aggressive Tighten', r1_payoff: 0.82, r2_payoff: 0.71, delta: -0.11 },
  { actor: 'CommBank', r1_strategy: 'Hedge', r2_strategy: 'Defensive Hedge', r1_payoff: 0.67, r2_payoff: 0.58, delta: -0.09 },
  { actor: 'FintechCo', r1_strategy: 'Expand', r2_strategy: 'Retreat', r1_payoff: 0.54, r2_payoff: 0.32, delta: -0.22 },
  { actor: 'IMF', r1_strategy: 'Monitor', r2_strategy: 'Intervene', r1_payoff: 0.71, r2_payoff: 0.65, delta: -0.06 },
  { actor: 'Ministry', r1_strategy: 'Stimulus', r2_strategy: 'Emergency Stimulus', r1_payoff: 0.59, r2_payoff: 0.48, delta: -0.11 },
  { actor: 'RegulatorX', r1_strategy: 'Warn', r2_strategy: 'Enforce', r1_payoff: 0.74, r2_payoff: 0.69, delta: -0.05 },
];

const NASH_COMPARISON = [
  { metric: 'Equilibria Found', baseline: 3, withNash: 3, diff: 0 },
  { metric: 'Avg Payoff', baseline: 0.68, withNash: 0.71, diff: +0.03 },
  { metric: 'Cooperation Rate', baseline: '45%', withNash: '62%', diff: '+17%' },
  { metric: 'Deviation Score', baseline: 'N/A', withNash: '8.3%', diff: '---' },
  { metric: 'Coalition Stability', baseline: 0.61, withNash: 0.74, diff: +0.13 },
];

export default function CompareView() {
  const { projectId, scenarioId, runId } = useParams();
  const [selected, setSelected] = useState(['r1', 'r2']);

  const toggleRun = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="cv-breadcrumb fade-up">
          <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}`} className="cv-link">
            Simulation
          </Link>
          <span className="cv-sep">/</span>
          <span>Compare Runs</span>
        </div>

        <h1 className="cv-title fade-up-d1">Multi-Run Comparison</h1>

        {/* Run Selector */}
        <div className="cv-selector fade-up-d2">
          <h3 className="cv-section-title">Select Runs</h3>
          <div className="cv-run-grid">
            {RUNS.map((run) => (
              <label key={run.id} className={`cv-run-card ${selected.includes(run.id) ? 'cv-run-card--selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(run.id)}
                  onChange={() => toggleRun(run.id)}
                  className="cv-checkbox"
                />
                <div className="cv-run-info">
                  <span className="cv-run-label">{run.label}</span>
                  <span className="cv-run-meta">
                    {run.rounds} rounds | Nash: {run.nashEnabled ? 'ON' : 'OFF'} | {run.date}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="cv-metrics fade-up-d3">
          <h3 className="cv-section-title">Summary Metrics</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {selected.map((id) => (
                    <th key={id}>{RUNS.find((r) => r.id === id)?.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.label}>
                    <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>{m.label}</td>
                    {selected.map((id) => (
                      <td key={id} style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                        {m[id] ?? '---'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overlay Charts */}
        <div className="cv-charts fade-up-d4">
          <h3 className="cv-section-title">Overlay Charts</h3>
          <div className="cv-chart-grid">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Sentiment Over Time</span>
              </div>
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: 160 }}>
                {selected.includes('r1') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${80 + Math.sin(i * 0.4) * 30}`).join(' ')}
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="2"
                  />
                )}
                {selected.includes('r2') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${90 + Math.sin(i * 0.6 + 1) * 40}`).join(' ')}
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                  />
                )}
                {selected.includes('r3') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${75 + Math.sin(i * 0.3 + 2) * 25}`).join(' ')}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                )}
                {selected.includes('r4') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${85 + Math.sin(i * 0.5 + 3) * 35}`).join(' ')}
                    fill="none"
                    stroke="var(--red)"
                    strokeWidth="2"
                  />
                )}
              </svg>
              <div className="cv-chart-legend">
                {selected.map((id) => {
                  const colors = { r1: 'var(--teal)', r2: 'var(--amber)', r3: 'var(--violet)', r4: 'var(--red)' };
                  return (
                    <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[id], display: 'inline-block' }} />
                      {RUNS.find((r) => r.id === id)?.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Volatility Index</span>
              </div>
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: 160 }}>
                {selected.includes('r1') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${120 - Math.abs(Math.sin(i * 0.5)) * 60}`).join(' ')}
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="2"
                  />
                )}
                {selected.includes('r2') && (
                  <polyline
                    points={Array.from({ length: 25 }, (_, i) => `${i * 20 + 10},${120 - Math.abs(Math.sin(i * 0.7 + 1)) * 90}`).join(' ')}
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Nash vs Baseline */}
        <div className="cv-nash fade-up-d5">
          <h3 className="cv-section-title">Nash vs Baseline Comparison</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Without Nash (Baseline)</th>
                  <th>With Nash</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {NASH_COMPARISON.map((row) => (
                  <tr key={row.metric}>
                    <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.metric}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{row.baseline}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--violet)' }}>{row.withNash}</td>
                    <td style={{
                      fontFamily: 'var(--mono)', fontSize: 12,
                      color: typeof row.diff === 'number' ? (row.diff > 0 ? 'var(--teal)' : 'var(--red)') : 'var(--text-dim)',
                    }}>
                      {typeof row.diff === 'number' ? (row.diff > 0 ? '+' : '') + row.diff : row.diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actor State Diff */}
        <div className="cv-actor-diff fade-up-d6">
          <h3 className="cv-section-title">Actor State Diff (Run 1 vs Run 2)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Run 1 Strategy</th>
                  <th>Run 2 Strategy</th>
                  <th>Run 1 Payoff</th>
                  <th>Run 2 Payoff</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {ACTOR_DIFFS.map((row) => (
                  <tr key={row.actor}>
                    <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.actor}</td>
                    <td style={{ fontSize: 12 }}>{row.r1_strategy}</td>
                    <td style={{ fontSize: 12 }}>{row.r2_strategy}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{row.r1_payoff.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{row.r2_payoff.toFixed(2)}</td>
                    <td style={{
                      fontFamily: 'var(--mono)', fontSize: 12,
                      color: row.delta < -0.1 ? 'var(--red)' : row.delta < 0 ? 'var(--amber)' : 'var(--teal)',
                    }}>
                      {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .cv-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .cv-link { color: var(--text-secondary); }
        .cv-sep { color: var(--border-bright); }
        .cv-title {
          font-family: var(--display);
          font-size: 28px;
          margin-bottom: 32px;
        }
        .cv-section-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
        }
        .cv-selector { margin-bottom: 40px; }
        .cv-run-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .cv-run-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cv-run-card:hover { border-color: var(--border-bright); }
        .cv-run-card--selected { border-color: var(--teal); background: var(--teal-dim); }
        .cv-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--teal);
          cursor: pointer;
          flex-shrink: 0;
        }
        .cv-run-info { display: flex; flex-direction: column; gap: 2px; }
        .cv-run-label { font-size: 13px; font-weight: 500; }
        .cv-run-meta { font-family: var(--mono); font-size: 10px; color: var(--text-dim); }
        .cv-metrics { margin-bottom: 40px; }
        .cv-charts { margin-bottom: 40px; }
        .cv-chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .cv-chart-legend {
          display: flex;
          gap: 16px;
          padding: 8px 0;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          flex-wrap: wrap;
        }
        .cv-nash { margin-bottom: 40px; }
        .cv-actor-diff { margin-bottom: 40px; }
        @media (max-width: 768px) {
          .cv-run-grid { grid-template-columns: 1fr; }
          .cv-chart-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
