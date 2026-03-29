import { useState, useEffect, useCallback } from 'react';
import { simulationTypes } from '../data/simulationTypes';

const SHORTCUTS = [
  { keys: 'Shift + ?', action: 'Toggle help overlay' },
  { keys: 'Ctrl + N', action: 'New scenario' },
  { keys: 'Ctrl + Enter', action: 'Start simulation run' },
  { keys: 'Space', action: 'Pause / resume simulation' },
  { keys: 'G', action: 'Toggle God\'s Eye view' },
  { keys: 'E', action: 'Open event log' },
  { keys: 'R', action: 'Open report view' },
  { keys: 'Esc', action: 'Close overlay / cancel' },
  { keys: 'Ctrl + S', action: 'Save current configuration' },
  { keys: '1-5', action: 'Jump to pipeline phase' },
];

export default function HelpOverlay() {
  const [open, setOpen] = useState(false);
  const [expandedType, setExpandedType] = useState(null);
  const [activeTab, setActiveTab] = useState('start');

  const handleKeyDown = useCallback((e) => {
    if (e.shiftKey && e.key === '?') {
      e.preventDefault();
      setOpen((v) => !v);
    }
    if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const tabs = [
    { id: 'start', label: 'Getting Started' },
    { id: 'types', label: 'Simulation Types' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts' },
    { id: 'seed', label: 'Seed Configuration' },
    { id: 'nash', label: 'Nash Engine' },
  ];

  return (
    <div className="overlay" onClick={() => setOpen(false)}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2 className="help-title">Strategos Help Center</h2>
          <button className="btn-icon" onClick={() => setOpen(false)}>
            {'\u2715'}
          </button>
        </div>

        <div className="tabs" style={{ marginBottom: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="help-content">
          {activeTab === 'start' && (
            <div className="help-section">
              <h3>Welcome to Strategos</h3>
              <p>Strategos is a strategic intelligence simulator that models complex multi-agent scenarios using game-theoretic principles.</p>
              <div className="help-steps">
                <div className="help-step">
                  <span className="help-step-num">1</span>
                  <div>
                    <strong>Create a Project</strong>
                    <p>Projects organize related scenarios. Start from the Dashboard.</p>
                  </div>
                </div>
                <div className="help-step">
                  <span className="help-step-num">2</span>
                  <div>
                    <strong>Define a Scenario</strong>
                    <p>Choose a simulation type, configure actors, relationships, and initial conditions via a seed configuration.</p>
                  </div>
                </div>
                <div className="help-step">
                  <span className="help-step-num">3</span>
                  <div>
                    <strong>Run the Simulation</strong>
                    <p>Watch agents interact over multiple rounds. The pipeline processes graph building, environment setup, optional Nash pre-pass, simulation execution, and report generation.</p>
                  </div>
                </div>
                <div className="help-step">
                  <span className="help-step-num">4</span>
                  <div>
                    <strong>Analyze Results</strong>
                    <p>Use God's Eye view for real-time observation, compare runs, and generate executive reports.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="help-section">
              <h3>Simulation Types</h3>
              <p>Select the type that best matches your strategic question.</p>
              <div className="help-types-list">
                {simulationTypes.map((t) => (
                  <div key={t.id} className="help-type-item">
                    <button
                      className="help-type-header"
                      onClick={() => setExpandedType(expandedType === t.id ? null : t.id)}
                    >
                      <span className="help-type-icon">{t.icon}</span>
                      <span className="help-type-name">{t.name}</span>
                      <span className="help-type-complexity">
                        {'*'.repeat(t.complexity)}
                      </span>
                      <span className="help-type-arrow">
                        {expandedType === t.id ? '\u25B2' : '\u25BC'}
                      </span>
                    </button>
                    {expandedType === t.id && (
                      <div className="help-type-body">
                        <p>{t.description}</p>
                        <div className="help-type-meta">
                          <span>Agents: {t.agents}</span>
                          <span>Rounds: {t.rounds}</span>
                          <span>Tags: {t.tags.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="help-section">
              <h3>Keyboard Shortcuts</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Keys</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHORTCUTS.map((s) => (
                      <tr key={s.keys}>
                        <td>
                          <kbd className="help-kbd">{s.keys}</kbd>
                        </td>
                        <td>{s.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'seed' && (
            <div className="help-section">
              <h3>Seed Configuration</h3>
              <p>The seed configuration defines the initial state of your simulation world.</p>
              <div className="help-code-block">
                <pre>{`{
  "simulation_title": "My Scenario",
  "actors": [
    {
      "name": "CentralBank",
      "type": "institution",
      "role": "Monetary policy authority",
      "goals": ["Maintain price stability", "Support growth"],
      "resources": { "influence": 90, "capital": 100 },
      "relationships": {
        "CommBank": { "type": "regulatory", "strength": 0.8 }
      }
    }
  ],
  "environment": {
    "inflation_rate": 3.2,
    "gdp_growth": 1.8,
    "market_volatility": "moderate"
  },
  "initial_conditions": "Global credit tightening cycle"
}`}</pre>
              </div>
              <h4>Key Fields</h4>
              <ul className="help-list">
                <li><strong>actors</strong> - Define agents with names, types, roles, goals, resources, and relationships</li>
                <li><strong>environment</strong> - Set macro variables that affect all actors</li>
                <li><strong>initial_conditions</strong> - Narrative description of starting situation</li>
                <li><strong>constraints</strong> - Rules that limit agent behavior</li>
                <li><strong>events</strong> - Scheduled shocks or triggers</li>
              </ul>
            </div>
          )}

          {activeTab === 'nash' && (
            <div className="help-section">
              <h3>Nash Equilibrium Engine</h3>
              <p>The Nash pre-pass computes game-theoretic equilibria before simulation to establish rational baselines.</p>
              <h4>How It Works</h4>
              <ol className="help-list">
                <li>Actor utility functions are derived from goals and resources</li>
                <li>Strategy spaces are enumerated from available actions</li>
                <li>Payoff matrices are computed for each actor pair</li>
                <li>Nash equilibria are found using iterative best-response</li>
                <li>Results serve as "rational baseline" predictions</li>
              </ol>
              <h4>Nash vs Actual</h4>
              <p>During simulation, agent behavior (driven by LLM reasoning) often deviates from Nash predictions due to bounded rationality, information asymmetry, and emotional factors. These deviations are tracked and reported.</p>
              <div className="help-highlight">
                <strong>Deviation Score:</strong> Measures how far actual outcomes diverge from Nash equilibrium. High deviation suggests behavioral or informational effects dominating rational strategy.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .help-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.3s ease-out;
        }
        .help-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 16px;
        }
        .help-title {
          font-family: var(--display);
          font-size: 20px;
        }
        .help-modal .tabs {
          padding: 0 28px;
          border-bottom: 1px solid var(--border);
        }
        .help-content {
          padding: 24px 28px;
          overflow-y: auto;
          flex: 1;
        }
        .help-section h3 {
          font-family: var(--display);
          font-size: 18px;
          margin-bottom: 12px;
        }
        .help-section h4 {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--teal);
          margin: 20px 0 8px;
        }
        .help-section p {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 16px;
        }
        .help-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .help-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .help-step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--teal-dim);
          color: var(--teal);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 14px;
          font-weight: 500;
          flex-shrink: 0;
        }
        .help-step strong { display: block; margin-bottom: 4px; font-size: 14px; }
        .help-step p { color: var(--text-secondary); font-size: 13px; margin: 0; }
        .help-types-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 12px;
        }
        .help-type-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .help-type-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          cursor: pointer;
          background: none;
          color: var(--text-primary);
          font-size: 13px;
          text-align: left;
          border: none;
        }
        .help-type-header:hover { background: rgba(255,255,255,0.02); }
        .help-type-icon { font-size: 16px; }
        .help-type-name { flex: 1; font-weight: 500; }
        .help-type-complexity { font-family: var(--mono); font-size: 11px; color: var(--amber); }
        .help-type-arrow { font-size: 10px; color: var(--text-dim); }
        .help-type-body {
          padding: 0 14px 14px;
          border-top: 1px solid var(--border);
        }
        .help-type-body p { color: var(--text-secondary); font-size: 13px; margin: 10px 0; }
        .help-type-meta {
          display: flex;
          gap: 16px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
        }
        .help-kbd {
          padding: 3px 8px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-primary);
        }
        .help-code-block {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .help-code-block pre {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .help-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 8px 0;
        }
        .help-list li {
          font-size: 13px;
          color: var(--text-secondary);
          padding-left: 16px;
          position: relative;
        }
        .help-list li::before {
          content: '\u25B8';
          position: absolute;
          left: 0;
          color: var(--teal);
        }
        ol.help-list { counter-reset: step; }
        ol.help-list li::before {
          counter-increment: step;
          content: counter(step) '.';
          font-family: var(--mono);
          font-size: 11px;
        }
        .help-highlight {
          padding: 14px 16px;
          background: var(--violet-dim);
          border: 1px solid rgba(124,58,237,0.25);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 16px;
        }
        .help-highlight strong { color: var(--violet); }
      `}</style>
    </div>
  );
}
