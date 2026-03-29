import { create } from 'zustand';
import { api } from '../lib/api';

const useAppStore = create((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  currentScenario: null,
  currentRun: null,
  simulationStatus: 'idle', // idle | configuring | running | paused | completed | error
  pipelinePhase: 0,
  pipelineProgress: 0,
  completedPhases: [],
  nashEnabled: true,
  events: [],
  runs: [],
  scenarios: [],
  loading: false,
  error: null,

  // Project Actions
  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api('/projects');
      set({ projects: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const data = await api('/projects', 'POST', projectData);
      set((s) => ({ projects: [...s.projects, data], loading: false }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  // Scenario Actions
  fetchScenarios: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const data = await api(`/projects/${projectId}/scenarios`);
      set({ scenarios: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createScenario: async (projectId, scenarioData) => {
    set({ loading: true, error: null });
    try {
      const data = await api(`/projects/${projectId}/scenarios`, 'POST', scenarioData);
      set((s) => ({ scenarios: [...s.scenarios, data], loading: false }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),

  // Run Actions
  fetchRuns: async (projectId, scenarioId) => {
    set({ loading: true, error: null });
    try {
      const data = await api(`/projects/${projectId}/scenarios/${scenarioId}/runs`);
      set({ runs: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  startRun: async (projectId, scenarioId, config) => {
    set({ loading: true, error: null, simulationStatus: 'configuring' });
    try {
      const data = await api(
        `/projects/${projectId}/scenarios/${scenarioId}/runs`,
        'POST',
        config
      );
      set({
        currentRun: data,
        simulationStatus: 'running',
        pipelinePhase: 0,
        pipelineProgress: 0,
        completedPhases: [],
        events: [],
        loading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false, simulationStatus: 'error' });
      throw err;
    }
  },

  setCurrentRun: (run) => set({ currentRun: run }),

  // Pipeline / Simulation Updates
  updatePipeline: (phase, progress, completed) =>
    set({ pipelinePhase: phase, pipelineProgress: progress, completedPhases: completed || [] }),

  setSimulationStatus: (status) => set({ simulationStatus: status }),

  addEvent: (event) =>
    set((s) => ({ events: [...s.events, { ...event, id: Date.now() + Math.random() }] })),

  clearEvents: () => set({ events: [] }),

  setNashEnabled: (enabled) => set({ nashEnabled: enabled }),

  // Reset
  resetSimulation: () =>
    set({
      currentRun: null,
      simulationStatus: 'idle',
      pipelinePhase: 0,
      pipelineProgress: 0,
      completedPhases: [],
      events: [],
    }),

  clearError: () => set({ error: null }),
}));

export default useAppStore;
