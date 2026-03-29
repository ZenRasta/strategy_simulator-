import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SimPreviewCanvas from '../components/SimPreviewCanvas';
import EventLogFeed from '../components/EventLogFeed';

const ACTORS = [
  { name: 'CentralBank', type: 'institution', influence: 92, strategy: 'Tighten + Signal', coalition: 'Establishment', color: '#7C3AED' },
  { name: 'RegulatorX', type: 'regulator', influence: 78, strategy: 'Monitor + Warn', coalition: 'Establishment', color: '#7C3AED' },
  { name: 'CommBank', type: 'commercial', influence: 71, strategy: 'Hedge + Comply', coalition: 'Establishment', color: '#00D4AA' },
  { name: 'FintechCo', type: 'startup', influence: 45, strategy: 'Defect + Expand', coalition: 'Disruptors', color: '#00D4AA' },
  { name: 'IMF', type: 'international', influence: 85, strategy: 'Intervene', coalition: 'International', color: '#F59E0B' },
  { name: 'Ministry', type: 'government', influence: 68, strategy: 'Stimulus', coalition: 'Government', color: '#F59E0B' },
];

const HEATMAP_DATA = ACTORS.map((a) =>
  ACTORS.map((b) => ({
    from: a.name,
    to: b.name,
    value: a.name === b.name ? 0 : +(Math.random() * 0.3).toFixed(2),
  }))
).flat();

const COALITIONS = [
  { name: 'Establishment', members: ['CentralBank', 'RegulatorX', 'CommBank'], stability: 0.82, objective: 'Maintain financial stability' },
  { name: 'Disruptors', members: ['FintechCo'], stability: 0.45, objective: 'Maximize market share through innovation' },
  { name: 'International', members: ['IMF'], stability: 0.91, objective: 'Systemic stability monitoring' },
  { name: 'Government', members: ['Ministry'], stability: 0.67, objective: 'Fiscal stimulus and employment' },
];

const CASCADES = [
  { id: 1, trigger: 'CentralBank rate hike', origin: 'CentralBank', affected: 4, rounds: '1-3', type: 'Policy', status: 'completed' },
  { id: 2, trigger: 'FintechCo deposit promo', origin: 'FintechCo', affected: 3, rounds: '2-5', type: 'Market', status: 'active' },
  { id: 3, trigger: 'IMF risk report', origin: 'IMF', affected: 5, rounds: '4-6', type: 'Information', status: 'active' },
  { id: 4, trigger: 'Regulatory warning', origin: 'RegulatorX', affected: 2, rounds: '5-7', type: 'Regulatory', status: 'pending' },
];

const TIMELINE_EVENTS = [
  { round: 1, label: 'Rate Hike', actor: 'CentralBank', type: 'policy' },
  { round: 3, label: 'Deposit War', actor: 'FintechCo', type: 'market' },
  { round: 5, label: 'IMF Warning', actor: 'IMF', type: 'info' },
  { round: 8, label: 'Compliance Check', actor: 'RegulatorX', type: 'regulatory' },
  { round: 12, label: 'Coalition Shift', actor: 'CommBank', type: 'coalition' },
  { round: 15, label: 'Stimulus Package', actor: 'Ministry', type: 'policy' },
  { round: 18, label: 'Market Correction', actor: 'System', type: 'system' },
  { round: 22, label: 'Rate Hold', actor: 'CentralBank', type: 'policy' },
  { round: 25, label: 'Expansion Halt', actor: 'FintechCo', type: 'market' },
  { round: 28, label: 'Stability Restored', actor: 'IMF', type: 'info' },
];

const SAMPLE_EVENTS = [
  { timestamp: '14:23:08', actor: 'CentralBank', type: 'agent', message: 'Raised benchmark rate by 25bps' },
  { timestamp: '14:23:10', actor: 'FintechCo', type: 'agent', message: 'Launched aggressive deposit campaign' },
  { timestamp: '14:23:11', actor: 'Nash Engine', type: 'nash', message: 'Deviation: FintechCo +12.8%' },
  { timestamp: '14:23:12', actor: 'RegulatorX', type: 'agent', message: 'Issued monitoring notice' },
  { timestamp: '14:23:14', actor: 'IMF', type: 'agent', message: 'Published stability assessment' },
];

export default function GodsEyeView() {
  const { projectId, scenarioId, runId } = useParams();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectText, setInjectText] = useState('');

  const actor = selectedActor ? ACTORS.find((a) => a.name === selectedActor) : null;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div className="ge-breadcrumb fade-up">
          <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}`} className="ge-breadcrumb-link">
            Simulation
          </Link>
          <span className="ge-breadcrumb-sep">/</span>
          <span>God's Eye View</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className={`btn-ghost btn-sm ${showHeatmap ? '' : ''}`}
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              {showHeatmap ? 'Hide' : 'Show'} Nash Heatmap
            </button>
            <button className="btn-violet btn-sm" onClick={() => setShowInjectModal(true)}>
              Inject Variable
            </button>
          </div>
        </div>

        <div className="ge-grid fade-up-d1">
          {/* Main canvas */}
          <div className="ge-canvas-panel card">
            <div className="card-header">
              <span className="card-title">Agent Network</span>
              <span className="badge badge-teal">LIVE R28/50</span>
            </div>
            <div className="ge-canvas-container">
              <SimPreviewCanvas />
            </div>
            {showHeatmap && (
              <div className="ge-heatmap-overlay fade-in">
                <div className="ge-heatmap-title">Nash Deviation Heatmap</div>
                <div className="ge-heatmap-grid">
                  <div className="ge-heatmap-header">
                    <span></span>
                    {ACTORS.map((a) => (
                      <span key={a.name} className="ge-heatmap-col-label">{a.name.substring(0, 4)}</span>
                    ))}
                  </div>
                  {ACTORS.map((row) => (
                    <div key={row.name} className="ge-heatmap-row">
                      <span className="ge-heatmap-row-label">{row.name.substring(0, 6)}</span>
                      {ACTORS.map((col) => {
                        const cell = HEATMAP_DATA.find((d) => d.from === row.name && d.to === col.name);
                        const v = cell?.value || 0;
                        return (
                          <div
                            key={col.name}
                            className="ge-heatmap-cell"
                            style={{
                              background: row.name === col.name
                                ? 'transparent'
                                : `rgba(124,58,237,${Math.min(v * 3, 0.8)})`,
                            }}
                            title={`${row.name} -> ${col.name}: ${v}`}
                          >
                            {row.name !== col.name && <span>{v}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="ge-side">
            {/* Influence Ranking */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Influence Ranking</span>
              </div>
              <div className="ge-influence-list">
                {[...ACTORS].sort((a, b) => b.influence - a.influence).map((a, i) => (
                  <button
                    key={a.name}
                    className={`ge-influence-item ${selectedActor === a.name ? 'ge-influence-item--active' : ''}`}
                    onClick={() => setSelectedActor(selectedActor === a.name ? null : a.name)}
                  >
                    <span className="ge-influence-rank">#{i + 1}</span>
                    <span className="ge-influence-dot" style={{ background: a.color }} />
                    <span className="ge-influence-name">{a.name}</span>
                    <div className="ge-influence-bar-track">
                      <div className="ge-influence-bar-fill" style={{ width: `${a.influence}%`, background: a.color }} />
                    </div>
                    <span className="ge-influence-value">{a.influence}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actor Inspector */}
            {actor && (
              <div className="card ge-inspector fade-in">
                <div className="card-header">
                  <span className="card-title">Actor Inspector</span>
                  <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setSelectedActor(null)}>{'\u2715'}</button>
                </div>
                <div className="ge-inspector-field">
                  <span className="label">Name</span>
                  <span className="text-mono" style={{ color: actor.color }}>{actor.name}</span>
                </div>
                <div className="ge-inspector-field">
                  <span className="label">Type</span>
                  <span className="pill">{actor.type}</span>
                </div>
                <div className="ge-inspector-field">
                  <span className="label">Current Strategy</span>
                  <span>{actor.strategy}</span>
                </div>
                <div className="ge-inspector-field">
                  <span className="label">Coalition</span>
                  <span className="badge badge-violet">{actor.coalition}</span>
                </div>
                <div className="ge-inspector-field">
                  <span className="label">Influence</span>
                  <span className="text-mono">{actor.influence}/100</span>
                </div>
              </div>
            )}

            {/* Event Feed */}
            <div>
              <div className="ge-side-label">Event Feed</div>
              <EventLogFeed events={SAMPLE_EVENTS} maxHeight={200} />
            </div>
          </div>
        </div>

        {/* Coalitions */}
        <div className="ge-coalitions fade-up-d3">
          <h3 className="ge-section-title">Coalition Dynamics</h3>
          <div className="ge-coalition-grid">
            {COALITIONS.map((c) => (
              <div key={c.name} className="card">
                <div className="card-header">
                  <span className="card-title">{c.name}</span>
                  <span className="text-mono text-xs" style={{ color: c.stability > 0.7 ? 'var(--teal)' : 'var(--amber)' }}>
                    {(c.stability * 100).toFixed(0)}% stable
                  </span>
                </div>
                <p className="text-sm text-secondary" style={{ marginBottom: 8 }}>{c.objective}</p>
                <div className="ge-coalition-members">
                  {c.members.map((m) => (
                    <span key={m} className="pill">{m}</span>
                  ))}
                </div>
                <div className="progress-bar" style={{ marginTop: 12 }}>
                  <div className="progress-fill" style={{ width: `${c.stability * 100}%`, background: c.stability > 0.7 ? 'var(--teal)' : 'var(--amber)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Cascades */}
        <div className="ge-cascades fade-up-d4">
          <h3 className="ge-section-title">Information Cascades</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trigger</th>
                  <th>Origin</th>
                  <th>Affected</th>
                  <th>Rounds</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CASCADES.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-primary)', fontSize: 12 }}>{c.trigger}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.origin}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.affected} actors</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.rounds}</td>
                    <td><span className="pill">{c.type}</span></td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'badge-teal' : c.status === 'completed' ? 'badge-violet' : 'badge-amber'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Timeline */}
        <div className="ge-timeline fade-up-d5">
          <h3 className="ge-section-title">Event Timeline</h3>
          <div className="ge-timeline-scroll">
            <div className="ge-timeline-track">
              {TIMELINE_EVENTS.map((ev, i) => (
                <div key={i} className="ge-timeline-event">
                  <div className="ge-timeline-dot" style={{
                    background: ev.type === 'policy' ? 'var(--violet)' :
                               ev.type === 'market' ? 'var(--teal)' :
                               ev.type === 'info' ? 'var(--amber)' :
                               ev.type === 'system' ? 'var(--text-dim)' : 'var(--teal)',
                  }} />
                  <div className="ge-timeline-round">R{ev.round}</div>
                  <div className="ge-timeline-label">{ev.label}</div>
                  <div className="ge-timeline-actor">{ev.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inject Modal */}
      {showInjectModal && (
        <div className="overlay" onClick={() => setShowInjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 8 }}>
              Variable Injection
            </h2>
            <p className="text-secondary text-sm mb-24">
              Inject an external shock or variable change into the running simulation.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Injection Type</label>
              <select className="select w-full">
                <option>Economic Shock</option>
                <option>Policy Change</option>
                <option>Market Event</option>
                <option>Information Release</option>
                <option>Actor Removal</option>
                <option>Custom</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Description</label>
              <textarea
                className="textarea"
                placeholder="Describe the variable injection... e.g., 'A major credit rating agency downgrades the sovereign debt by 2 notches, triggering capital flight.'"
                value={injectText}
                onChange={(e) => setInjectText(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowInjectModal(false)}>Cancel</button>
              <button className="btn-violet" onClick={() => setShowInjectModal(false)}>
                Inject Variable
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ge-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 20px;
        }
        .ge-breadcrumb-link { color: var(--text-secondary); }
        .ge-breadcrumb-sep { color: var(--border-bright); }
        .ge-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .ge-canvas-panel { position: relative; overflow: hidden; }
        .ge-canvas-container {
          height: 400px;
          background: var(--bg);
          border-radius: 8px;
          overflow: hidden;
        }
        .ge-heatmap-overlay {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: rgba(13,19,32,0.92);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          backdrop-filter: blur(12px);
        }
        .ge-heatmap-title {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--violet);
          margin-bottom: 8px;
        }
        .ge-heatmap-grid { display: flex; flex-direction: column; gap: 2px; }
        .ge-heatmap-header {
          display: flex;
          gap: 2px;
        }
        .ge-heatmap-header span {
          width: 40px;
          text-align: center;
          font-family: var(--mono);
          font-size: 8px;
          color: var(--text-dim);
        }
        .ge-heatmap-header span:first-child { width: 52px; }
        .ge-heatmap-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .ge-heatmap-row-label {
          width: 52px;
          font-family: var(--mono);
          font-size: 8px;
          color: var(--text-dim);
          text-align: right;
          padding-right: 4px;
        }
        .ge-heatmap-cell {
          width: 40px;
          height: 24px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 8px;
          color: rgba(255,255,255,0.6);
        }
        .ge-side {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ge-side-label {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
        }
        .ge-influence-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ge-influence-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          background: none;
          border: 1px solid transparent;
          color: var(--text-primary);
          width: 100%;
          text-align: left;
          transition: all 0.15s;
        }
        .ge-influence-item:hover { background: rgba(255,255,255,0.02); }
        .ge-influence-item--active { border-color: var(--teal); background: var(--teal-dim); }
        .ge-influence-rank {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          width: 22px;
        }
        .ge-influence-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ge-influence-name { font-family: var(--mono); font-size: 11px; width: 80px; }
        .ge-influence-bar-track {
          flex: 1;
          height: 4px;
          background: var(--surface2);
          border-radius: 2px;
          overflow: hidden;
        }
        .ge-influence-bar-fill { height: 100%; border-radius: 2px; }
        .ge-influence-value {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-secondary);
          width: 28px;
          text-align: right;
        }
        .ge-inspector { }
        .ge-inspector-field {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .ge-inspector-field:last-child { border-bottom: none; }
        .ge-inspector-field .label { margin-bottom: 0; }
        .ge-section-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
        }
        .ge-coalitions { margin-bottom: 32px; }
        .ge-coalition-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .ge-coalition-members {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .ge-cascades { margin-bottom: 32px; }
        .ge-timeline { margin-bottom: 32px; }
        .ge-timeline-scroll {
          overflow-x: auto;
          padding-bottom: 8px;
        }
        .ge-timeline-track {
          display: flex;
          gap: 0;
          min-width: max-content;
          position: relative;
          padding-top: 16px;
        }
        .ge-timeline-track::before {
          content: '';
          position: absolute;
          top: 22px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--border);
        }
        .ge-timeline-event {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 100px;
          position: relative;
        }
        .ge-timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg);
          z-index: 1;
        }
        .ge-timeline-round {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
        }
        .ge-timeline-label {
          font-size: 11px;
          font-weight: 500;
          text-align: center;
        }
        .ge-timeline-actor {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dim);
        }
        @media (max-width: 1024px) {
          .ge-grid { grid-template-columns: 1fr; }
          .ge-coalition-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .ge-coalition-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
