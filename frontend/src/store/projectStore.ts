import { create } from 'zustand';
import { SimulationProject, GlobalSettings, DomainSettings, Boundary, Material, Source, Interaction } from '../types';

interface ProjectState {
  // 项目数据
  project: SimulationProject;
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  isDirty: boolean; // 是否有未保存的更改
  
  // 操作方法
  setProject: (project: SimulationProject) => void;
  updateSettings: (settings: Partial<GlobalSettings>) => void;
  updateDomain: (domain: Partial<DomainSettings>) => void;
  
  // 边界操作
  addBoundary: (boundary: Boundary) => void;
  updateBoundary: (id: string, boundary: Partial<Boundary>) => void;
  deleteBoundary: (id: string) => void;
  
  // 材料操作
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, material: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  
  // 源操作
  addSource: (source: Source) => void;
  updateSource: (id: string, source: Partial<Source>) => void;
  deleteSource: (id: string) => void;
  
  // 相互作用操作
  addInteraction: (interaction: Interaction) => void;
  updateInteraction: (id: string, interaction: Partial<Interaction>) => void;
  deleteInteraction: (id: string) => void;
  
  // 工具方法
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetProject: () => void;
}

// 默认项目配置
const createDefaultProject = (): SimulationProject => ({
  settings: {
    iterations: 1000,
    time_step: 1e-6,
    solver_type: 'SOR'
  },
  domain: {
    type: 'xy',
    mesh_type: 'uniform',
    mesh_name: 'mesh',
    origin: [0.0, 0.0],
    spacing: [0.02, 0.02],
    nodes: [21, 11]
  },
  boundaries: [],
  materials: [],
  sources: [],
  interactions: []
});

export const useProjectStore = create<ProjectState>((set, get) => ({
  // 初始状态
  project: createDefaultProject(),
  isLoading: false,
  error: null,
  isDirty: false,
  
  // 项目操作
  setProject: (project) => set({ project, isDirty: false }),
  
  updateSettings: (settings) => set((state) => ({
    project: {
      ...state.project,
      settings: { ...state.project.settings, ...settings }
    },
    isDirty: true
  })),
  
  updateDomain: (domain) => set((state) => ({
    project: {
      ...state.project,
      domain: { ...state.project.domain, ...domain }
    },
    isDirty: true
  })),
  
  // 边界操作
  addBoundary: (boundary) => set((state) => ({
    project: {
      ...state.project,
      boundaries: [...state.project.boundaries, boundary]
    },
    isDirty: true
  })),
  
  updateBoundary: (id, boundaryUpdate) => set((state) => ({
    project: {
      ...state.project,
      boundaries: state.project.boundaries.map(b => 
        b.id === id ? { ...b, ...boundaryUpdate } : b
      )
    },
    isDirty: true
  })),
  
  deleteBoundary: (id) => set((state) => ({
    project: {
      ...state.project,
      boundaries: state.project.boundaries.filter(b => b.id !== id)
    },
    isDirty: true
  })),
  
  // 材料操作
  addMaterial: (material) => set((state) => ({
    project: {
      ...state.project,
      materials: [...state.project.materials, material]
    },
    isDirty: true
  })),
  
  updateMaterial: (id, materialUpdate) => set((state) => ({
    project: {
      ...state.project,
      materials: state.project.materials.map(m => 
        m.id === id ? { ...m, ...materialUpdate } : m
      )
    },
    isDirty: true
  })),
  
  deleteMaterial: (id) => set((state) => ({
    project: {
      ...state.project,
      materials: state.project.materials.filter(m => m.id !== id)
    },
    isDirty: true
  })),
  
  // 源操作
  addSource: (source) => set((state) => ({
    project: {
      ...state.project,
      sources: [...state.project.sources, source]
    },
    isDirty: true
  })),
  
  updateSource: (id, sourceUpdate) => set((state) => ({
    project: {
      ...state.project,
      sources: state.project.sources.map(s => 
        s.id === id ? { ...s, ...sourceUpdate } : s
      )
    },
    isDirty: true
  })),
  
  deleteSource: (id) => set((state) => ({
    project: {
      ...state.project,
      sources: state.project.sources.filter(s => s.id !== id)
    },
    isDirty: true
  })),
  
  // 相互作用操作
  addInteraction: (interaction) => set((state) => ({
    project: {
      ...state.project,
      interactions: [...state.project.interactions, interaction]
    },
    isDirty: true
  })),
  
  updateInteraction: (id, interactionUpdate) => set((state) => ({
    project: {
      ...state.project,
      interactions: state.project.interactions.map(i => 
        i.id === id ? { ...i, ...interactionUpdate } : i
      )
    },
    isDirty: true
  })),
  
  deleteInteraction: (id) => set((state) => ({
    project: {
      ...state.project,
      interactions: state.project.interactions.filter(i => i.id !== id)
    },
    isDirty: true
  })),
  
  // 工具方法
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetProject: () => set({ 
    project: createDefaultProject(), 
    isDirty: false, 
    error: null 
  })
}));
