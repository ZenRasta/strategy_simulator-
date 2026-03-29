import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PipelineBar from '../components/PipelineBar';
import EventLogFeed from '../components/EventLogFeed';
import SimPreviewCanvas from '../components/SimPreviewCanvas';
import AgentNetworkCanvas from '../components/AgentNetworkCanvas';

const TICKER_EVENTS = [
  { dot: '#00D4AA', text: 'CentralBank raised interest rate to 5.25%' },
  { dot: '#7C3AED', text: 'Nash equilibrium found: 3 stable strategies' },
  { dot: '#F59E0B', text: 'FintechCo deviated from predicted cooperation' },
  { dot: '#00D4AA', text: 'Coalition formed: CommBank + Ministry' },
  { dot: '#EF4444', text: 'Market volatility spike: +340bps' },
  { dot: '#7C3AED', text: 'Nash pre-pass completed in 2.4s' },
  { dot: '#00D4AA', text: 'IMF issued emergency liquidity facility' },
  { dot: '#F59E0B', text: 'RegulatorX announced new capital requirements' },
  { dot: '#00D4AA', text: 'Simulation round 42/50 complete' },
  { dot: '#7C3AED', text: 'Payoff matrix recalculated for 6 actors' },
  { dot: '#EF4444', text: 'Credit contagion spreading to sector B' },
  { dot: '#00D4AA', text: 'Diplomatic channel opened between actors 3 and 5' },
];

const NASH_ROWS = [
  { actor: 'CentralBank', strategy: 'Tighten', payoff: '0.82', deviation: '+4.1%', devColor: 'var(--amber)' },
  { actor: 'CommBank', strategy: 'Hedge', payoff: '0.67', deviation: '-1.2%', devColor: 'var(--teal)' },
  { actor: 'FintechCo', strategy: 'Expand', payoff: '0.54', deviation: '+12.8%', devColor: 'var(--red)' },
];

const FEATURES = [
  {
    title: 'Multi-Agent LLM Simulation',
    description: 'Each actor is an autonomous LLM agent with goals, resources, memory, and reasoning capabilities that evolve over simulation rounds.',
    icon: '\u{2B21}',
  },
  {
    title: 'Nash Equilibrium Pre-Pass',
    description: 'Game-theoretic analysis computes rational equilibria before simulation, providing baselines to measure behavioral deviations.',
    icon: '\u{2694}',
  },
  {
    title: 'God\'s Eye Observation',
    description: 'Real-time visualization of agent networks, influence flows, coalition dynamics, and information cascades across the simulation graph.',
    icon: '\u{1F441}',
  },
  {
    title: 'Variable Injection',
    description: 'Inject external shocks, policy changes, or black swan events mid-simulation and observe cascading effects across the agent network.',
    icon: '\u{26A1}',
  },
  {
    title: 'Executive Reporting',
    description: 'Auto-generated strategic reports with risk registers, Nash deviation analysis, scenario comparisons, and actionable recommendations.',
    icon: '\u{1F4CA}',
  },
  {
    title: 'Multi-Run Comparison',
    description: 'Compare simulation runs side-by-side, overlay metrics, and identify which variables drive divergent strategic outcomes.',
    icon: '\u{1F504}',
  },
];

const PIPELINE_PHASES = [
  { label: 'Graph Build', description: 'Construct actor relationship graph from seed configuration', color: 'var(--teal)' },
  { label: 'Environment Setup', description: 'Initialize macro variables, constraints, and event triggers', color: 'var(--teal)' },
  { label: 'Nash Pre-Pass', description: 'Compute game-theoretic equilibria and rational baselines', color: 'var(--violet)' },
  { label: 'Simulation', description: 'Execute multi-round agent interactions with LLM reasoning', color: 'var(--teal)' },
  { label: 'Report Generation', description: 'Synthesize results into executive strategic intelligence', color: 'var(--teal)' },
];

const SAMPLE_EVENTS = [
  { timestamp: '14:23:01', actor: 'CentralBank', type: 'agent', message: 'Raised benchmark rate by 25bps citing inflation persistence' },
  { timestamp: '14:23:01', actor: 'System', type: 'system', message: 'Environment variable inflation_rate updated to 3.4%' },
  { timestamp: '14:23:02', actor: 'CommBank', type: 'agent', message: 'Tightened lending standards in response to rate hike' },
  { timestamp: '14:23:02', actor: 'FintechCo', type: 'agent', message: 'Launched aggressive deposit rate campaign to attract capital' },
  { timestamp: '14:23:03', actor: 'Nash Engine', type: 'nash', message: 'Deviation detected: FintechCo deviating from equilibrium by +12.8%' },
  { timestamp: '14:23:03', actor: 'RegulatorX', type: 'agent', message: 'Issued warning on unsustainable deposit rate competition' },
  { timestamp: '14:23:04', actor: 'IMF', type: 'agent', message: 'Published stability assessment: moderate risk of contagion' },
  { timestamp: '14:23:04', actor: 'Ministry', type: 'agent', message: 'Announced fiscal stimulus package targeting SME sector' },
  { timestamp: '14:23:05', actor: 'System', type: 'warning', message: 'Coalition stability index dropped below threshold (0.42)' },
  { timestamp: '14:23:05', actor: 'CentralBank', type: 'agent', message: 'Opened emergency liquidity window for qualifying institutions' },
];

const NASH_TABLE_ROWS = [
  { actor: 'CentralBank', predicted: 'Tighten + Signal', actual: 'Tighten + Liquidity', deviation: 0.041, payoff: 0.82 },
  { actor: 'CommBank', predicted: 'Hedge + Comply', actual: 'Hedge + Comply', deviation: -0.012, payoff: 0.67 },
  { actor: 'FintechCo', predicted: 'Cooperate', actual: 'Defect + Expand', deviation: 0.128, payoff: 0.54 },
  { actor: 'IMF', predicted: 'Monitor + Report', actual: 'Intervene', deviation: 0.067, payoff: 0.71 },
  { actor: 'Ministry', predicted: 'Status Quo', actual: 'Stimulus', deviation: 0.089, payoff: 0.59 },
  { actor: 'RegulatorX', predicted: 'Enforce', actual: 'Warn + Delay', deviation: -0.034, payoff: 0.74 },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Zone 1: Ticker Strip */}
      <div className="ticker-strip">
        <div className="ticker-label">
          <span className="status-dot status-dot--live" />
          LIVE SIM
        </div>
        <div className="ticker-track">
          <div className="ticker-content">
            {[...TICKER_EVENTS, ...TICKER_EVENTS].map((ev, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-dot" style={{ background: ev.dot }} />
                {ev.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Zone 2: Navbar */}
      <Navbar />

      {/* Zone 3: Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-left">
              <span className="hero-eyebrow fade-up">STRATEGIC INTELLIGENCE SIMULATOR v2.0</span>
              <h1 className="hero-title fade-up-d1">
                Rehearse<br />
                <span className="text-teal">The Future.</span>
              </h1>
              <p className="hero-subtitle fade-up-d2">
                Multi-agent game-theoretic simulation engine for strategic decision-making
              </p>
              <p className="hero-body fade-up-d3">
                Deploy autonomous LLM agents into complex scenarios. Compute Nash equilibria.
                Observe emergent strategies. Generate actionable intelligence before making
                real-world moves.
              </p>
              <div className="hero-ctas fade-up-d4">
                <Link to="/dashboard">
                  <button className="btn-primary">
                    Launch Simulator
                    <span style={{ fontSize: 14 }}>{'\u2192'}</span>
                  </button>
                </Link>
                <button className="btn-ghost">View Documentation</button>
              </div>
              <div className="hero-stats fade-up-d5">
                <div className="hero-stat">
                  <span className="hero-stat-value">10</span>
                  <span className="hero-stat-label">Scenario Types</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">50+</span>
                  <span className="hero-stat-label">Agent Archetypes</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat">
                  <span className="hero-stat-value">Nash</span>
                  <span className="hero-stat-label">Equilibrium Engine</span>
                </div>
              </div>
            </div>

            <div className="hero-right">
              {/* Panel 1: God's Eye Mini */}
              <div className="hero-panel fade-up-d3" style={{ height: 220 }}>
                <div className="hero-panel-header">
                  <span className="status-dot status-dot--live" />
                  <span className="hero-panel-label">GOD&apos;S EYE VIEW</span>
                  <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>LIVE</span>
                </div>
                <div className="hero-panel-canvas">
                  <SimPreviewCanvas />
                </div>
              </div>

              {/* Panel 2: Nash Pre-Pass Table */}
              <div className="hero-panel hero-panel--nash fade-up-d5">
                <div className="hero-panel-header">
                  <span className="status-dot" style={{ background: 'var(--violet)', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                  <span className="hero-panel-label">NASH PRE-PASS</span>
                  <span className="badge badge-violet" style={{ marginLeft: 'auto' }}>EQUILIBRIUM</span>
                </div>
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Actor</th>
                        <th>Strategy</th>
                        <th>Payoff</th>
                        <th>Deviation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NASH_ROWS.map((row) => (
                        <tr key={row.actor}>
                          <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 11 }}>{row.actor}</td>
                          <td>{row.strategy}</td>
                          <td style={{ fontFamily: 'var(--mono)' }}>{row.payoff}</td>
                          <td style={{ color: row.devColor, fontFamily: 'var(--mono)' }}>{row.deviation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Panel 3: Pipeline Mini */}
              <div className="hero-panel fade-up-d7">
                <div className="hero-panel-header">
                  <span className="status-dot status-dot--live" />
                  <span className="hero-panel-label">PIPELINE</span>
                  <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>R28/50</span>
                </div>
                <PipelineBar
                  activePhase={3}
                  phaseProgress={56}
                  completedPhases={[0, 1, 2]}
                  nashEnabled={true}
                  currentRound={28}
                  totalRounds={50}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* Background network */}
        <div className="hero-bg-canvas">
          <AgentNetworkCanvas width={1400} height={700} nodeCount={28} />
        </div>
      </section>

      {/* Zone 4: Pipeline Phase Bar */}
      <section className="pipeline-section">
        <div className="container">
          <div className="pipeline-section-grid">
            {PIPELINE_PHASES.map((phase, i) => (
              <div key={phase.label} className={`pipeline-block fade-up-d${i + 1}`}>
                <div className="pipeline-block-num" style={{ color: phase.color }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="pipeline-block-label">{phase.label}</div>
                <div className="pipeline-block-desc">{phase.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone 5: Nash Feature Banner */}
      <section className="nash-banner">
        <div className="container">
          <div className="nash-banner-inner">
            <div className="nash-banner-left">
              <span className="nash-banner-eyebrow">GAME THEORY ENGINE</span>
              <h2 className="nash-banner-title">
                Nash Equilibrium<br />
                <span style={{ color: 'var(--violet)' }}>Pre-Pass Analysis</span>
              </h2>
              <p className="nash-banner-body">
                Before agents interact, the Nash engine computes all game-theoretic equilibria
                across the actor network. This establishes rational baselines that reveal when
                simulated behavior deviates from strategic optimality -- exposing bounded rationality,
                information asymmetry, and emergent coalition dynamics.
              </p>
            </div>
            <div className="nash-banner-right">
              <div className="nash-banner-metrics">
                <div className="nash-banner-metric">
                  <span className="nash-banner-metric-value" style={{ color: 'var(--violet)' }}>6</span>
                  <span className="nash-banner-metric-label">Equilibria Found</span>
                </div>
                <div className="nash-banner-metric">
                  <span className="nash-banner-metric-value" style={{ color: 'var(--amber)' }}>+8.3%</span>
                  <span className="nash-banner-metric-label">Avg Deviation</span>
                </div>
                <div className="nash-banner-metric">
                  <span className="nash-banner-metric-value" style={{ color: 'var(--teal)' }}>2.4s</span>
                  <span className="nash-banner-metric-label">Compute Time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 6: Features Grid */}
      <section className="features-section section">
        <div className="container">
          <div className="text-center mb-24">
            <span className="section-subtitle fade-up">CAPABILITIES</span>
            <h2 className="section-title fade-up-d1">Strategic Intelligence Suite</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map((feat, i) => (
              <div key={feat.title} className={`feature-card card fade-up-d${i + 1}`}>
                <div className="feature-icon">{feat.icon}</div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zone 7: Live Data Section */}
      <section className="live-section section">
        <div className="container">
          <div className="text-center mb-24">
            <span className="section-subtitle fade-up">REAL-TIME INTELLIGENCE</span>
            <h2 className="section-title fade-up-d1">Live Simulation Feed</h2>
          </div>
          <div className="live-grid">
            <div className="fade-up-d2">
              <h3 className="live-col-title">Event Log</h3>
              <EventLogFeed events={SAMPLE_EVENTS} maxHeight={420} />
            </div>
            <div className="fade-up-d4">
              <h3 className="live-col-title">Nash Deviation Analysis</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Actor</th>
                      <th>Predicted</th>
                      <th>Actual</th>
                      <th>Deviation</th>
                      <th>Payoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NASH_TABLE_ROWS.map((row) => (
                      <tr key={row.actor}>
                        <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {row.actor}
                        </td>
                        <td style={{ fontSize: 12 }}>{row.predicted}</td>
                        <td style={{ fontSize: 12 }}>{row.actual}</td>
                        <td style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 12,
                          color: Math.abs(row.deviation) > 0.05 ? 'var(--amber)' :
                                 row.deviation < 0 ? 'var(--teal)' : 'var(--text-secondary)',
                        }}>
                          {row.deviation > 0 ? '+' : ''}{(row.deviation * 100).toFixed(1)}%
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{row.payoff.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone 8: Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="navbar-logo" style={{ width: 24, height: 24 }}>
                <span className="navbar-logo-dot" style={{ width: 6, height: 6 }} />
              </div>
              <span style={{ fontFamily: 'var(--display)', fontSize: 13, letterSpacing: 2 }}>STRATEGOS</span>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">API Reference</a>
              <a href="#" className="footer-link">GitHub</a>
              <a href="#" className="footer-link">Support</a>
            </div>
            <div className="footer-copy">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                Strategos v2.0 &middot; Strategic Intelligence Terminal
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .landing { min-height: 100vh; }

        /* Hero */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 80px 0 60px;
        }
        .hero-bg-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.25;
          pointer-events: none;
        }
        .hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .hero-left { max-width: 540px; }
        .hero-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--teal);
          display: block;
          margin-bottom: 16px;
        }
        .hero-title {
          font-family: var(--display);
          font-size: 56px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .hero-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          font-weight: 300;
        }
        .hero-body {
          font-size: 14px;
          color: var(--text-dim);
          line-height: 1.7;
          margin-bottom: 32px;
        }
        .hero-ctas {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
        }
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .hero-stat { display: flex; flex-direction: column; gap: 4px; }
        .hero-stat-value {
          font-family: var(--mono);
          font-size: 20px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .hero-stat-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .hero-stat-divider {
          width: 1px;
          height: 36px;
          background: var(--border);
        }

        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-panel {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          overflow: hidden;
        }
        .hero-panel--nash {
          border-color: rgba(124,58,237,0.2);
          background: linear-gradient(135deg, var(--surface) 0%, rgba(124,58,237,0.04) 100%);
        }
        .hero-panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .hero-panel-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-dim);
        }
        .hero-panel-canvas {
          height: 160px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg);
        }

        /* Pipeline Section */
        .pipeline-section {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 48px 0;
        }
        .pipeline-section-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
        }
        .pipeline-block {
          padding: 24px 20px;
          border-right: 1px solid var(--border);
        }
        .pipeline-block:last-child { border-right: none; }
        .pipeline-block-num {
          font-family: var(--mono);
          font-size: 24px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .pipeline-block-label {
          font-family: var(--display);
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .pipeline-block-desc {
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.5;
        }

        /* Nash Banner */
        .nash-banner {
          background: linear-gradient(135deg, var(--bg) 0%, rgba(124,58,237,0.06) 50%, var(--bg) 100%);
          border-top: 1px solid rgba(124,58,237,0.15);
          border-bottom: 1px solid rgba(124,58,237,0.15);
          padding: 64px 0;
        }
        .nash-banner-inner {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .nash-banner-eyebrow {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 3px;
          color: var(--violet);
          display: block;
          margin-bottom: 12px;
        }
        .nash-banner-title {
          font-family: var(--display);
          font-size: 36px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .nash-banner-body {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }
        .nash-banner-metrics {
          display: flex;
          gap: 24px;
          justify-content: flex-end;
        }
        .nash-banner-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          min-width: 120px;
        }
        .nash-banner-metric-value {
          font-family: var(--mono);
          font-size: 28px;
          font-weight: 500;
        }
        .nash-banner-metric-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-dim);
          text-align: center;
        }

        /* Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .feature-card {
          border: none;
          border-radius: 0;
          background: var(--surface);
          padding: 32px 28px;
          transition: background 0.3s;
        }
        .feature-card:hover {
          background: var(--surface2);
          border-color: transparent;
          box-shadow: none;
          transform: none;
        }
        .feature-icon {
          font-size: 28px;
          margin-bottom: 16px;
          display: block;
        }
        .feature-title {
          font-family: var(--display);
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .feature-desc {
          font-size: 13px;
          color: var(--text-dim);
          line-height: 1.6;
        }

        /* Live Section */
        .live-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        .live-col-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
        }

        /* Footer */
        .footer {
          border-top: 1px solid var(--border);
          padding: 40px 0;
        }
        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-link {
          font-size: 13px;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: var(--text-secondary); }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .hero-title { font-size: 40px; }
          .pipeline-section-grid { grid-template-columns: repeat(3, 1fr); }
          .nash-banner-inner { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .live-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 40px 0 30px; }
          .hero-title { font-size: 32px; }
          .hero-ctas { flex-direction: column; }
          .hero-stats { flex-wrap: wrap; }
          .pipeline-section-grid { grid-template-columns: 1fr; }
          .pipeline-block { border-right: none; border-bottom: 1px solid var(--border); }
          .features-grid { grid-template-columns: 1fr; }
          .nash-banner-metrics { flex-direction: column; align-items: stretch; }
          .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
