import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { simulationTypes } from '../data/simulationTypes';

export default function TemplatesPage() {
  const types = simulationTypes.filter(t => t.id !== 'custom');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 28 }}>Simulation Templates</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            Pre-configured simulation types with canonical seed scaffolds, extraction directives, and actor templates
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}>
          {types.map((type) => {
            const colourVar = type.colour || '--teal';
            return (
              <div
                key={type.id}
                className="card"
                style={{
                  borderColor: `var(${colourVar})20`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 32 }}>{type.icon}</span>
                  <span className={`badge ${colourVar === '--violet' ? 'badge-violet' : colourVar === '--amber' ? 'badge-amber' : colourVar === '--red' ? 'badge-red' : 'badge-teal'}`}>
                    {type.category}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600 }}>{type.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                  {type.tagline}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>MiroFish Fit:</span>
                  <span style={{ color: `var(${colourVar})`, fontFamily: 'var(--mono)', fontSize: 13 }}>
                    {'★'.repeat(type.mirofish_fit)}{'☆'.repeat(5 - type.mirofish_fit)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-dim)' }}>
                  <span>Rounds: {type.recommended_rounds[0]}–{type.recommended_rounds[1]}</span>
                  <span>|</span>
                  <span>Actors: {type.min_actors}–{type.max_actors}</span>
                  <span>|</span>
                  <span>Nash: {type.nash_recommended ? 'Yes' : 'Optional'}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {(type.required_actor_roles || []).slice(0, 4).map((r) => (
                    <span key={r.role} style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'var(--mono)',
                      background: r.severity === 'error' ? 'var(--red-dim)' : 'var(--surface2)',
                      color: r.severity === 'error' ? 'var(--red)' : 'var(--text-secondary)'
                    }}>
                      {r.role}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
