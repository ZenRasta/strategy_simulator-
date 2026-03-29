import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { simulationTypes } from '../data/simulationTypes';
import { api } from '../lib/api';
import useAppStore from '../store/appStore';

const STEPS = ['Approach', 'Details', 'Seed Data', 'Review'];

export default function NewProject() {
  const navigate = useNavigate();
  const { createProject, createScenario } = useAppStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Approach
  const [approach, setApproach] = useState(null); // 'template' | 'custom'
  const [selectedType, setSelectedType] = useState(null);
  const [subTemplates, setSubTemplates] = useState([]);
  const [selectedSubTemplate, setSelectedSubTemplate] = useState(null);

  // Step 1: Details
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioName, setScenarioName] = useState('');

  // Step 2: Seed
  const [seedMethod, setSeedMethod] = useState('template'); // template | manual | upload | url | search
  const [seedConfig, setSeedConfig] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [searchSources, setSearchSources] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Load sub-templates when type changes
  useEffect(() => {
    if (!selectedType || selectedType === 'custom') {
      setSubTemplates([]);
      return;
    }
    api(`/simulation-types/${selectedType}/templates`).then(data => {
      setSubTemplates(data || []);
    }).catch(() => setSubTemplates([]));

    const typeObj = simulationTypes.find(t => t.id === selectedType);
    if (typeObj) {
      setDescription(typeObj.tagline || '');
      setIndustry(typeObj.category || '');
    }
  }, [selectedType]);

  // When approach changes, set seed method
  useEffect(() => {
    if (approach === 'template') setSeedMethod('template');
    else setSeedMethod('manual');
  }, [approach]);

  // Load template scaffold
  async function loadTemplateScaffold() {
    setSeedLoading(true);
    try {
      if (selectedSubTemplate) {
        setSeedConfig(JSON.stringify(selectedSubTemplate, null, 2));
      } else if (selectedType && selectedType !== 'custom') {
        const data = await api(`/simulation-types/${selectedType}/scaffold`);
        setSeedConfig(JSON.stringify(data, null, 2));
      }
    } catch {
      setSeedConfig(JSON.stringify({ simulation_type: selectedType || 'custom', actors: [], environment_variables: {}, scenario_trigger: '' }, null, 2));
    }
    setSeedLoading(false);
  }

  // Auto-load scaffold when entering seed step with template approach
  useEffect(() => {
    if (step === 2 && approach === 'template' && !seedConfig && selectedType) {
      loadTemplateScaffold();
    }
  }, [step]);

  // File upload
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = () => { setSeedConfig(reader.result); setUploadedFileName(file.name); toast.success(`Loaded ${file.name}`); };
      reader.readAsText(file);
      return;
    }
    setSeedLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('simulation_type', selectedType || 'corporate_strategy');
      const response = await fetch('/api/seed/from-file', { method: 'POST', body: formData });
      const json = await response.json();
      const data = json.data || json;
      if (data.seed_scaffold) setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      setUploadedFileName(file.name);
      toast.success(`Extracted ${data.text_length?.toLocaleString() || 0} chars from ${file.name}`);
    } catch (err) { toast.error(err.message || 'Failed to extract file'); }
    setSeedLoading(false);
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'], 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt', '.md', '.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  // URL extraction
  async function extractFromUrl() {
    if (!urlInput.trim()) return;
    setSeedLoading(true);
    try {
      const data = await api('/seed/from-url', 'POST', { url: urlInput.trim(), simulation_type: selectedType || 'corporate_strategy' });
      if (data.seed_scaffold) setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      setSearchSources([{ title: urlInput, url: urlInput }]);
      toast.success(`Extracted content from URL`);
    } catch (err) { toast.error(err.message || 'Failed to extract URL'); }
    setSeedLoading(false);
  }

  // Web search
  async function searchAndGenerate() {
    if (!searchQuery.trim()) return;
    setSeedLoading(true);
    try {
      const data = await api('/seed/from-search', 'POST', { query: searchQuery.trim(), simulation_type: selectedType || 'corporate_strategy', max_results: 10 });
      if (data.seed_scaffold) setSeedConfig(JSON.stringify(data.seed_scaffold, null, 2));
      setSearchSources(data.sources || []);
      toast.success(`Found ${data.sources?.length || 0} sources`);
    } catch (err) { toast.error(err.message || 'Search failed'); }
    setSeedLoading(false);
  }

  const canNext = () => {
    if (step === 0) {
      if (approach === 'template') return selectedType !== null;
      if (approach === 'custom') return true;
      return false;
    }
    if (step === 1) return projectName.trim().length > 0;
    if (step === 2) return seedConfig.trim().length > 0;
    return true;
  };

  // Create project + first scenario
  const handleCreate = async () => {
    setSaving(true);
    try {
      const project = await createProject({
        name: projectName.trim(),
        description: description.trim(),
        industry: industry.trim() || 'General',
      });

      if (seedConfig.trim()) {
        let parsedSeed = seedConfig;
        try { parsedSeed = JSON.parse(seedConfig); } catch {}
        await createScenario(project.id, {
          name: scenarioName.trim() || `${projectName} — Initial Scenario`,
          description: description.trim(),
          simulation_type: selectedType || 'custom',
          sub_template: selectedSubTemplate?.id || null,
          seed_file: typeof parsedSeed === 'string' ? parsedSeed : JSON.stringify(parsedSeed),
          config: JSON.stringify({ rounds: 40, nash_enabled: true, verbosity: 'standard' }),
        });
      }

      toast.success('Project created!');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
    setSaving(false);
  };

  const getTypeObj = () => simulationTypes.find(t => t.id === selectedType);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 960 }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, position: 'relative', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: 12,
                background: i < step ? 'var(--teal)' : i === step ? 'var(--teal-dim)' : 'var(--surface2)',
                border: `1px solid ${i <= step ? 'var(--teal)' : 'var(--border)'}`,
                color: i < step ? 'var(--bg)' : i === step ? 'var(--teal)' : 'var(--text-dim)',
              }}>
                {i < step ? '\u2713' : i}
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 0.5, color: i === step ? 'var(--teal)' : i < step ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{s}</span>
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: 'var(--teal)', width: `${(step / (STEPS.length - 1)) * 100}%`, transition: 'width 0.3s ease', borderRadius: 1 }} />
        </div>

        {/* Step 0: Approach */}
        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 8 }}>How would you like to start?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Choose a pre-built template or build a simulation from scratch</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              {/* From Template */}
              <button
                onClick={() => setApproach('template')}
                style={{
                  textAlign: 'left', padding: 28, background: approach === 'template' ? 'var(--teal-dim)' : 'var(--surface)',
                  border: `2px solid ${approach === 'template' ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>&#128203;</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>From Template</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                  Choose from 10 pre-configured simulation types with canonical actor templates, relationship maps, and extraction directives. Includes Caribbean-specific variants.
                </p>
              </button>

              {/* Build Your Own */}
              <button
                onClick={() => { setApproach('custom'); setSelectedType('custom'); }}
                style={{
                  textAlign: 'left', padding: 28, background: approach === 'custom' ? 'var(--teal-dim)' : 'var(--surface)',
                  border: `2px solid ${approach === 'custom' ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>&#9998;</div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Build Your Own</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                  Create a custom simulation from scratch. Upload documents, paste a URL, or use web search to auto-generate your seed file. Full control over actors and environment.
                </p>
              </button>
            </div>

            {/* Template type selection grid */}
            {approach === 'template' && (
              <div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 16 }}>Select Simulation Type</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {simulationTypes.filter(t => t.id !== 'custom').map((t) => {
                    const colVar = t.colour || '--teal';
                    const isSelected = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedType(t.id); setSelectedSubTemplate(null); }}
                        style={{
                          textAlign: 'left', padding: 16, cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)',
                          background: isSelected ? `var(${colVar}-dim)` : 'var(--surface)',
                          border: `1px solid ${isSelected ? `var(${colVar})` : 'var(--border)'}`,
                          borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 22 }}>{t.icon}</span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: `var(${colVar})` }}>
                            {'★'.repeat(t.mirofish_fit || 0)}{'☆'.repeat(5 - (t.mirofish_fit || 0))}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>{t.tagline}</span>
                        <div style={{ display: 'flex', gap: 8, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 'auto' }}>
                          <span>Rounds: {t.recommended_rounds?.[0]}–{t.recommended_rounds?.[1]}</span>
                          <span>Actors: {t.min_actors}–{t.max_actors}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-templates */}
                {subTemplates.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Pre-built Variants</h4>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setSelectedSubTemplate(null)}
                        style={{
                          padding: '10px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          background: !selectedSubTemplate ? 'var(--teal-dim)' : 'var(--surface)',
                          border: `1px solid ${!selectedSubTemplate ? 'var(--teal)' : 'var(--border)'}`,
                          color: 'var(--text-primary)', minWidth: 180,
                        }}
                      >
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>Default Scaffold</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Start with blank template</div>
                      </button>
                      {subTemplates.map((tmpl, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSubTemplate(tmpl)}
                          style={{
                            padding: '10px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                            background: selectedSubTemplate === tmpl ? 'var(--teal-dim)' : 'var(--surface)',
                            border: `1px solid ${selectedSubTemplate === tmpl ? 'var(--teal)' : 'var(--border)'}`,
                            color: 'var(--text-primary)', minWidth: 180,
                          }}
                        >
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)' }}>
                            {tmpl.title || tmpl.id?.replace(/_/g, ' ') || `Variant ${i + 1}`}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                            {tmpl.actors?.length || '?'} actors pre-configured
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Project Details */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 8 }}>Project Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
              {approach === 'custom' ? 'Define your project and simulation context' : `Configure your ${getTypeObj()?.name || 'simulation'} project`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  Project Name <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <input className="input" placeholder="e.g., Caribbean Financial System Analysis" value={projectName} onChange={(e) => setProjectName(e.target.value)} autoFocus />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  Industry / Domain <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <select className="select" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Select industry...</option>
                  <option value="Finance">Finance & Banking</option>
                  <option value="Technology">Technology</option>
                  <option value="Energy">Energy & Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Regulatory">Regulatory & Government</option>
                  <option value="Retail">Retail & Consumer</option>
                  <option value="Geopolitical">Geopolitical</option>
                  <option value="Logistics">Logistics & Supply Chain</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  Description
                </label>
                <textarea className="textarea" placeholder="What strategic question does this project explore?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 100 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  First Scenario Name
                </label>
                <input className="input" placeholder="e.g., Baseline — Status Quo" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Optional. You can add more scenarios later.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Seed Data */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 8 }}>Seed Data</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              Your seed file defines the actors, relationships, and environment for the simulation
            </p>

            {/* Method tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
              {[
                { id: 'template', label: '&#128203; From Template', show: approach === 'template' },
                { id: 'upload', label: '&#128194; Upload File', show: true },
                { id: 'url', label: '&#128279; From URL', show: true },
                { id: 'search', label: '&#128269; Web Search', show: true },
                { id: 'manual', label: '&#9998; Manual Editor', show: true },
              ].filter(t => t.show).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSeedMethod(t.id)}
                  dangerouslySetInnerHTML={{ __html: t.label }}
                  style={{
                    padding: '8px 16px', fontFamily: 'var(--mono)', fontSize: 12, borderRadius: 6, cursor: 'pointer',
                    background: seedMethod === t.id ? 'var(--teal-dim)' : 'var(--surface2)',
                    border: `1px solid ${seedMethod === t.id ? 'var(--teal)' : 'var(--border)'}`,
                    color: seedMethod === t.id ? 'var(--teal)' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>

            {/* From Template */}
            {seedMethod === 'template' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Loading canonical seed for <strong style={{ color: 'var(--teal)' }}>{getTypeObj()?.name || selectedType}</strong>
                    {selectedSubTemplate && <> — <strong style={{ color: 'var(--teal)' }}>{selectedSubTemplate.title || selectedSubTemplate.id}</strong></>}
                  </p>
                  <button className="btn-primary" onClick={loadTemplateScaffold} disabled={seedLoading} style={{ fontSize: 13 }}>
                    {seedLoading ? 'Loading...' : seedConfig ? 'Reload Template' : 'Load Template'}
                  </button>
                </div>
                {seedConfig && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <Editor height="380px" defaultLanguage="json" value={seedConfig} onChange={(val) => setSeedConfig(val || '')} theme="vs-dark"
                      options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }} />
                  </div>
                )}
              </div>
            )}

            {/* Upload */}
            {seedMethod === 'upload' && (
              <div>
                <div {...getRootProps()} style={{
                  border: `2px dashed ${isDragActive ? 'var(--teal)' : 'var(--border-bright)'}`,
                  borderRadius: 12, padding: '56px 32px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  background: isDragActive ? 'var(--teal-dim)' : 'transparent',
                }}>
                  <input {...getInputProps()} />
                  {seedLoading ? (
                    <>
                      <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ fontSize: 14, color: 'var(--teal)' }}>Extracting text and generating seed...</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 40, opacity: 0.4 }}>&#128194;</div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{isDragActive ? 'Drop your file here...' : 'Drag & drop a file, or click to browse'}</p>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>PDF, DOCX, TXT, Markdown, CSV, XLSX, or JSON</span>
                    </>
                  )}
                </div>
                {uploadedFileName && <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal)', marginTop: 12 }}>Loaded: {uploadedFileName}</p>}
                {seedConfig && seedMethod === 'upload' && (
                  <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <Editor height="300px" defaultLanguage="json" value={seedConfig} onChange={(val) => setSeedConfig(val || '')} theme="vs-dark"
                      options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }} />
                  </div>
                )}
              </div>
            )}

            {/* From URL */}
            {seedMethod === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Enter a URL to a web page, article, or report. Tavily will extract the content and generate a seed scaffold.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input className="input" placeholder="https://example.com/article-about-your-scenario" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && extractFromUrl()} />
                    <button className="btn-primary" onClick={extractFromUrl} disabled={seedLoading || !urlInput.trim()} style={{ whiteSpace: 'nowrap' }}>
                      {seedLoading ? 'Extracting...' : 'Extract & Generate'}
                    </button>
                  </div>
                </div>
                {seedConfig && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <Editor height="350px" defaultLanguage="json" value={seedConfig} onChange={(val) => setSeedConfig(val || '')} theme="vs-dark"
                      options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }} />
                  </div>
                )}
              </div>
            )}

            {/* Web Search */}
            {seedMethod === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 20, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Describe what you want to simulate. Tavily will search the web, aggregate multiple sources, and generate a seed scaffold.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input className="input" placeholder="e.g., Trinidad banking system crypto capital flight 2025" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && searchAndGenerate()} />
                    <button className="btn-primary" onClick={searchAndGenerate} disabled={seedLoading || !searchQuery.trim()} style={{ whiteSpace: 'nowrap' }}>
                      {seedLoading ? 'Searching...' : 'Search & Generate'}
                    </button>
                  </div>
                </div>
                {searchSources.length > 0 && (
                  <details open style={{ padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <summary style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--teal)', cursor: 'pointer', marginBottom: 8 }}>
                      Sources ({searchSources.length})
                    </summary>
                    {searchSources.map((s, i) => (
                      <div key={i} style={{ padding: '4px 0' }}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                          {s.title || s.url}
                        </a>
                      </div>
                    ))}
                  </details>
                )}
                {seedConfig && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <Editor height="350px" defaultLanguage="json" value={seedConfig} onChange={(val) => setSeedConfig(val || '')} theme="vs-dark"
                      options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }} />
                  </div>
                )}
              </div>
            )}

            {/* Manual Editor */}
            {seedMethod === 'manual' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Write or paste your seed JSON directly. The seed defines actors, relationships, environment variables, and the scenario trigger.
                </p>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <Editor height="420px" defaultLanguage="json" value={seedConfig || JSON.stringify({ simulation_type: selectedType || 'custom', scenario_trigger: '', actors: [{ name: 'Actor1', type: 'organisation', role: '', goals: [], resources: [], constraints: [], relationships: [], available_actions: [], personality_traits: [], nash_prior_weight: 0.5 }], environment_variables: {}, prediction_questions: [] }, null, 2)}
                    onChange={(val) => setSeedConfig(val || '')} theme="vs-dark"
                    options={{ fontSize: 13, fontFamily: '"DM Mono", monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on', tabSize: 2, padding: { top: 12 } }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, marginBottom: 24 }}>Review & Create</h2>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                ['Approach', approach === 'template' ? `Template: ${getTypeObj()?.name || selectedType}` : 'Custom Build'],
                selectedSubTemplate && ['Variant', selectedSubTemplate.title || selectedSubTemplate.id],
                ['Project', projectName],
                ['Industry', industry || '(not set)'],
                ['Description', description || '(none)'],
                ['Scenario', scenarioName || `${projectName} — Initial Scenario`],
                ['Seed', `${seedConfig.length.toLocaleString()} characters`],
              ].filter(Boolean).map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', width: 140, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
              <div style={{ padding: '14px 20px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>Seed Preview</span>
                <pre style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4, whiteSpace: 'pre-wrap', background: 'var(--bg)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', maxHeight: 200, overflow: 'auto' }}>
                  {seedConfig.substring(0, 600)}{seedConfig.length > 600 ? '\n...' : ''}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24, marginTop: 32, borderTop: '1px solid var(--border)' }}>
          {step > 0 && <button className="btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button className="btn-primary" disabled={!canNext()} onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'} &#x1F680;
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
