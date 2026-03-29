const PHASES = [
  { key: 'graph', label: 'Graph Build', icon: '\u{2B21}' },
  { key: 'environment', label: 'Environment Setup', icon: '\u{2699}' },
  { key: 'nash', label: 'Nash Pre-Pass', icon: '\u{2694}', isNash: true },
  { key: 'simulation', label: 'Simulation', icon: '\u{25B6}' },
  { key: 'report', label: 'Report Generation', icon: '\u{1F4C4}' },
];

export default function PipelineBar({
  activePhase = 0,
  phaseProgress = 0,
  completedPhases = [],
  nashEnabled = true,
  currentRound = 0,
  totalRounds = 50,
  estimatedRemaining = null,
  compact = false,
}) {
  const getPhaseState = (index, phase) => {
    if (!nashEnabled && phase.isNash) return 'skipped';
    if (completedPhases.includes(index)) return 'done';
    if (index === activePhase) return 'active';
    return 'pending';
  };

  return (
    <div className={`pipeline-bar ${compact ? 'pipeline-bar--compact' : ''}`}>
      <div className="pipeline-phases">
        {PHASES.map((phase, i) => {
          const state = getPhaseState(i, phase);
          const isNashPhase = phase.isNash;
          return (
            <div
              key={phase.key}
              className={`pipeline-phase pipeline-phase--${state} ${isNashPhase ? 'pipeline-phase--nash' : ''}`}
            >
              <div className="pipeline-phase-header">
                <span className="pipeline-phase-icon">
                  {state === 'done' ? '\u2713' : phase.icon}
                </span>
                <span className={`pipeline-phase-label ${state === 'skipped' ? 'strikethrough' : ''}`}>
                  {phase.label}
                </span>
                {state === 'active' && phase.key === 'simulation' && (
                  <span className="pipeline-round-badge">
                    R{currentRound}/{totalRounds}
                  </span>
                )}
              </div>
              <div className="pipeline-phase-track">
                <div
                  className={`pipeline-phase-fill ${isNashPhase ? 'pipeline-phase-fill--violet' : ''}`}
                  style={{
                    width:
                      state === 'done'
                        ? '100%'
                        : state === 'active'
                        ? `${phaseProgress}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {estimatedRemaining !== null && (
        <div className="pipeline-eta">
          <span className="pipeline-eta-label">ETA</span>
          <span className="pipeline-eta-value">{estimatedRemaining}</span>
        </div>
      )}

      <style>{`
        .pipeline-bar {
          width: 100%;
          padding: 16px 0;
        }
        .pipeline-bar--compact { padding: 8px 0; }
        .pipeline-phases {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
        }
        .pipeline-phase {
          padding: 12px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          transition: all 0.3s;
        }
        .pipeline-bar--compact .pipeline-phase { padding: 8px 10px; }
        .pipeline-phase--done {
          border-color: rgba(0,212,170,0.25);
          background: var(--teal-dim);
        }
        .pipeline-phase--active {
          border-color: var(--teal);
          animation: borderGlow 2s ease-in-out infinite;
        }
        .pipeline-phase--active.pipeline-phase--nash {
          border-color: var(--violet);
        }
        .pipeline-phase--skipped {
          opacity: 0.35;
        }
        .pipeline-phase-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .pipeline-bar--compact .pipeline-phase-header { margin-bottom: 4px; }
        .pipeline-phase-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }
        .pipeline-phase--done .pipeline-phase-icon { color: var(--teal); }
        .pipeline-phase--active .pipeline-phase-icon { color: var(--teal); }
        .pipeline-phase--active.pipeline-phase--nash .pipeline-phase-icon { color: var(--violet); }
        .pipeline-phase--pending .pipeline-phase-icon { color: var(--text-dim); }
        .pipeline-phase-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .pipeline-phase--done .pipeline-phase-label { color: var(--teal); }
        .pipeline-phase--pending .pipeline-phase-label { color: var(--text-dim); }
        .strikethrough { text-decoration: line-through; }
        .pipeline-round-badge {
          margin-left: auto;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--teal);
          background: var(--teal-dim);
          padding: 2px 8px;
          border-radius: 100px;
          animation: progressPulse 1.5s ease-in-out infinite;
        }
        .pipeline-phase-track {
          height: 3px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .pipeline-phase-fill {
          height: 100%;
          background: var(--teal);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .pipeline-phase-fill--violet { background: var(--violet); }
        .pipeline-phase--active .pipeline-phase-fill {
          box-shadow: 0 0 8px var(--teal-glow);
        }
        .pipeline-eta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          justify-content: flex-end;
        }
        .pipeline-eta-label {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
          text-transform: uppercase;
        }
        .pipeline-eta-value {
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-secondary);
        }
        @media (max-width: 768px) {
          .pipeline-phases {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
