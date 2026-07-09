// TypeScript类型定义

export interface GeometryNode {
  x: number;
  y: number;
}

export interface Boundary {
  id: string;
  name: string;
  type: 'solid' | 'virtual';
  value?: string;
  reverse?: boolean;
  nodes: GeometryNode[];

  // Starfish边界属性
  material?: string;
  path?: string;
  temp?: number;
  temperature?: number;

  // 兼容性属性（用于向后兼容）
  potential?: number;
}

export interface Material {
  id: string;
  name: string;
  type: 'kinetic' | 'boltzmann_electrons' | 'solid';

  // 基本属性 - molwt和mass二选一，molwt优先
  molwt?: number;
  mass?: number;
  charge: number;

  // 动力学材料属性 (kinetic)
  spwt?: number;
  init?: string;
  ref_temp?: number;
  visc_temp_index?: number;
  vss_alpha?: number;
  diam?: number;

  // 玻尔兹曼电子属性 (boltzmann_electrons)
  model?: string;
  kTe0?: number;

  // 固体材料属性 (solid)
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

  // 源类型：volume源或boundary_source
  type: 'volume' | 'preload' | 'maxwellian' | 'uniform' | 'cosine' | 'ambient' | 'thermionic';
  material?: string;

  // 体积源属性
  rate?: number;
  temperature?: number;
  region?: string;

  // 边界源属性
  boundary?: string;
  mdot?: number;
  v_drift?: number;

  // 环境源特有属性
  enforce?: 'density' | 'pressure' | 'partial_pressure';
  density?: number;
  total_pressure?: number;
  drift_velocity?: string;
}

export interface Interaction {
  id: string;
  name: string;
  type: 'surface_hit' | 'dsmc' | 'mcc' | 'chemistry' | 'sputtering';

  // 通用属性
  materials: string[];

  // 通用模型字段（用于多种相互作用类型）
  model?: string;

  // 表面碰撞 (surface_hit) 属性
  source?: string;
  target?: string;
  product?: string;
  prob?: number;
  c_accom?: number;
  c_rest?: number;

  // DSMC碰撞属性
  pair?: string;
  sigma?: 'const' | 'inv' | 'bird463' | 'tabulated';
  sigma_coeffs?: string;
  frequency?: number;
  sig_cr_max?: number;

  // MCC碰撞属性
  mcc_model?: 'cex' | 'mex' | 'ionization';
  max_target_temp?: number;
  ionization_energy?: number;

  // 化学反应属性
  sources?: string;
  products?: string;
  rate_type?: 'const' | 'poly';
  is_sigma?: boolean;
  coeffs?: string;
  output_wrappers?: string;
  dep_var?: string;
}

// 重启设置
export interface RestartSettings {
  it_save?: number;
  save?: boolean;
  load?: boolean;
  nt_add?: number;
}

// 输出设置
export interface OutputSettings {
  type: string;
  file_name: string;
  format?: string;
  variables?: string;
  scalars?: string;
  vectors?: string;
  resolution?: number;
  count?: number;
  material?: string;
  rotate?: boolean;
}

export interface GlobalSettings {
  // 时间参数
  iterations: number;
  time_step: number;
  steady_state?: number;

  // 求解器类型 - 映射到Starfish支持的类型
  solver_type: 'poisson' | 'constant-ef' | 'qn' | 'none';

  // 泊松求解器参数
  method?: 'gs' | 'jacobi';
  n0?: number;
  Te0?: number;
  phi0?: number;
  max_it?: number;
  nl_max_it?: number;
  tol?: number;
  nl_tol?: number;
  tolerance?: number;
  linear?: boolean;
  initial_only?: boolean;

  // 常电场求解器参数
  comps?: string;

  // 并行参数
  max_cores?: number;
  randomize?: boolean;

  // 重启和输出设置
  restart?: RestartSettings;
  outputs?: OutputSettings[];

  // 平均化设置
  averaging_frequency?: number;
  averaging_start_it?: number;
  averaging_variables?: string;

  // 动画设置
  animation_start_it?: number;
  animation_frequency?: number;
}

// 网格边界条件
export interface MeshBoundaryCondition {
  wall: string;
  type: string;
  value?: string;
}

// 边界变换设置
export interface BoundaryTransform {
  scaling?: string;
  translation?: string;
  reverse?: boolean;
}

export interface DomainSettings {
  type: string;
  world_box?: number[];
  mesh_type: string;
  mesh_name: string;
  origin: number[];
  spacing: number[];
  nodes: number[];
  mesh_bcs?: MeshBoundaryCondition[];

  // 边界变换（用于boundaries.xml）
  boundary_transform?: BoundaryTransform;
}

export interface SimulationProject {
  settings: GlobalSettings;
  domain: DomainSettings;
  boundaries: Boundary[];
  materials: Material[];
  sources: Source[];
  interactions: Interaction[];
}
