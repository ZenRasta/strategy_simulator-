import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAppStore from '../store/appStore';
import { api } from '../lib/api';

const TYPE_COLORS = {
  financial_stress_test: 'badge-amber',
  market_entry: 'badge-teal',
  regulatory_impact: 'badge-violet',
  crisis_management: 'badge-red',
  public_opinion: 'badge-teal',
  corporate_strategy: 'badge-teal',
  custom: 'badge-teal',
};

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { scenarios, fetchScenarios } = useAppStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    fetchScenarios(projectId);
  }, [projectId]);

  async function loadProject() {
    try {
      const data = await api(`/projects/${projectId}`);
      setProject(data);
    } catch {}
    setLoading(false);
  }

  async function deleteProject() {
    if (!confirm('Delete this project and all its scenarios? This cannot be undone.')) return;
    try {
      await api(`/projects/${projectId}`, 'DELETE');
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  }

  const formatDate = (d) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div><Navbar />
        <div className="container" style={{ paddingTop: 64, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-dim)' }}>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Projects</Link>
          <span style={{ color: 'var(--border-bright)' }}>/</span>
          <span>{project?.name || 'Project'}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 12 }}>{project?.name || 'Untitled Project'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {project?.industry && <span className={`badge ${TYPE_COLORS[project.industry?.toLowerCase()] || 'badge-teal'}`}>{project.industry}</span>}
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</span>
              {project?.created_at && <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Created {formatDate(project.created_at)}</span>}
            </div>
            {project?.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8, maxWidth: 600 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={deleteProject} style={{ fontSize: 12, color: 'var(--red)' }}>Delete</button>
            <Link to={`/projects/${projectId}/scenarios/new`}>
              <button className="btn-primary">+ New Scenario</button>
            </Link>
          </div>
        </div>

        {/* Scenarios */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 16 }}>Scenarios</h2>

          {scenarios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>&#128203;</div>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, marginBottom: 8 }}>No Scenarios Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Create your first scenario to start running simulations</p>
              <Link to={`/projects/${projectId}/scenarios/new`} className="btn-primary" style={{ textDecoration: 'none', padding: '10px 24px' }}>
                + Create Scenario
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {scenarios.map((sc) => (
                <Link
                  key={sc.id}
                  to={`/projects/${projectId}/scenarios/${sc.id}`}
                  className="card card-interactive"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge ${TYPE_COLORS[sc.simulation_type] || 'badge-teal'}`}>
                      {(sc.simulation_type || 'custom').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600 }}>{sc.name}</h3>
                  {sc.description && <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{sc.description.slice(0, 100)}</p>}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 'auto' }}>
                    {formatDate(sc.created_at)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
