import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Editor from '@monaco-editor/react';
import Navbar from '../components/Navbar';
import { simulationTypes } from '../data/simulationTypes';

const STEPS = ['Type', 'Basics', 'Seed Config', 'Sim Config', 'Review'];

const DEFAULT_SEED = `{
  "simulation_title": "",
  "actors": [
    {
      "name": "Actor1",
      "type": "institution",
      "role": "Primary decision-maker",
      "goals": ["Maximize market share", "Maintain stability"],
      "resources": { "influence": 80, "capital": 100 },
      "relationships": {}
    },
    {
      "name": "Actor2",
      "type": "regulator",
      "role": "Oversight authority",
      "goals": ["Ensure compliance", "Protect consumers"],
      "resources": { "influence": 90, "capital": 50 },
      "relationships": {
        "Actor1": { "type": "regulatory", "strength": 0.7 }
      }
    }
  ],
  "environment": {
    "market_conditions": "stable",
    "regulatory_pressure": "moderate",
    "growth_rate": 2.5
  },
  "initial_conditions": "Describe the starting situation..."
}`;

export default function ScenarioWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0: Type
  const [selectedType, setSelectedType] = useState(null);
  const [customType, setCustomType] = useState('');

  // Step 1: Basics
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Step 2: Seed
  const [seedTab, setSeedTab] = useState('manual');
  const [seedConfig, setSeedConfig] = useState(DEFAULT_SEED);
  const [autoPrompt, setAutoPrompt] = useState('');

  // Step 3: Sim config
  const [rounds, setRounds] = useState(50);
  const [nashEnabled, setNashEnabled] = useState(true);
  const [verbosity, setVerbosity] = useState('standard');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSeedConfig(reader.result);
      reader.readAsText(file);
      setSeedTab('manual');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
  });

  const canNext = () => {
    if (step === 0) return selectedType !== null;
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return seedConfig.trim().length > 0;
    return true;
  };

  const handleLaunch = () => {
    const runId = Date.now().toString();
    navigate(`/projects/${projectId}/scenarios/new-scenario/run/${runId}`);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 960 }}>
        {/* Step indicator */}
        <div className="wizard-steps fade-up">
          {STEPS.map((s, i) => (
            <div key={s} className={`wizard-step ${i === step ? 'wizard-step--active' : ''} ${i < step ? 'wizard-step--done' : ''}`}>
              <div className="wizard-step-num">{i < step ? '\u2713' : i}</div>
              <span className="wizard-step-label">{s}</span>
            </div>
          ))}
          <div className="wizard-step-line" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {/* Step 0: Type Selection */}
        {step === 0 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Select Simulation Type</h2>
            <p className="text-secondary text-sm mb-24">Choose the strategic domain for your scenario</p>
            <div className="wizard-type-grid">
              {simulationTypes.map((t) => (
                <button
                  key={t.id}
                  className={`wizard-type-card ${selectedType === t.id ? 'wizard-type-card--selected' : ''}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  <div className="wizard-type-icon">{t.icon}</div>
                  <div className="wizard-type-name">{t.name}</div>
                  <div className="wizard-type-desc">{t.description}</div>
                  <div className="wizard-type-meta">
                    <span>Complexity: {'*'.repeat(t.complexity)}</span>
                    <span>Agents: {t.agents}</span>
                  </div>
                </button>
              ))}
              <button
                className={`wizard-type-card wizard-type-card--custom ${selectedType === 'custom' ? 'wizard-type-card--selected' : ''}`}
                onClick={() => setSelectedType('custom')}
              >
                <div className="wizard-type-icon">{'\u{2795}'}</div>
                <div className="wizard-type-name">Custom</div>
                <div className="wizard-type-desc">Define your own simulation type with custom agent archetypes and dynamics.</div>
                {selectedType === 'custom' && (
                  <input
                    className="input mt-8"
                    placeholder="Custom type name..."
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Basic Information</h2>
            <div className="wizard-form">
              <div className="wizard-field">
                <label className="label">Scenario Name</label>
                <input
                  className="input"
                  placeholder="e.g., Baseline - Normal Market Conditions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="wizard-field">
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Describe the strategic question this scenario explores..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="wizard-field">
                <label className="label">Tags (comma separated)</label>
                <input
                  className="input"
                  placeholder="e.g., finance, stress-test, caribbean"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Seed Config */}
        {step === 2 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Seed Configuration</h2>
            <div className="tabs">
              {[
                { id: 'manual', label: 'Manual Editor' },
                { id: 'auto', label: 'Auto-Generate' },
                { id: 'upload', label: 'Upload' },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`tab ${seedTab === t.id ? 'active' : ''}`}
                  onClick={() => setSeedTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {seedTab === 'manual' && (
              <div className="wizard-editor">
                <Editor
                  height="420px"
                  defaultLanguage="json"
                  value={seedConfig}
                  onChange={(val) => setSeedConfig(val || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: '"DM Mono", monospace',
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                    padding: { top: 12 },
                  }}
                />
              </div>
            )}

            {seedTab === 'auto' && (
              <div className="wizard-auto">
                <label className="label">Describe Your Scenario</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 160 }}
                  placeholder="Describe the scenario in natural language and the AI will generate a seed configuration. Example: 'A Caribbean banking system with 5 commercial banks, a central bank, and a fintech startup. The central bank is considering raising interest rates while the fintech company is launching a disruptive digital lending platform.'"
                  value={autoPrompt}
                  onChange={(e) => setAutoPrompt(e.target.value)}
                />
                <button
                  className="btn-violet mt-16"
                  disabled={!autoPrompt.trim()}
                  onClick={() => {
                    setSeedTab('manual');
                  }}
                >
                  Generate Seed Configuration
                </button>
              </div>
            )}

            {seedTab === 'upload' && (
              <div
                {...getRootProps()}
                className={`wizard-dropzone ${isDragActive ? 'wizard-dropzone--active' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="wizard-dropzone-icon">{'\u{1F4C1}'}</div>
                <p className="wizard-dropzone-text">
                  {isDragActive
                    ? 'Drop your JSON file here...'
                    : 'Drag & drop a seed JSON file, or click to browse'}
                </p>
                <span className="text-dim text-xs">Accepts .json files</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Sim Config */}
        {step === 3 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Simulation Configuration</h2>
            <div className="wizard-form">
              <div className="wizard-field">
                <label className="label">Simulation Rounds: {rounds}</label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                />
                <div className="wizard-range-labels">
                  <span>10</span>
                  <span>200</span>
                </div>
              </div>

              <div className="wizard-field">
                <label className="label">Nash Equilibrium Pre-Pass</label>
                <div className="wizard-toggle-row">
                  <button
                    className={`toggle ${nashEnabled ? 'active' : ''}`}
                    onClick={() => setNashEnabled(!nashEnabled)}
                  />
                  <span className="text-sm">
                    {nashEnabled
                      ? 'Enabled - Compute game-theoretic equilibria before simulation'
                      : 'Disabled - Run simulation without Nash analysis'}
                  </span>
                </div>
              </div>

              <div className="wizard-field">
                <label className="label">Verbosity</label>
                <div className="wizard-verbosity-options">
                  {['minimal', 'standard', 'verbose'].map((v) => (
                    <button
                      key={v}
                      className={`wizard-verbosity-btn ${verbosity === v ? 'wizard-verbosity-btn--active' : ''}`}
                      onClick={() => setVerbosity(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Review & Launch</h2>
            <div className="wizard-review">
              <div className="wizard-review-row">
                <span className="wizard-review-label">Type</span>
                <span className="wizard-review-value">
                  {selectedType === 'custom' ? customType || 'Custom' : simulationTypes.find((t) => t.id === selectedType)?.name}
                </span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Name</span>
                <span className="wizard-review-value">{name}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Description</span>
                <span className="wizard-review-value">{description || '(none)'}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Tags</span>
                <span className="wizard-review-value">
                  {tags ? tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="pill" style={{ marginRight: 6 }}>{t}</span>
                  )) : '(none)'}
                </span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Rounds</span>
                <span className="wizard-review-value text-mono">{rounds}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Nash Pre-Pass</span>
                <span className="wizard-review-value">
                  <span className={`badge ${nashEnabled ? 'badge-violet' : 'badge-amber'}`}>
                    {nashEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Verbosity</span>
                <span className="wizard-review-value text-mono">{verbosity}</span>
              </div>
              <div className="wizard-review-row" style={{ alignItems: 'flex-start' }}>
                <span className="wizard-review-label">Seed Config</span>
                <div className="wizard-review-seed">
                  <pre>{seedConfig.substring(0, 400)}{seedConfig.length > 400 ? '...' : ''}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="wizard-nav fade-up-d2">
          <button
            className="btn-ghost"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button
              className="btn-primary"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={handleLaunch}>
              Launch Simulation {'\u{1F680}'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .wizard-steps {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          position: relative;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .wizard-step {
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }
        .wizard-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--surface2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: 12px;
          color: var(--text-dim);
        }
        .wizard-step--active .wizard-step-num {
          background: var(--teal-dim);
          border-color: var(--teal);
          color: var(--teal);
        }
        .wizard-step--done .wizard-step-num {
          background: var(--teal);
          border-color: var(--teal);
          color: var(--bg);
        }
        .wizard-step-label {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.5px;
          color: var(--text-dim);
        }
        .wizard-step--active .wizard-step-label { color: var(--teal); }
        .wizard-step--done .wizard-step-label { color: var(--text-secondary); }
        .wizard-step-line {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--teal);
          transition: width 0.3s ease;
          border-radius: 1px;
        }
        .wizard-panel { margin-bottom: 32px; }
        .wizard-title {
          font-family: var(--display);
          font-size: 22px;
          margin-bottom: 8px;
        }
        .wizard-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .wizard-type-card {
          text-align: left;
          padding: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--text-primary);
        }
        .wizard-type-card:hover {
          border-color: var(--border-bright);
          background: var(--surface2);
        }
        .wizard-type-card--selected {
          border-color: var(--teal);
          background: var(--teal-dim);
        }
        .wizard-type-icon { font-size: 24px; }
        .wizard-type-name { font-family: var(--display); font-size: 14px; font-weight: 600; }
        .wizard-type-desc { font-size: 12px; color: var(--text-dim); line-height: 1.5; }
        .wizard-type-meta {
          display: flex;
          gap: 12px;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-top: auto;
        }
        .wizard-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .wizard-field { display: flex; flex-direction: column; }
        .wizard-editor {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .wizard-auto { display: flex; flex-direction: column; }
        .wizard-dropzone {
          border: 2px dashed var(--border-bright);
          border-radius: 12px;
          padding: 64px 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .wizard-dropzone:hover { border-color: var(--teal); background: var(--teal-dim); }
        .wizard-dropzone--active { border-color: var(--teal); background: var(--teal-dim); }
        .wizard-dropzone-icon { font-size: 36px; opacity: 0.5; }
        .wizard-dropzone-text { font-size: 14px; color: var(--text-secondary); }
        .wizard-range-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          margin-top: 4px;
        }
        .wizard-toggle-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .wizard-verbosity-options {
          display: flex;
          gap: 8px;
        }
        .wizard-verbosity-btn {
          padding: 8px 20px;
          font-family: var(--mono);
          font-size: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }
        .wizard-verbosity-btn:hover { border-color: var(--border-bright); }
        .wizard-verbosity-btn--active {
          border-color: var(--teal);
          background: var(--teal-dim);
          color: var(--teal);
        }
        .wizard-review {
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .wizard-review-row {
          display: flex;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }
        .wizard-review-row:last-child { border-bottom: none; }
        .wizard-review-label {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-dim);
          width: 140px;
          flex-shrink: 0;
        }
        .wizard-review-value {
          font-size: 14px;
          color: var(--text-primary);
        }
        .wizard-review-seed {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          overflow-x: auto;
          flex: 1;
        }
        .wizard-review-seed pre {
          font-family: var(--mono);
          font-size: 11px;
          color: var(--text-dim);
          line-height: 1.4;
          white-space: pre-wrap;
        }
        .wizard-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        @media (max-width: 768px) {
          .wizard-type-grid { grid-template-columns: 1fr; }
          .wizard-steps { gap: 12px; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
