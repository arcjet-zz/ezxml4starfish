"""
仿真项目数据模型
使用Pydantic定义核心数据结构
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from uuid import uuid4

class GeometryNode(BaseModel):
    """几何节点"""
    x: float = Field(..., description="X坐标")
    y: float = Field(..., description="Y坐标")

class Boundary(BaseModel):
    """边界定义"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="边界名称")
    type: Literal["SOLID", "OPEN", "SYMMETRY"] = Field(default="SOLID", description="边界类型")
    potential: float = Field(default=0.0, description="电势")
    nodes: List[GeometryNode] = Field(default_factory=list, description="边界节点")

class Material(BaseModel):
    """材料定义"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="材料名称")
    type: Literal["GAS", "PLASMA-ELECTRON", "PLASMA-ION", "SOLID", "LIQUID", "NEUTRAL", "ION", "ELECTRON"] = Field(default="GAS", description="材料类型")
    mass: float = Field(default=1.0, description="质量")
    charge: float = Field(default=0.0, description="电荷")

    # 扩展属性
    molwt: Optional[float] = Field(None, description="分子量")
    spwt: Optional[float] = Field(None, description="统计权重")
    ref_temp: Optional[float] = Field(None, description="参考温度")
    visc_temp_index: Optional[float] = Field(None, description="粘度温度指数")
    vss_alpha: Optional[float] = Field(None, description="VSS alpha参数")
    diam: Optional[float] = Field(None, description="直径")

    # 固体材料特有属性
    density: Optional[float] = Field(None, description="密度")
    thermal_conductivity: Optional[float] = Field(None, description="热导率")
    specific_heat: Optional[float] = Field(None, description="比热容")

    # 表面属性
    work_function: Optional[float] = Field(None, description="功函数")
    secondary_emission_yield: Optional[float] = Field(None, description="二次电子发射系数")

class Source(BaseModel):
    """源定义"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="源名称")
    type: str = Field(..., description="源类型")
    material: Optional[str] = Field(None, description="关联材料")
    rate: Optional[float] = Field(None, description="生成率")
    temperature: Optional[float] = Field(None, description="温度")
    
    # 边界源特有属性
    boundary: Optional[str] = Field(None, description="关联边界")
    mdot: Optional[float] = Field(None, description="质量流率")
    v_drift: Optional[float] = Field(None, description="漂移速度")

class Interaction(BaseModel):
    """相互作用定义"""
    id: str = Field(default_factory=lambda: str(uuid4()), description="唯一ID")
    name: str = Field(..., description="相互作用名称")
    type: str = Field(..., description="相互作用类型")
    materials: List[str] = Field(default_factory=list, description="参与的材料")

class GlobalSettings(BaseModel):
    """全局设置"""
    iterations: int = Field(default=1000, alias="num_it", description="迭代次数")
    time_step: float = Field(default=1e-6, alias="dt", description="时间步长")
    solver_type: str = Field(default="SOR", description="求解器类型")
    
    # 求解器特定参数
    n0: Optional[float] = Field(None, description="参考密度")
    Te0: Optional[float] = Field(None, description="电子温度")
    phi0: Optional[float] = Field(None, description="参考电势")
    max_it: Optional[int] = Field(None, description="最大迭代次数")
    tolerance: Optional[float] = Field(None, description="收敛容差")
    
    # 时间参数
    steady_state: Optional[int] = Field(None, description="稳态迭代次数")
    
    # 并行参数
    max_cores: Optional[int] = Field(None, description="最大核心数")
    randomize: Optional[bool] = Field(None, description="是否随机化")

class DomainSettings(BaseModel):
    """计算域设置"""
    type: str = Field(default="xy", description="域类型")
    world_box: Optional[List[float]] = Field(None, description="世界边界框")
    mesh_type: str = Field(default="uniform", description="网格类型")
    mesh_name: str = Field(default="mesh", description="网格名称")
    origin: List[float] = Field(default_factory=lambda: [0.0, 0.0], description="原点坐标")
    spacing: List[float] = Field(default_factory=lambda: [0.02, 0.02], description="网格间距")
    nodes: List[int] = Field(default_factory=lambda: [21, 11], description="节点数")

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
