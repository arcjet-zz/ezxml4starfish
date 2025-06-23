// TypeScript类型定义

export interface GeometryNode {
  x: number;
  y: number;
}

export interface Boundary {
  id: string;
  name: string;
  type: 'SOLID' | 'OPEN' | 'SYMMETRY';
  potential: number;
  nodes: GeometryNode[];
}

export interface Material {
  id: string;
  name: string;
  type: 'GAS' | 'PLASMA-ELECTRON' | 'PLASMA-ION' | 'SOLID' | 'LIQUID' | 'NEUTRAL' | 'ION' | 'ELECTRON';
  mass: number;
  charge: number;

  // 扩展属性
  molwt?: number;
  spwt?: number;
  ref_temp?: number;
  visc_temp_index?: number;
  vss_alpha?: number;
  diam?: number;

  // 固体材料特有属性
  density?: number;
  thermal_conductivity?: number;
  specific_heat?: number;

  // 表面属性
  work_function?: number;
  secondary_emission_yield?: number;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  material?: string;
  rate?: number;
  temperature?: number;

  // 边界源特有属性
  boundary?: string;
  mdot?: number;
  v_drift?: number;
}

export interface Interaction {
  id: string;
  name: string;
  type: string;
  materials: string[];
}

export interface GlobalSettings {
  iterations: number;
  time_step: number;
  solver_type: string;

  // 求解器特定参数
  n0?: number;
  Te0?: number;
  phi0?: number;
  max_it?: number;
  tolerance?: number;

  // 时间参数
  steady_state?: number;

  // 并行参数
  max_cores?: number;
  randomize?: boolean;
}

export interface DomainSettings {
  type: string;
  world_box?: number[];
  mesh_type: string;
  mesh_name: string;
  origin: number[];
  spacing: number[];
  nodes: number[];
}

export interface SimulationProject {
  settings: GlobalSettings;
  domain: DomainSettings;
  boundaries: Boundary[];
  materials: Material[];
  sources: Source[];
  interactions: Interaction[];
}
