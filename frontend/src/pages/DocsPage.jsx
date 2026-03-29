import Navbar from '../components/Navbar';

const sections = [
  {
    title: 'Getting Started',
    content: `Strategos is a multi-agent strategy simulation platform powered by MiroFish.
    Start by creating a Project, then add Scenarios within it. Each scenario contains a seed file
    that defines the actors, relationships, and environment for simulation.`
  },
  {
    title: 'Simulation Pipeline',
    content: `Each simulation run follows a 5-phase pipeline:
    1. Graph Build — Extracts entities and relationships from your seed into a knowledge graph
    2. Environment Setup — Configures the OASIS parallel simulation environment
    3. Nash Pre-Pass — Computes game-theoretic equilibria as priors for agent behaviour (optional)
    4. Simulation — Agents interact across rounds, building memory and adapting
    5. Report Generation — AI synthesises findings into a strategic analysis report`
  },
  {
    title: 'Seed Files',
    content: `Seeds define the simulation world. They include actors (with goals, resources, constraints,
    personality traits), relationships between actors, environment variables, and a scenario trigger.
    Seeds can be created manually, auto-generated from uploaded documents, or from web search results via Tavily.`
  },
  {
    title: 'Nash Equilibrium Engine',
    content: `The Nash pre-pass computes optimal strategies for each actor using game theory.
    During simulation, agents may deviate from Nash equilibrium due to personality biases,
    memory of past events, and emotional responses. The deviation between Nash-optimal and
    actual behaviour is tracked and reported.`
  },
  {
    title: "God's Eye View",
    content: `The God's Eye View provides cross-cutting analysis: influence rankings, coalition detection,
    information cascades, cross-platform divergence, and Nash deviation heatmaps. Use it to understand
    the simulation at a systemic level rather than per-agent.`
  },
  {
    title: 'Agent Interviews',
    content: `After or during a simulation, you can interview any agent. The agent responds in-character,
    drawing on their persona, goals, and memory of all past actions. Pre-built interview templates
    are available for each simulation type.`
  },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 28, marginBottom: 8 }}>Documentation</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 14 }}>
          Learn how to use Strategos for multi-agent strategy simulation
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((section, i) => (
            <div key={i} className="card" style={{ padding: '24px 28px' }}>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--teal)' }}>
                {section.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
