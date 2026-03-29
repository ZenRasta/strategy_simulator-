import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import useAppStore from '../store/appStore';

const INDUSTRY_COLORS = {
  Finance: 'badge-amber',
  Geopolitical: 'badge-red',
  Technology: 'badge-teal',
  Energy: 'badge-violet',
  Logistics: 'badge-teal',
};

const STATUS_MAP = {
  completed: { dot: 'status-dot--live', label: 'Completed' },
  running: { dot: 'status-dot--live', label: 'Running' },
  idle: { dot: 'status-dot--idle', label: 'Idle' },
  error: { dot: 'status-dot--error', label: 'Error' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { projects, fetchProjects } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Finance');

  const [newDesc, setNewDesc] = useState('');
  const displayProjects = projects;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = displayProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = filterIndustry === 'all' || p.industry === filterIndustry;
    return matchSearch && matchIndustry;
  });

  const industries = [...new Set(displayProjects.map((p) => p.industry))];

  const formatDate = (d) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const { createProject } = useAppStore();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject({
        name: newName.trim(),
        description: newDesc.trim(),
        industry: newIndustry
      });
      toast.success('Project created');
      setShowNewModal(false);
      setNewName('');
      setNewDesc('');
      if (project?.id) {
        navigate(`/projects/${project.id}`);
      } else {
        fetchProjects();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="dashboard-header fade-up">
          <div>
            <h1 className="dashboard-title">Projects</h1>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
              Manage your strategic simulation projects
            </p>
          </div>
          <Link to="/projects/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            + New Project
          </Link>
        </div>

        <div className="dashboard-filters fade-up-d1">
          <input
            className="input"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <select
            className="select"
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
          >
            <option value="all">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div className="dashboard-grid">
          {filtered.map((project, i) => {
            const status = STATUS_MAP[project.status] || STATUS_MAP.idle;
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={`dashboard-card card card-interactive fade-up-d${Math.min(i + 2, 8)}`}
              >
                <div className="dashboard-card-top">
                  <span className={`badge ${INDUSTRY_COLORS[project.industry] || 'badge-teal'}`}>
                    {project.industry}
                  </span>
                  <span className={`status-dot ${status.dot}`} title={status.label} />
                </div>
                <h3 className="dashboard-card-name">{project.name}</h3>
                <div className="dashboard-card-meta">
                  <span className="dashboard-card-stat">
                    <span className="text-mono text-teal">{project.scenarioCount}</span> scenarios
                  </span>
                  <span className="dashboard-card-stat">
                    Last run: {formatDate(project.lastRun)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="dashboard-empty">
            <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>&#128640;</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 8 }}>
              {displayProjects.length === 0 ? 'No Projects Yet' : 'No matches found'}
            </h2>
            <p className="text-dim" style={{ marginBottom: 24 }}>
              {displayProjects.length === 0
                ? 'Create your first project to start running simulations.'
                : 'Try adjusting your search or filter.'}
            </p>
            {displayProjects.length === 0 && (
              <Link to="/projects/new" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px' }}>
                + Create First Project
              </Link>
            )}
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 24 }}>
              New Project
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Project Name</label>
              <input
                className="input"
                placeholder="e.g., Caribbean Financial Contagion"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="Brief description of the project"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Industry</label>
              <select
                className="select w-full"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
              >
                <option>Finance</option>
                <option>Geopolitical</option>
                <option>Technology</option>
                <option>Energy</option>
                <option>Logistics</option>
                <option>Healthcare</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Create Project</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .dashboard-title {
          font-family: var(--display);
          font-size: 28px;
        }
        .dashboard-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .dashboard-card {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dashboard-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dashboard-card-name {
          font-family: var(--display);
          font-size: 16px;
          font-weight: 600;
          line-height: 1.3;
        }
        .dashboard-card-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: auto;
        }
        .dashboard-card-stat {
          font-size: 12px;
          color: var(--text-dim);
        }
        .dashboard-empty {
          text-align: center;
          padding: 64px 0;
        }
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .dashboard-filters { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
