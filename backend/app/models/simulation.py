"""
仿真项目数据模型
使用Pydantic定义核心数据结构
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Union
from uuid import uuid4

class GeometryNode(BaseModel):
    """几何节点"""
    x: float = Field(..., description="X坐标")
    y: float = Field(..., description="Y坐标")

class Boundary(BaseModel):
    """边界定义 - 符合Starfish XML规范"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="边界名称")
    type: Literal["solid", "virtual", "dirichlet", "neumann"] = Field(default="solid", description="边界类型")
    value: Optional[Union[str, int, float]] = Field(None, description="边界值")
    reverse: Optional[bool] = Field(None, description="是否反转边界")
    nodes: List[GeometryNode] = Field(default_factory=list, description="边界节点")

    # Starfish边界属性
    material: Optional[str] = Field(None, description="边界材料")
    path: Optional[str] = Field(None, description="边界路径 (SVG格式: M x,y L x,y ...)")
    temp: Optional[float] = Field(None, description="边界温度")
    temperature: Optional[float] = Field(None, description="边界温度（别名）")

    # 兼容性属性（用于向后兼容）
    potential: Optional[float] = Field(None, description="电势（将映射到value）")

    @validator('value', pre=True)
    def convert_value_to_string(cls, v):
        """将数字值转换为字符串"""
        if v is not None:
            return str(v)
        return v

class Material(BaseModel):
    """材料定义 - 符合Starfish XML规范"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="材料名称")
    type: Literal["kinetic", "boltzmann_electrons", "solid"] = Field(default="kinetic", description="材料类型")

    # 基本属性 - molwt和mass二选一，molwt优先
    molwt: Optional[float] = Field(None, description="分子量 (amu)")
    mass: Optional[float] = Field(None, description="质量 (kg)")
    charge: float = Field(default=0.0, description="电荷数 (基本电荷单位)")

    # 动力学材料属性 (kinetic)
    spwt: Optional[float] = Field(None, description="统计权重")
    init: Optional[str] = Field(None, description="初始化条件，如 nd_back=1e10")
    ref_temp: Optional[float] = Field(None, description="参考温度 (K)")
    visc_temp_index: Optional[float] = Field(None, description="粘性温度指数")
    vss_alpha: Optional[float] = Field(None, description="VSS alpha参数")
    diam: Optional[float] = Field(None, description="分子直径 (m)")
    ionization_energy: Optional[float] = Field(None, description="电离能 (eV) - 用于MCC碰撞")

    # 玻尔兹曼电子属性 (boltzmann_electrons)
    model: Optional[str] = Field(None, description="模型类型，通常为 qn")
    kTe0: Optional[float] = Field(None, description="电子温度 (eV)")

    # 固体材料属性 (solid)
    density: Optional[float] = Field(None, description="密度 (kg/m³)")
    thermal_conductivity: Optional[float] = Field(None, description="热导率")
    specific_heat: Optional[float] = Field(None, description="比热容")

    # 表面属性
    work_function: Optional[float] = Field(None, description="功函数")
    secondary_emission_yield: Optional[float] = Field(None, description="二次电子发射系数")

class Source(BaseModel):
    """源定义 - 符合Starfish XML规范"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="源名称")

    # 源类型：volume源或boundary_source
    type: Literal["volume", "preload", "maxwellian", "uniform", "cosine", "ambient", "thermionic"] = Field(default="volume", description="源类型")
    material: Optional[str] = Field(None, description="关联材料")

    # 体积源属性
    rate: Optional[float] = Field(None, description="粒子产生率")
    temperature: Optional[float] = Field(None, description="温度")
    region: Optional[str] = Field(None, description="区域定义")

    # 边界源属性
    boundary: Optional[str] = Field(None, description="关联边界")
    mdot: Optional[float] = Field(None, description="质量流率 (kg/s)")
    v_drift: Optional[float] = Field(None, description="漂移速度 (m/s)")

    # 环境源特有属性
    enforce: Optional[Literal["density", "pressure", "partial_pressure"]] = Field(None, description="强制条件类型")
    density: Optional[float] = Field(None, description="密度")
    total_pressure: Optional[float] = Field(None, description="总压力 (Pa)")
    drift_velocity: Optional[str] = Field(None, description="漂移速度矢量 (vx,vy,vz)")

class Interaction(BaseModel):
    """相互作用定义 - 符合Starfish XML规范"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="相互作用名称")
    type: Literal["surface_hit", "dsmc", "mcc", "chemistry", "sputtering"] = Field(default="surface_hit", description="相互作用类型")

    # 通用属性
    materials: List[str] = Field(default_factory=list, description="参与的材料")

    # 通用模型字段（用于多种相互作用类型）
    model: Optional[str] = Field(None, description="相互作用模型")

    # 表面碰撞 (surface_hit) 属性
    source: Optional[str] = Field(None, description="源材料")
    target: Optional[str] = Field(None, description="目标材料")
    product: Optional[str] = Field(None, description="产物材料")
    prob: Optional[float] = Field(None, description="碰撞概率 (0-1)")
    c_accom: Optional[float] = Field(None, description="能量适应系数 (0-1)")
    c_rest: Optional[float] = Field(None, description="恢复系数 (0-1)")

    # DSMC碰撞属性
    pair: Optional[str] = Field(None, description="材料对，如 '材料1,材料2'")
    sigma: Optional[Literal["const", "inv", "bird463", "tabulated", "poly", "ln", "table"]] = Field(None, description="碰撞截面类型")
    sigma_coeffs: Optional[str] = Field(None, description="截面系数")
    frequency: Optional[int] = Field(None, description="碰撞频率")
    sig_cr_max: Optional[float] = Field(None, description="最大sigma*cr值")

    # MCC碰撞属性
    mcc_model: Optional[Literal["cex", "mex", "ionization"]] = Field(None, description="MCC碰撞模型")
    max_target_temp: Optional[float] = Field(None, description="最大目标温度 (K)")
    ionization_energy: Optional[float] = Field(None, description="电离能")

    # 化学反应属性
    sources: Optional[str] = Field(None, description="反应物列表")
    products: Optional[str] = Field(None, description="产物列表")
    rate_type: Optional[Literal["const", "poly"]] = Field(None, description="反应速率类型")
    is_sigma: Optional[bool] = Field(None, description="是否为截面")
    coeffs: Optional[str] = Field(None, description="系数列表")
    output_wrappers: Optional[str] = Field(None, description="输出包装器")
    dep_var: Optional[str] = Field(None, description="依赖变量")

class RestartSettings(BaseModel):
    """重启设置"""
    it_save: Optional[int] = Field(None, description="保存间隔")
    save: Optional[bool] = Field(None, description="是否保存")
    load: Optional[bool] = Field(None, description="是否加载")
    nt_add: Optional[int] = Field(None, description="添加时间步数")

class OutputSettings(BaseModel):
    """输出设置"""
    type: str = Field(..., description="输出类型")
    file_name: str = Field(..., description="文件名")
    format: str = Field(default="vtk", description="输出格式")
    variables: Optional[str] = Field(None, description="输出变量")
    scalars: Optional[str] = Field(None, description="标量变量")
    vectors: Optional[str] = Field(None, description="矢量变量")

class GlobalSettings(BaseModel):
    """全局设置 - 符合Starfish XML规范"""
    # 时间参数
    iterations: int = Field(default=1000, alias="num_it", description="迭代次数")
    time_step: float = Field(default=1e-6, alias="dt", description="时间步长")
    steady_state: Optional[int] = Field(None, description="稳态开始迭代")

    # 求解器类型 - 映射到Starfish支持的类型
    solver_type: Literal["poisson", "constant-ef", "qn", "none"] = Field(default="poisson", description="求解器类型")

    # 泊松求解器参数
    method: Optional[Literal["gs", "jacobi"]] = Field(None, description="求解方法")
    n0: Optional[float] = Field(None, description="参考密度 (m⁻³)")
    Te0: Optional[float] = Field(None, description="电子温度 (eV)")
    phi0: Optional[float] = Field(None, description="参考电势 (V)")
    max_it: Optional[int] = Field(None, description="最大迭代次数")
    nl_max_it: Optional[int] = Field(None, description="非线性最大迭代次数")
    tol: Optional[float] = Field(None, description="线性容差")
    nl_tol: Optional[float] = Field(None, description="非线性容差")
    tolerance: Optional[float] = Field(None, description="收敛容差")
    linear: Optional[bool] = Field(None, description="是否使用线性求解")
    initial_only: Optional[bool] = Field(None, description="是否仅在初始时求解")

    # 常电场求解器参数
    comps: Optional[str] = Field(None, description="电场分量，如 'Ex,Ey'")

    # 并行参数
    max_cores: Optional[int] = Field(None, description="最大核心数")
    randomize: Optional[bool] = Field(None, description="是否随机化")

    # 重启和输出设置
    restart: Optional[RestartSettings] = Field(None, description="重启设置")
    outputs: List[OutputSettings] = Field(default_factory=list, description="输出设置列表")

    # 平均化设置
    averaging_frequency: Optional[int] = Field(None, description="平均化频率")
    averaging_start_it: Optional[int] = Field(None, description="平均化开始迭代")
    averaging_variables: Optional[str] = Field(None, description="平均化变量")

    # 动画设置
    animation_start_it: Optional[int] = Field(None, description="动画开始迭代")
    animation_frequency: Optional[int] = Field(None, description="动画频率")

class MeshBoundaryCondition(BaseModel):
    """网格边界条件"""
    wall: str = Field(..., description="边界位置")
    type: str = Field(..., description="边界条件类型")
    value: Optional[str] = Field(None, description="边界条件值")

class BoundaryTransform(BaseModel):
    """边界变换设置"""
    scaling: Optional[str] = Field(None, description="缩放")
    translation: Optional[str] = Field(None, description="平移")
    reverse: Optional[bool] = Field(None, description="是否反转")

class DomainSettings(BaseModel):
    """计算域设置"""
    type: str = Field(default="xy", description="域类型")
    world_box: Optional[List[float]] = Field(None, description="世界边界框")
    mesh_type: str = Field(default="uniform", description="网格类型")
    mesh_name: str = Field(default="mesh", description="网格名称")
    origin: List[float] = Field(default_factory=lambda: [0.0, 0.0], description="原点坐标")
    spacing: List[float] = Field(default_factory=lambda: [0.02, 0.02], description="网格间距")
    nodes: List[int] = Field(default_factory=lambda: [21, 11], description="节点数")
    mesh_bcs: List[MeshBoundaryCondition] = Field(default_factory=list, description="网格边界条件")

    # 边界变换（用于boundaries.xml）
    boundary_transform: Optional[BoundaryTransform] = Field(None, description="边界变换设置")

class SimulationProject(BaseModel):
    """仿真项目主模型"""
    settings: GlobalSettings = Field(default_factory=GlobalSettings, description="全局设置")
    domain: DomainSettings = Field(default_factory=DomainSettings, description="计算域设置")
    boundaries: List[Boundary] = Field(default_factory=list, description="边界列表")
    materials: List[Material] = Field(default_factory=list, description="材料列表")
    sources: List[Source] = Field(default_factory=list, description="源列表")
    interactions: List[Interaction] = Field(default_factory=list, description="相互作用列表")
    
    class Config:
        """Pydantic配置"""
        populate_by_name = True
        use_enum_values = True
