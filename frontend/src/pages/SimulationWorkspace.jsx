import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PipelineBar from '../components/PipelineBar';
import EventLogFeed from '../components/EventLogFeed';
import useAppStore from '../store/appStore';
import { sseStream } from '../lib/api';

const MOCK_EVENTS = [
  { id: 1, timestamp: '14:23:01', actor: 'System', type: 'system', message: 'Simulation initialized with 6 actors' },
  { id: 2, timestamp: '14:23:02', actor: 'System', type: 'system', message: 'Graph build complete: 6 nodes, 10 edges' },
  { id: 3, timestamp: '14:23:03', actor: 'System', type: 'system', message: 'Environment variables loaded' },
  { id: 4, timestamp: '14:23:04', actor: 'Nash Engine', type: 'nash', message: 'Computing equilibria for 6-player game...' },
  { id: 5, timestamp: '14:23:06', actor: 'Nash Engine', type: 'nash', message: 'Found 3 Nash equilibria in 2.4s' },
  { id: 6, timestamp: '14:23:07', actor: 'System', type: 'system', message: 'Simulation started - Round 1' },
  { id: 7, timestamp: '14:23:08', actor: 'CentralBank', type: 'agent', message: 'Evaluating monetary policy options given 3.2% inflation' },
  { id: 8, timestamp: '14:23:09', actor: 'CommBank', type: 'agent', message: 'Assessing loan portfolio risk under current rate environment' },
  { id: 9, timestamp: '14:23:10', actor: 'FintechCo', type: 'agent', message: 'Launching promotional deposit rate of 4.5%' },
  { id: 10, timestamp: '14:23:11', actor: 'Nash Engine', type: 'nash', message: 'Deviation alert: FintechCo deviating from equilibrium by +12.8%' },
  { id: 11, timestamp: '14:23:12', actor: 'RegulatorX', type: 'agent', message: 'Monitoring FintechCo deposit rate for compliance' },
  { id: 12, timestamp: '14:23:13', actor: 'IMF', type: 'agent', message: 'Publishing quarterly stability assessment' },
  { id: 13, timestamp: '14:23:14', actor: 'Ministry', type: 'agent', message: 'Reviewing fiscal policy options' },
  { id: 14, timestamp: '14:23:15', actor: 'System', type: 'system', message: 'Round 1 complete. Advancing to Round 2.' },
  { id: 15, timestamp: '14:23:16', actor: 'CentralBank', type: 'agent', message: 'Raised benchmark rate by 25bps to 5.25%' },
];

const SOCIAL_POSTS = [
  { author: '@FinAnalystPro', handle: 'finance', content: 'Breaking: CentralBank raises rates to 5.25%. Markets reacting negatively. $CARIBFIN', time: '2m ago', sentiment: 'negative' },
  { author: '@TechDisrupt', handle: 'tech', content: 'FintechCo\'s aggressive deposit strategy is shaking up traditional banking. Innovation or recklessness?', time: '3m ago', sentiment: 'neutral' },
  { author: '@PolicyWatch', handle: 'policy', content: 'IMF stability report flags moderate risk of contagion in Caribbean banking sector.', time: '5m ago', sentiment: 'negative' },
  { author: '@MarketBull', handle: 'finance', content: 'CommBank hedging strategy looks solid. Strong positioning for rate volatility.', time: '7m ago', sentiment: 'positive' },
];

const AGENTS = [
  { name: 'CentralBank', type: 'institution', mood: 'cautious', lastAction: 'Raised rates 25bps' },
  { name: 'RegulatorX', type: 'regulator', mood: 'alert', lastAction: 'Issued monitoring notice' },
  { name: 'CommBank', type: 'commercial', mood: 'defensive', lastAction: 'Tightened lending standards' },
  { name: 'FintechCo', type: 'startup', mood: 'aggressive', lastAction: 'Launched deposit promo' },
  { name: 'IMF', type: 'international', mood: 'concerned', lastAction: 'Published risk report' },
  { name: 'Ministry', type: 'government', mood: 'deliberative', lastAction: 'Reviewing stimulus options' },
];

export default function SimulationWorkspace() {
  const { projectId, scenarioId, runId } = useParams();
  const { events, addEvent, simulationStatus } = useAppStore();
  const [activePhase, setActivePhase] = useState(3);
  const [phaseProgress, setPhaseProgress] = useState(56);
  const [currentRound, setCurrentRound] = useState(28);
  const [expandedPhase, setExpandedPhase] = useState(3);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [displayEvents, setDisplayEvents] = useState(MOCK_EVENTS);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRound((r) => {
        if (r >= 50) {
          clearInterval(interval);
          return 50;
        }
        return r + 1;
      });
      setPhaseProgress((p) => Math.min(p + 2, 100));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Try SSE connection
  useEffect(() => {
    const cleanup = sseStream(
      `/projects/${projectId}/scenarios/${scenarioId}/runs/${runId}/stream`,
      (data) => {
        if (data.type === 'event') addEvent(data);
        if (data.type === 'phase') {
          setActivePhase(data.phase);
          setPhaseProgress(data.progress);
        }
        if (data.type === 'round') setCurrentRound(data.round);
      },
      () => {} // silently handle SSE errors, use mock data
    );
    return cleanup;
  }, [projectId, scenarioId, runId, addEvent]);

  const allEvents = events.length > 0 ? events : displayEvents;

  const PHASE_DETAILS = [
    { label: 'Graph Build', detail: '6 nodes, 10 edges constructed. Relationship matrix normalized. Influence weights computed.' },
    { label: 'Environment Setup', detail: '12 environment variables loaded. 3 constraints applied. 2 scheduled events queued.' },
    { label: 'Nash Pre-Pass', detail: '3 Nash equilibria found in 2.4s. Dominant strategies: Tighten (CentralBank), Hedge (CommBank), Cooperate (FintechCo).' },
    { label: 'Simulation', detail: `Round ${currentRound}/50 in progress. ${allEvents.length} events logged. 2 deviation alerts triggered.` },
    { label: 'Report Generation', detail: 'Pending simulation completion.' },
  ];

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div className="sw-breadcrumb fade-up">
          <Link to="/dashboard" className="sw-breadcrumb-link">Projects</Link>
          <span className="sw-breadcrumb-sep">/</span>
          <Link to={`/projects/${projectId}`} className="sw-breadcrumb-link">Project</Link>
          <span className="sw-breadcrumb-sep">/</span>
          <span>Simulation Run</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}/gods-eye`}>
              <button className="btn-ghost btn-sm">God's Eye</button>
            </Link>
            <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}/compare`}>
              <button className="btn-ghost btn-sm">Compare</button>
            </Link>
            <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}/report`}>
              <button className="btn-ghost btn-sm">Report</button>
            </Link>
          </div>
        </div>

        {/* Pipeline */}
        <div className="fade-up-d1">
          <PipelineBar
            activePhase={activePhase}
            phaseProgress={phaseProgress}
            completedPhases={[0, 1, 2]}
            nashEnabled={true}
            currentRound={currentRound}
            totalRounds={50}
            estimatedRemaining={`~${Math.max(0, Math.ceil((50 - currentRound) * 3))}s`}
          />
        </div>

        {/* Phase Accordion */}
        <div className="sw-accordion fade-up-d2">
          {PHASE_DETAILS.map((phase, i) => (
            <div key={phase.label} className={`sw-accordion-item ${expandedPhase === i ? 'sw-accordion-item--open' : ''}`}>
              <button
                className="sw-accordion-header"
                onClick={() => setExpandedPhase(expandedPhase === i ? -1 : i)}
              >
                <span className="sw-accordion-phase">{String(i + 1).padStart(2, '0')}</span>
                <span className="sw-accordion-label">{phase.label}</span>
                <span className="sw-accordion-arrow">{expandedPhase === i ? '\u25B2' : '\u25BC'}</span>
              </button>
              {expandedPhase === i && (
                <div className="sw-accordion-body">
                  <p>{phase.detail}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="sw-main-grid fade-up-d3">
          {/* Charts column */}
          <div className="sw-charts">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Actions Per Round</span>
                <span className="badge badge-teal">LIVE</span>
              </div>
              <div className="sw-chart-placeholder">
                <div className="sw-chart-bars">
                  {Array.from({ length: Math.min(currentRound, 20) }, (_, i) => (
                    <div
                      key={i}
                      className="sw-chart-bar"
                      style={{
                        height: `${20 + Math.random() * 60}%`,
                        background: i === Math.min(currentRound, 20) - 1 ? 'var(--teal)' : 'var(--teal-dim)',
                      }}
                    />
                  ))}
                </div>
                <div className="sw-chart-label">Round</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Sentiment Index</span>
                <span className="badge badge-amber">TRACKING</span>
              </div>
              <div className="sw-chart-placeholder">
                <svg viewBox="0 0 400 120" style={{ width: '100%', height: 120 }}>
                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => `${i * 21},${60 + Math.sin(i * 0.5) * 30 + (Math.random() - 0.5) * 20}`).join(' ')}
                    fill="none"
                    stroke="var(--amber)"
                    strokeWidth="2"
                  />
                  <polyline
                    points={Array.from({ length: 20 }, (_, i) => `${i * 21},${60 + Math.cos(i * 0.3) * 20 + (Math.random() - 0.5) * 15}`).join(' ')}
                    fill="none"
                    stroke="var(--teal)"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                </svg>
                <div className="sw-chart-legend">
                  <span><span className="sw-legend-dot" style={{ background: 'var(--amber)' }} /> Actual</span>
                  <span><span className="sw-legend-dot" style={{ background: 'var(--teal)' }} /> Nash Predicted</span>
                </div>
              </div>
            </div>

            <div className="sw-chart-row">
              <div className="card" style={{ flex: 1 }}>
                <div className="card-header">
                  <span className="card-title">Influence Heatmap</span>
                </div>
                <div className="sw-heatmap">
                  {AGENTS.map((a) => (
                    <div key={a.name} className="sw-heatmap-row">
                      <span className="sw-heatmap-label">{a.name.substring(0, 6)}</span>
                      {AGENTS.map((b) => (
                        <div
                          key={b.name}
                          className="sw-heatmap-cell"
                          style={{
                            background: a.name === b.name
                              ? 'var(--teal)'
                              : `rgba(0,212,170,${(Math.random() * 0.6).toFixed(2)})`,
                            opacity: a.name === b.name ? 0.3 : 1,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-header">
                  <span className="card-title">Network</span>
                </div>
                <div style={{ height: 180, position: 'relative' }}>
                  <svg viewBox="0 0 200 180" style={{ width: '100%', height: '100%' }}>
                    {/* Simple network visualization */}
                    <line x1="100" y1="20" x2="40" y2="70" stroke="rgba(255,255,255,0.1)" />
                    <line x1="100" y1="20" x2="160" y2="70" stroke="rgba(255,255,255,0.1)" />
                    <line x1="40" y1="70" x2="60" y2="140" stroke="rgba(255,255,255,0.1)" />
                    <line x1="160" y1="70" x2="140" y2="140" stroke="rgba(255,255,255,0.1)" />
                    <line x1="60" y1="140" x2="140" y2="140" stroke="rgba(255,255,255,0.1)" />
                    <line x1="100" y1="100" x2="40" y2="70" stroke="rgba(255,255,255,0.1)" />
                    <line x1="100" y1="100" x2="160" y2="70" stroke="rgba(255,255,255,0.1)" />
                    <circle cx="100" cy="20" r="8" fill="#7C3AED" opacity="0.8" />
                    <circle cx="40" cy="70" r="6" fill="#7C3AED" opacity="0.8" />
                    <circle cx="160" cy="70" r="7" fill="#00D4AA" opacity="0.8" />
                    <circle cx="60" cy="140" r="5" fill="#00D4AA" opacity="0.8" />
                    <circle cx="140" cy="140" r="6" fill="#F59E0B" opacity="0.8" />
                    <circle cx="100" cy="100" r="7" fill="#F59E0B" opacity="0.8" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="sw-side">
            {/* Event Log */}
            <div>
              <h3 className="sw-side-title">Event Log</h3>
              <EventLogFeed events={allEvents} maxHeight={300} />
            </div>

            {/* Social Media Feed */}
            <div>
              <h3 className="sw-side-title">Social Media Feed</h3>
              <div className="sw-social-feed">
                {SOCIAL_POSTS.map((post, i) => (
                  <div key={i} className="sw-social-post">
                    <div className="sw-social-header">
                      <span className="sw-social-author">{post.author}</span>
                      <span className="sw-social-time">{post.time}</span>
                    </div>
                    <p className="sw-social-content">{post.content}</p>
                    <span className={`badge ${post.sentiment === 'positive' ? 'badge-teal' : post.sentiment === 'negative' ? 'badge-red' : 'badge-amber'}`}>
                      {post.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Interview */}
            <div>
              <h3 className="sw-side-title">Agent Interview</h3>
              <div className="sw-agent-list">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.name}
                    className={`sw-agent-btn ${selectedAgent === agent.name ? 'sw-agent-btn--active' : ''}`}
                    onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
                  >
                    <span className="sw-agent-dot" style={{
                      background: agent.type === 'institution' || agent.type === 'regulator'
                        ? 'var(--violet)' : agent.type === 'international' || agent.type === 'government'
                        ? 'var(--amber)' : 'var(--teal)',
                    }} />
                    <span className="sw-agent-name">{agent.name}</span>
                    <span className="sw-agent-mood">{agent.mood}</span>
                  </button>
                ))}
              </div>
              {selectedAgent && (
                <div className="sw-agent-detail card" style={{ marginTop: 12 }}>
                  <div className="card-title" style={{ marginBottom: 8 }}>{selectedAgent}</div>
                  <p className="text-secondary text-sm">
                    {AGENTS.find((a) => a.name === selectedAgent)?.lastAction}
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <label className="label">Ask Agent</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder="Why did you choose this strategy?" style={{ flex: 1 }} />
                      <button className="btn-primary btn-sm">Ask</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sw-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 16px;
        }
        .sw-breadcrumb-link { color: var(--text-secondary); }
        .sw-breadcrumb-sep { color: var(--border-bright); }
        .sw-accordion {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 24px;
        }
        .sw-accordion-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .sw-accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          border: none;
          text-align: left;
        }
        .sw-accordion-header:hover { background: var(--surface2); }
        .sw-accordion-phase {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--teal);
          width: 24px;
        }
        .sw-accordion-label { flex: 1; font-family: var(--mono); font-size: 12px; }
        .sw-accordion-arrow { font-size: 10px; color: var(--text-dim); }
        .sw-accordion-body {
          padding: 12px 16px 16px 52px;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        .sw-accordion-body p { font-size: 13px; color: var(--text-secondary); }
        .sw-main-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
        }
        .sw-charts {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sw-chart-placeholder { padding: 16px 0; }
        .sw-chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 100px;
        }
        .sw-chart-bar {
          flex: 1;
          border-radius: 2px 2px 0 0;
          min-width: 8px;
          transition: height 0.3s;
        }
        .sw-chart-label {
          text-align: center;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 8px;
        }
        .sw-chart-legend {
          display: flex;
          gap: 16px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 8px;
          justify-content: center;
        }
        .sw-legend-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
        .sw-chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .sw-heatmap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 0;
        }
        .sw-heatmap-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .sw-heatmap-label {
          font-family: var(--mono);
          font-size: 9px;
          color: var(--text-dim);
          width: 48px;
          text-align: right;
          padding-right: 6px;
        }
        .sw-heatmap-cell {
          flex: 1;
          height: 20px;
          border-radius: 2px;
        }
        .sw-side {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sw-side-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .sw-social-feed {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sw-social-post {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
        }
        .sw-social-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .sw-social-author {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--teal);
        }
        .sw-social-time {
          font-size: 10px;
          color: var(--text-dim);
        }
        .sw-social-content {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 8px;
        }
        .sw-agent-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sw-agent-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 12px;
          text-align: left;
          width: 100%;
          transition: all 0.2s;
        }
        .sw-agent-btn:hover { border-color: var(--border-bright); }
        .sw-agent-btn--active { border-color: var(--teal); background: var(--teal-dim); }
        .sw-agent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sw-agent-name {
          font-family: var(--mono);
          font-size: 11px;
          flex: 1;
        }
        .sw-agent-mood {
          font-size: 10px;
          color: var(--text-dim);
          text-transform: capitalize;
        }
        @media (max-width: 1024px) {
          .sw-main-grid { grid-template-columns: 1fr; }
          .sw-chart-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
