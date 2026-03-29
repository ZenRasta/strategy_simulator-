import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const NASH_TABLE = [
  { actor: 'CentralBank', predicted: 'Tighten + Signal', actual: 'Tighten + Liquidity', deviation: 4.1, payoff: 0.82 },
  { actor: 'CommBank', predicted: 'Hedge + Comply', actual: 'Hedge + Comply', deviation: -1.2, payoff: 0.67 },
  { actor: 'FintechCo', predicted: 'Cooperate', actual: 'Defect + Expand', deviation: 12.8, payoff: 0.54 },
  { actor: 'IMF', predicted: 'Monitor + Report', actual: 'Intervene', deviation: 6.7, payoff: 0.71 },
  { actor: 'Ministry', predicted: 'Status Quo', actual: 'Stimulus', deviation: 8.9, payoff: 0.59 },
  { actor: 'RegulatorX', predicted: 'Enforce', actual: 'Warn + Delay', deviation: -3.4, payoff: 0.74 },
];

const RISK_REGISTER = [
  { id: 'R01', risk: 'Credit contagion from FintechCo deposit war', likelihood: 'High', impact: 'Critical', status: 'Active', mitigation: 'Regulatory intervention on deposit rate caps' },
  { id: 'R02', risk: 'Sovereign debt downgrade cascade', likelihood: 'Medium', impact: 'High', status: 'Monitoring', mitigation: 'IMF standby facility activation' },
  { id: 'R03', risk: 'Capital flight due to rate differential', likelihood: 'Medium', impact: 'High', status: 'Active', mitigation: 'Capital controls consideration' },
  { id: 'R04', risk: 'SME sector credit crunch', likelihood: 'High', impact: 'Medium', status: 'Active', mitigation: 'Ministry stimulus + targeted lending facility' },
  { id: 'R05', risk: 'Systemic bank run', likelihood: 'Low', impact: 'Critical', status: 'Monitoring', mitigation: 'Deposit insurance scheme + central bank backstop' },
];

export default function ReportView() {
  const { projectId, scenarioId, runId } = useParams();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);
  const [genProgress, setGenProgress] = useState(100);

  const handleGenerate = () => {
    setGenerating(true);
    setGenProgress(0);
    const interval = setInterval(() => {
      setGenProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          setGenerated(true);
          return 100;
        }
        return p + 5;
      });
    }, 200);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 960 }}>
        <div className="rv-breadcrumb fade-up">
          <Link to={`/projects/${projectId}/scenarios/${scenarioId}/run/${runId}`} className="rv-link">
            Simulation
          </Link>
          <span className="rv-sep">/</span>
          <span>Report</span>
        </div>

        <div className="rv-header fade-up-d1">
          <div>
            <h1 className="rv-title">Strategic Intelligence Report</h1>
            <p className="text-secondary text-sm">Run {runId} &middot; Caribbean Financial Contagion &middot; 50 rounds</p>
          </div>
          <div className="rv-header-actions">
            {!generated && (
              <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            )}
            {generated && (
              <>
                <button className="btn-ghost btn-sm">Export PDF</button>
                <button className="btn-ghost btn-sm">Export DOCX</button>
                <button className="btn-ghost btn-sm">Export Markdown</button>
              </>
            )}
          </div>
        </div>

        {generating && (
          <div className="rv-gen-progress fade-in">
            <div className="progress-bar" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${genProgress}%` }} />
            </div>
            <span className="text-mono text-xs text-dim">Generating report... {genProgress}%</span>
          </div>
        )}

        {generated && (
          <div className="rv-report fade-up-d2">
            {/* Executive Summary */}
            <section className="rv-section">
              <h2 className="rv-section-title">Executive Summary</h2>
              <div className="rv-summary card">
                <p>
                  This simulation modeled a Caribbean financial system under moderate stress conditions
                  over 50 rounds with 6 strategic actors. The Nash equilibrium pre-pass identified 3
                  stable equilibria, establishing rational baselines for actor behavior.
                </p>
                <p>
                  <strong>Key Finding:</strong> FintechCo exhibited the largest deviation from Nash-predicted
                  behavior (+12.8%), pursuing an aggressive expansion strategy that destabilized the
                  deposit market. This triggered a cascade of defensive responses from established
                  institutions, ultimately requiring IMF intervention by Round 18.
                </p>
                <p>
                  <strong>Outcome:</strong> The system achieved a modified stability equilibrium by Round 42,
                  but at the cost of reduced competition and tighter regulatory constraints. The overall
                  Nash deviation score of 8.3% suggests significant behavioral factors beyond pure
                  rational strategy.
                </p>
                <div className="rv-summary-metrics">
                  <div className="rv-summary-metric">
                    <span className="rv-summary-metric-value text-teal">0.68</span>
                    <span className="rv-summary-metric-label">Avg Payoff</span>
                  </div>
                  <div className="rv-summary-metric">
                    <span className="rv-summary-metric-value text-violet">8.3%</span>
                    <span className="rv-summary-metric-label">Nash Deviation</span>
                  </div>
                  <div className="rv-summary-metric">
                    <span className="rv-summary-metric-value text-amber">3</span>
                    <span className="rv-summary-metric-label">Equilibria</span>
                  </div>
                  <div className="rv-summary-metric">
                    <span className="rv-summary-metric-value text-teal">0.74</span>
                    <span className="rv-summary-metric-label">Stability Index</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Nash vs Actual */}
            <section className="rv-section">
              <h2 className="rv-section-title">Nash Equilibrium vs Actual Outcomes</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Actor</th>
                      <th>Nash Predicted</th>
                      <th>Actual Strategy</th>
                      <th>Deviation</th>
                      <th>Payoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NASH_TABLE.map((row) => (
                      <tr key={row.actor}>
                        <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.actor}</td>
                        <td style={{ fontSize: 12 }}>{row.predicted}</td>
                        <td style={{ fontSize: 12 }}>{row.actual}</td>
                        <td style={{
                          fontFamily: 'var(--mono)', fontSize: 12,
                          color: Math.abs(row.deviation) > 5 ? 'var(--amber)' :
                                 row.deviation < 0 ? 'var(--teal)' : 'var(--text-secondary)',
                        }}>
                          {row.deviation > 0 ? '+' : ''}{row.deviation}%
                        </td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{row.payoff.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rv-nash-insight card" style={{ marginTop: 16 }}>
                <p className="text-sm text-secondary">
                  <strong style={{ color: 'var(--violet)' }}>Nash Analysis:</strong> The most significant
                  deviation was FintechCo&apos;s decision to defect from the predicted cooperative equilibrium.
                  Game-theoretic analysis suggests this was driven by a miscalculation of
                  regulatory response time, creating a temporary first-mover advantage window that
                  ultimately proved counterproductive (payoff: 0.54 vs predicted 0.72).
                </p>
              </div>
            </section>

            {/* Risk Register */}
            <section className="rv-section">
              <h2 className="rv-section-title">Risk Register</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Risk</th>
                      <th>Likelihood</th>
                      <th>Impact</th>
                      <th>Status</th>
                      <th>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RISK_REGISTER.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-primary)' }}>{row.id}</td>
                        <td style={{ fontSize: 12, maxWidth: 200 }}>{row.risk}</td>
                        <td>
                          <span className={`badge ${row.likelihood === 'High' ? 'badge-red' : row.likelihood === 'Medium' ? 'badge-amber' : 'badge-teal'}`}>
                            {row.likelihood}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${row.impact === 'Critical' ? 'badge-red' : row.impact === 'High' ? 'badge-amber' : 'badge-teal'}`}>
                            {row.impact}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${row.status === 'Active' ? 'badge-amber' : 'badge-violet'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 240 }}>{row.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recommendations */}
            <section className="rv-section">
              <h2 className="rv-section-title">Strategic Recommendations</h2>
              <div className="rv-recommendations">
                <div className="rv-rec-card card">
                  <div className="rv-rec-priority badge badge-red">Priority 1</div>
                  <h3 className="rv-rec-title">Implement Deposit Rate Corridor</h3>
                  <p className="text-sm text-secondary">
                    Establish a regulatory corridor for deposit rates to prevent destabilizing
                    competition. The simulation shows that unconstrained deposit wars create
                    systemic risk within 5 rounds of initiation.
                  </p>
                </div>
                <div className="rv-rec-card card">
                  <div className="rv-rec-priority badge badge-amber">Priority 2</div>
                  <h3 className="rv-rec-title">Activate IMF Standby Facility</h3>
                  <p className="text-sm text-secondary">
                    Pre-position IMF support to signal commitment to stability. In 3 of 4 simulation
                    scenarios, early IMF signaling reduced the severity of market disruption by 40%.
                  </p>
                </div>
                <div className="rv-rec-card card">
                  <div className="rv-rec-priority badge badge-amber">Priority 3</div>
                  <h3 className="rv-rec-title">Coordinate Ministry-CentralBank Response</h3>
                  <p className="text-sm text-secondary">
                    Alignment between fiscal and monetary authorities proved critical. In scenarios
                    where coordination lagged by more than 3 rounds, stability recovery took 60% longer.
                  </p>
                </div>
              </div>
            </section>

            {/* Full Report Content */}
            <section className="rv-section">
              <h2 className="rv-section-title">Detailed Analysis</h2>
              <div className="rv-markdown card">
                <div className="rv-md-content">
                  <h3>1. Simulation Context</h3>
                  <p>
                    The Caribbean Financial Contagion scenario was designed to test the resilience
                    of a small island developing state (SIDS) financial system under competitive
                    stress from fintech disruption. Six actors were modeled across institutional,
                    commercial, regulatory, and international dimensions.
                  </p>

                  <h3>2. Phase Analysis</h3>
                  <h4>Phase 1: Graph Build</h4>
                  <p>
                    The actor relationship graph was constructed with 6 nodes and 10 directed edges.
                    CentralBank exhibited the highest centrality (0.92), confirming its systemic
                    importance. FintechCo had the lowest initial centrality (0.31) but highest
                    disruption potential based on goal-resource misalignment scoring.
                  </p>

                  <h4>Phase 2: Environment Setup</h4>
                  <p>
                    Initial conditions set inflation at 3.2%, GDP growth at 1.8%, and market
                    volatility at moderate. These parameters placed the system in a zone of
                    vulnerability where rate adjustments could trigger cascading effects.
                  </p>

                  <h4>Phase 3: Nash Pre-Pass</h4>
                  <p>
                    Three Nash equilibria were identified in 2.4 seconds of computation. The dominant
                    equilibrium predicted cooperative behavior across all actors with CentralBank
                    leading a gradual tightening cycle. The second equilibrium predicted a regulatory-led
                    stability scenario, while the third predicted market-driven adjustment.
                  </p>

                  <h4>Phase 4: Simulation Execution</h4>
                  <p>
                    The simulation ran for 50 rounds, generating 312 actions and 4 information cascades.
                    The critical inflection point occurred at Round 3 when FintechCo deviated from
                    the predicted cooperative equilibrium, launching an aggressive deposit rate campaign.
                    This deviation triggered a chain of defensive responses that dominated the
                    simulation dynamics through Round 28.
                  </p>

                  <h3>3. Coalition Dynamics</h3>
                  <p>
                    Three coalitions emerged naturally: the Establishment (CentralBank, RegulatorX,
                    CommBank) with 82% stability, the Government bloc (Ministry) pursuing fiscal
                    stimulus, and the isolated FintechCo pursuing market disruption. The IMF
                    maintained observer status until Round 18 when it shifted to active intervention.
                  </p>

                  <h3>4. Conclusion</h3>
                  <p>
                    This simulation demonstrates that game-theoretic predictions, while valuable
                    as baselines, systematically underestimate the impact of bounded rationality
                    and first-mover incentives in small, interconnected financial systems. The
                    8.3% average Nash deviation reflects the significant role of behavioral
                    factors in strategic decision-making under uncertainty.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <style>{`
        .rv-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .rv-link { color: var(--text-secondary); }
        .rv-sep { color: var(--border-bright); }
        .rv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .rv-title {
          font-family: var(--display);
          font-size: 28px;
          margin-bottom: 8px;
        }
        .rv-header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .rv-gen-progress {
          margin-bottom: 32px;
        }
        .rv-section {
          margin-bottom: 40px;
        }
        .rv-section-title {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .rv-summary p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 12px;
        }
        .rv-summary p:last-of-type { margin-bottom: 20px; }
        .rv-summary strong { color: var(--text-primary); }
        .rv-summary-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .rv-summary-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .rv-summary-metric-value {
          font-family: var(--mono);
          font-size: 24px;
          font-weight: 500;
        }
        .rv-summary-metric-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .rv-nash-insight { }
        .rv-nash-insight p { margin: 0; line-height: 1.7; }
        .rv-recommendations {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rv-rec-card { display: flex; flex-direction: column; gap: 8px; }
        .rv-rec-priority { align-self: flex-start; }
        .rv-rec-title {
          font-family: var(--display);
          font-size: 15px;
          font-weight: 600;
        }
        .rv-markdown { }
        .rv-md-content h3 {
          font-family: var(--display);
          font-size: 16px;
          font-weight: 600;
          margin: 24px 0 8px;
          color: var(--text-primary);
        }
        .rv-md-content h3:first-child { margin-top: 0; }
        .rv-md-content h4 {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.5px;
          color: var(--teal);
          margin: 16px 0 6px;
        }
        .rv-md-content p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 12px;
        }
        @media (max-width: 768px) {
          .rv-header { flex-direction: column; gap: 16px; }
          .rv-summary-metrics { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
