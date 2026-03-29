import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';

export default function ScenariosListPage() {
  const [projects, setProjects] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const projs = await api('/projects');
      setProjects(projs || []);
      const allScenarios = [];
      for (const p of (projs || [])) {
        try {
          const scs = await api(`/projects/${p.id}/scenarios`);
          for (const s of (scs || [])) {
            allScenarios.push({ ...s, projectName: p.name, projectId: p.id });
          }
        } catch {}
      }
      setScenarios(allScenarios);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--display)', fontSize: 28 }}>Scenarios</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
              All scenarios across your projects
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 13 }}>Loading...</p>
        ) : scenarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>&#128203;</div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, marginBottom: 8 }}>No Scenarios Yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Create a project first, then add scenarios to it.
            </p>
            <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 24px' }}>
              Go to Projects
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scenarios.map((s) => (
              <Link
                key={s.id}
                to={`/projects/${s.projectId}/scenarios/${s.id}`}
                className="card card-interactive"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600 }}>{s.name}</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4, fontFamily: 'var(--mono)' }}>
                    Project: {s.projectName}
                  </p>
                </div>
                <span className="badge badge-teal">{s.simulation_type || 'custom'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
