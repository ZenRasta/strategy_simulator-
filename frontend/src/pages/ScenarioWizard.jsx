import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { simulationTypes } from '../data/simulationTypes';
import { api } from '../lib/api';
import useAppStore from '../store/appStore';

const STEPS = ['Type', 'Basics', 'Seed Config', 'Sim Config', 'Review'];

export default function ScenarioWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { createScenario } = useAppStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Type
  const [selectedType, setSelectedType] = useState(null);
  const [subTemplates, setSubTemplates] = useState([]);
  const [selectedSubTemplate, setSelectedSubTemplate] = useState(null);

  // Step 1: Basics
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Step 2: Seed
  const [seedTab, setSeedTab] = useState('template');
  const [seedConfig, setSeedConfig] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [searchSources, setSearchSources] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Step 3: Sim config
  const [rounds, setRounds] = useState(40);
  const [nashEnabled, setNashEnabled] = useState(true);
  const [verbosity, setVerbosity] = useState('standard');

  // When type changes, load scaffold and sub-templates
  useEffect(() => {
    if (!selectedType || selectedType === 'custom') {
      setSubTemplates([]);
      return;
    }
    const typeObj = simulationTypes.find(t => t.id === selectedType);
    if (typeObj) {
      const mid = Math.round((typeObj.recommended_rounds[0] + typeObj.recommended_rounds[1]) / 2);
      setRounds(mid);
      setNashEnabled(typeObj.nash_recommended !== false);
      setDescription(typeObj.tagline || '');
    }
    // Load sub-templates
    api(`/simulation-types/${selectedType}/templates`).then(data => {
      setSubTemplates(data || []);
    }).catch(() => setSubTemplates([]));
  }, [selectedType]);

  // Load seed scaffold from template
  async function loadTemplateScaffold() {
    setSeedLoading(true);
    try {
      if (selectedSubTemplate) {
        // Sub-template is already a full seed
        setSeedConfig(JSON.stringify(selectedSubTemplate, null, 2));
      } else {
        const data = await api(`/simulation-types/${selectedType}/scaffold`);
        setSeedConfig(JSON.stringify(data, null, 2));
      }
    } catch {
      // If no scaffold, use a basic structure
      setSeedConfig(JSON.stringify({
        simulation_type: selectedType,
        scenario_trigger: "",
        actors: [],
        environment_variables: {},
        prediction_questions: []
      }, null, 2));
    }
    setSeedLoading(false);
  }

  // File upload
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // For JSON files, read directly
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = () => {
        setSeedConfig(reader.result);
        setUploadedFileName(file.name);
        setSeedTab('manual');
        toast.success(`Loaded ${file.name}`);
      };
      reader.readAsText(file);
      return;
    }

    // For PDF/DOCX/TXT/XLSX, upload to backend for extraction
    setSeedLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('simulation_type', selectedType || 'corporate_strategy');

      const response = await fetch('/api/seed/from-file', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      const data = json.data || json;

      if (data.seed_scaffold) {
        setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      }
      setUploadedFileName(file.name);
      setSeedTab('manual');
      toast.success(`Extracted ${data.text_length?.toLocaleString() || 0} characters from ${file.name}`);
    } catch (err) {
      toast.error(err.message || 'Failed to extract file');
    }
    setSeedLoading(false);
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt', '.md', '.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  // URL extraction
  async function extractFromUrl() {
    if (!urlInput.trim()) return;
    setSeedLoading(true);
    try {
      const data = await api('/seed/from-url', 'POST', {
        url: urlInput.trim(),
        simulation_type: selectedType || 'corporate_strategy',
      });
      if (data.seed_scaffold) {
        setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      }
      setSearchSources([{ title: urlInput, url: urlInput }]);
      setSeedTab('manual');
      toast.success(`Extracted ${data.text_length?.toLocaleString() || 0} characters from URL`);
    } catch (err) {
      toast.error(err.message || 'Failed to extract URL');
    }
    setSeedLoading(false);
  }

  // Web search
  async function searchAndGenerate() {
    if (!searchQuery.trim()) return;
    setSeedLoading(true);
    try {
      const data = await api('/seed/from-search', 'POST', {
        query: searchQuery.trim(),
        simulation_type: selectedType || 'corporate_strategy',
        max_results: 10,
      });
      if (data.seed_scaffold) {
        setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      }
      setSearchSources(data.sources || []);
      setSeedTab('manual');
      toast.success(`Found ${data.sources?.length || 0} sources. Seed scaffold ready for customisation.`);
    } catch (err) {
      toast.error(err.message || 'Search failed');
    }
    setSeedLoading(false);
  }

  const canNext = () => {
    if (step === 0) return selectedType !== null;
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return seedConfig.trim().length > 0;
    return true;
  };

  const handleLaunch = async () => {
    setSaving(true);
    try {
      let parsedSeed = seedConfig;
      try { parsedSeed = JSON.parse(seedConfig); } catch {}

      const scenario = await createScenario(projectId, {
        name: name.trim(),
        description: description.trim(),
        simulation_type: selectedType,
        sub_template: selectedSubTemplate?.id || null,
        seed_file: typeof parsedSeed === 'string' ? parsedSeed : JSON.stringify(parsedSeed),
        config: JSON.stringify({ rounds, nash_enabled: nashEnabled, verbosity, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      toast.success('Scenario created!');
      navigate(`/projects/${projectId}/scenarios/${scenario.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create scenario');
    }
    setSaving(false);
  };

  const getTypeObj = () => simulationTypes.find(t => t.id === selectedType);

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
            <h2 className="wizard-title">What would you like to simulate?</h2>
            <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>Choose a simulation type to get pre-configured seeds, actor templates, and extraction directives</p>
            <div className="wizard-type-grid">
              {simulationTypes.map((t) => {
                const colVar = t.colour || '--teal';
                return (
                  <button
                    key={t.id}
                    className={`wizard-type-card ${selectedType === t.id ? 'wizard-type-card--selected' : ''}`}
                    onClick={() => { setSelectedType(t.id); setSelectedSubTemplate(null); }}
                    style={selectedType === t.id ? { borderColor: `var(${colVar})`, background: `var(${colVar.replace('--', '--') + '-dim'})` } : {}}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 28 }}>{t.icon}</span>
                      {t.mirofish_fit && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: `var(${colVar})` }}>
                          {'★'.repeat(t.mirofish_fit)}{'☆'.repeat(5 - (t.mirofish_fit || 0))}
                        </span>
                      )}
                    </div>
                    <div className="wizard-type-name">{t.name}</div>
                    <div className="wizard-type-desc">{t.tagline}</div>
                    <div className="wizard-type-meta">
                      {t.recommended_rounds && <span>Rounds: {t.recommended_rounds[0]}–{t.recommended_rounds[1]}</span>}
                      {t.min_actors && <span>Actors: {t.min_actors}–{t.max_actors}</span>}
                      {t.nash_recommended !== undefined && <span>Nash: {t.nash_recommended ? 'Yes' : 'Opt.'}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-templates */}
            {subTemplates.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, marginBottom: 12 }}>Pre-built Templates</h3>
                <p className="text-secondary text-sm" style={{ marginBottom: 12 }}>Select a ready-to-use template or proceed with a blank scaffold</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className={`card card-interactive ${!selectedSubTemplate ? 'card--selected' : ''}`}
                    onClick={() => setSelectedSubTemplate(null)}
                    style={{ padding: '12px 20px', minWidth: 200, textAlign: 'left', border: !selectedSubTemplate ? '1px solid var(--teal)' : undefined, background: !selectedSubTemplate ? 'var(--teal-dim)' : undefined }}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>Blank Scaffold</span>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Start with the type's default template</p>
                  </button>
                  {subTemplates.map((tmpl, i) => (
                    <button
                      key={i}
                      className={`card card-interactive ${selectedSubTemplate === tmpl ? 'card--selected' : ''}`}
                      onClick={() => setSelectedSubTemplate(tmpl)}
                      style={{ padding: '12px 20px', minWidth: 200, textAlign: 'left', border: selectedSubTemplate === tmpl ? '1px solid var(--teal)' : undefined, background: selectedSubTemplate === tmpl ? 'var(--teal-dim)' : undefined }}
                    >
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>
                        {tmpl.title || tmpl.world_description || `Template ${i + 1}`}
                      </span>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                        {tmpl.scenario_trigger ? tmpl.scenario_trigger.slice(0, 80) + '...' : 'Pre-configured seed'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Basic Information</h2>
            <div className="wizard-form">
              <div className="wizard-field">
                <label className="label">Scenario Name</label>
                <input className="input" placeholder="e.g., Baseline - Normal Market Conditions" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="wizard-field">
                <label className="label">Description</label>
                <textarea className="textarea" placeholder="Describe the strategic question this scenario explores..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="wizard-field">
                <label className="label">Tags (comma separated)</label>
                <input className="input" placeholder="e.g., finance, stress-test, caribbean" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Seed Config */}
        {step === 2 && (
          <div className="wizard-panel fade-up-d1">
            <h2 className="wizard-title">Seed Configuration</h2>
            <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Build or import your simulation world definition</p>

            <div className="tabs" style={{ marginBottom: 20 }}>
              {[
                { id: 'template', label: 'From Template' },
                { id: 'manual', label: 'Manual Editor' },
                { id: 'upload', label: 'Upload File' },
                { id: 'url', label: 'From URL' },
                { id: 'search', label: 'Web Search' },
              ].map((t) => (
                <button key={t.id} className={`tab ${seedTab === t.id ? 'active' : ''}`} onClick={() => setSeedTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* From Template */}
            {seedTab === 'template' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Load the canonical seed scaffold for <strong style={{ color: 'var(--teal)' }}>{getTypeObj()?.name || selectedType}</strong>.
                  This includes pre-defined actor roles, relationships, and environment variables with REPLACE: placeholders for you to customise.
                </p>
                <button className="btn-primary" onClick={loadTemplateScaffold} disabled={seedLoading} style={{ alignSelf: 'flex-start' }}>
                  {seedLoading ? 'Loading...' : seedConfig ? 'Reload Template Scaffold' : 'Load Template Scaffold'}
                </button>
                {seedConfig && (
                  <div style={{ marginTop: 8 }}>
                    <div className="wizard-editor">
                      <Editor
                        height="400px"
                        defaultLanguage="json"
                        value={seedConfig}
                        onChange={(val) => setSeedConfig(val || '')}
                        theme="vs-dark"
                        options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Editor */}
            {seedTab === 'manual' && (
              <div>
                {searchSources.length > 0 && (
                  <details style={{ marginBottom: 12 }}>
                    <summary style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)', cursor: 'pointer' }}>
                      Sources ({searchSources.length})
                    </summary>
                    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {searchSources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                          {s.title || s.url}
                        </a>
                      ))}
                    </div>
                  </details>
                )}
                {uploadedFileName && (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    Source file: {uploadedFileName}
                  </p>
                )}
                <div className="wizard-editor">
                  <Editor
                    height="420px"
                    defaultLanguage="json"
                    value={seedConfig}
                    onChange={(val) => setSeedConfig(val || '')}
                    theme="vs-dark"
                    options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }}
                  />
                </div>
              </div>
            )}

            {/* Upload File */}
            {seedTab === 'upload' && (
              <div>
                <div {...getRootProps()} className={`wizard-dropzone ${isDragActive ? 'wizard-dropzone--active' : ''}`}>
                  <input {...getInputProps()} />
                  {seedLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div className="spinner" />
                      <p style={{ fontSize: 14, color: 'var(--teal)' }}>Extracting text and generating seed...</p>
                    </div>
                  ) : (
                    <>
                      <div className="wizard-dropzone-icon">&#128193;</div>
                      <p className="wizard-dropzone-text">
                        {isDragActive ? 'Drop your file here...' : 'Drag & drop a file, or click to browse'}
                      </p>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                        Supports: PDF, DOCX, TXT, Markdown, CSV, XLSX, JSON
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* From URL */}
            {seedTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Enter a URL to extract content from. Tavily will fetch the page content and generate a seed scaffold based on the extracted text and the selected simulation type.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    className="input"
                    placeholder="https://example.com/article-about-your-scenario"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => e.key === 'Enter' && extractFromUrl()}
                  />
                  <button className="btn-primary" onClick={extractFromUrl} disabled={seedLoading || !urlInput.trim()}>
                    {seedLoading ? 'Extracting...' : 'Extract'}
                  </button>
                </div>
                {seedLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--surface)', borderRadius: 8 }}>
                    <div className="spinner" />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>Fetching and extracting content from URL...</span>
                  </div>
                )}
              </div>
            )}

            {/* Web Search */}
            {seedTab === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Search the web for information about your scenario. Tavily will aggregate multiple sources and generate a seed scaffold.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    className="input"
                    placeholder="e.g., Trinidad banking system crypto capital flight 2025"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => e.key === 'Enter' && searchAndGenerate()}
                  />
                  <button className="btn-primary" onClick={searchAndGenerate} disabled={seedLoading || !searchQuery.trim()}>
                    {seedLoading ? 'Searching...' : 'Search & Generate'}
                  </button>
                </div>
                {seedLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--surface)', borderRadius: 8 }}>
                    <div className="spinner" />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>Searching web and building seed from results...</span>
                  </div>
                )}
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
                <label className="label">
                  Simulation Rounds: <span style={{ color: 'var(--teal)', fontFamily: 'var(--mono)' }}>{rounds}</span>
                  {getTypeObj()?.recommended_rounds && (
                    <span style={{ color: 'var(--text-dim)', fontSize: 11, marginLeft: 8 }}>
                      (recommended: {getTypeObj().recommended_rounds[0]}–{getTypeObj().recommended_rounds[1]})
                    </span>
                  )}
                </label>
                <input type="range" min="10" max="200" value={rounds} onChange={(e) => setRounds(parseInt(e.target.value))} />
                <div className="wizard-range-labels"><span>10</span><span>200</span></div>
              </div>
              <div className="wizard-field">
                <label className="label">Nash Equilibrium Pre-Pass</label>
                <div className="wizard-toggle-row">
                  <button className={`toggle ${nashEnabled ? 'active' : ''}`} onClick={() => setNashEnabled(!nashEnabled)} />
                  <span className="text-sm">
                    {nashEnabled ? 'Enabled — Compute game-theoretic equilibria before simulation' : 'Disabled — Run simulation without Nash analysis'}
                  </span>
                </div>
              </div>
              <div className="wizard-field">
                <label className="label">Verbosity</label>
                <div className="wizard-verbosity-options">
                  {['minimal', 'standard', 'verbose'].map((v) => (
                    <button key={v} className={`wizard-verbosity-btn ${verbosity === v ? 'wizard-verbosity-btn--active' : ''}`} onClick={() => setVerbosity(v)}>
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
                <span className="wizard-review-value">{getTypeObj()?.name || selectedType}</span>
              </div>
              {selectedSubTemplate && (
                <div className="wizard-review-row">
                  <span className="wizard-review-label">Template</span>
                  <span className="wizard-review-value">{selectedSubTemplate.title || 'Sub-template'}</span>
                </div>
              )}
              <div className="wizard-review-row">
                <span className="wizard-review-label">Name</span>
                <span className="wizard-review-value">{name}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Description</span>
                <span className="wizard-review-value">{description || '(none)'}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Rounds</span>
                <span className="wizard-review-value text-mono">{rounds}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Nash</span>
                <span className="wizard-review-value">
                  <span className={`badge ${nashEnabled ? 'badge-violet' : 'badge-amber'}`}>{nashEnabled ? 'Enabled' : 'Disabled'}</span>
                </span>
              </div>
              <div className="wizard-review-row" style={{ alignItems: 'flex-start' }}>
                <span className="wizard-review-label">Seed</span>
                <div className="wizard-review-seed">
                  <pre>{seedConfig.substring(0, 500)}{seedConfig.length > 500 ? '\n...' : ''}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="wizard-nav fade-up-d2">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button className="btn-primary" disabled={!canNext()} onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn-primary" onClick={handleLaunch} disabled={saving}>
              {saving ? 'Creating...' : 'Save & Launch'} &#x1F680;
            </button>
          )}
        </div>
      </div>

      <style>{`
        .wizard-steps { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; position: relative; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .wizard-step { display: flex; align-items: center; gap: 8px; z-index: 1; }
        .wizard-step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-size: 12px; color: var(--text-dim); }
        .wizard-step--active .wizard-step-num { background: var(--teal-dim); border-color: var(--teal); color: var(--teal); }
        .wizard-step--done .wizard-step-num { background: var(--teal); border-color: var(--teal); color: var(--bg); }
        .wizard-step-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.5px; color: var(--text-dim); }
        .wizard-step--active .wizard-step-label { color: var(--teal); }
        .wizard-step--done .wizard-step-label { color: var(--text-secondary); }
        .wizard-step-line { position: absolute; bottom: 0; left: 0; height: 2px; background: var(--teal); transition: width 0.3s ease; border-radius: 1px; }
        .wizard-panel { margin-bottom: 32px; }
        .wizard-title { font-family: var(--display); font-size: 22px; margin-bottom: 8px; }
        .wizard-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .wizard-type-card { text-align: left; padding: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 8px; color: var(--text-primary); }
        .wizard-type-card:hover { border-color: var(--border-bright); background: var(--surface2); transform: translateY(-2px); }
        .wizard-type-card--selected { border-color: var(--teal); background: var(--teal-dim); }
        .wizard-type-name { font-family: var(--display); font-size: 14px; font-weight: 600; }
        .wizard-type-desc { font-size: 12px; color: var(--text-dim); line-height: 1.5; flex: 1; }
        .wizard-type-meta { display: flex; gap: 12px; font-family: var(--mono); font-size: 10px; color: var(--text-dim); margin-top: auto; }
        .wizard-form { display: flex; flex-direction: column; gap: 24px; }
        .wizard-field { display: flex; flex-direction: column; }
        .wizard-editor { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .wizard-dropzone { border: 2px dashed var(--border-bright); border-radius: 12px; padding: 64px 32px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .wizard-dropzone:hover, .wizard-dropzone--active { border-color: var(--teal); background: var(--teal-dim); }
        .wizard-dropzone-icon { font-size: 36px; opacity: 0.5; }
        .wizard-dropzone-text { font-size: 14px; color: var(--text-secondary); }
        .wizard-range-labels { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--text-dim); margin-top: 4px; }
        .wizard-toggle-row { display: flex; align-items: center; gap: 14px; }
        .wizard-verbosity-options { display: flex; gap: 8px; }
        .wizard-verbosity-btn { padding: 8px 20px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); cursor: pointer; text-transform: capitalize; transition: all 0.2s; }
        .wizard-verbosity-btn:hover { border-color: var(--border-bright); }
        .wizard-verbosity-btn--active { border-color: var(--teal); background: var(--teal-dim); color: var(--teal); }
        .wizard-review { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .wizard-review-row { display: flex; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--border); }
        .wizard-review-row:last-child { border-bottom: none; }
        .wizard-review-label { font-family: var(--mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); width: 140px; flex-shrink: 0; }
        .wizard-review-value { font-size: 14px; color: var(--text-primary); }
        .wizard-review-seed { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 12px; overflow-x: auto; flex: 1; }
        .wizard-review-seed pre { font-family: var(--mono); font-size: 11px; color: var(--text-dim); line-height: 1.4; white-space: pre-wrap; }
        .wizard-nav { display: flex; align-items: center; gap: 12px; padding-top: 24px; border-top: 1px solid var(--border); }
        .tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .tab { padding: 8px 16px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
        .tab:hover { border-color: var(--border-bright); }
        .tab.active { border-color: var(--teal); background: var(--teal-dim); color: var(--teal); }
        .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .wizard-type-grid { grid-template-columns: 1fr; }
          .wizard-steps { gap: 12px; flex-wrap: wrap; }
          .tabs { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
