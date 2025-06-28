import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  FormHelperText
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useProjectStore } from '../../store/projectStore';
import { GlobalSettings as GlobalSettingsType } from '../../types';

const GlobalSettings: React.FC = () => {
  const { project, updateSettings, updateDomain } = useProjectStore();
  const [localSettings, setLocalSettings] = useState(project.settings);
  const [localDomain, setLocalDomain] = useState(project.domain);

  useEffect(() => {
    setLocalSettings(project.settings);
    setLocalDomain(project.domain);
  }, [project.settings, project.domain]);

  const handleSettingsChange = (field: keyof GlobalSettingsType, value: any) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    updateSettings({ [field]: value });
  };

  const handleDomainChange = (field: string, value: any) => {
    const updated = { ...localDomain, [field]: value };
    setLocalDomain(updated);
    updateDomain({ [field]: value });
  };

  const handleArrayChange = (field: string, index: number, value: number) => {
    const currentArray = localDomain[field as keyof typeof localDomain] as number[];
    const updated = [...currentArray];
    updated[index] = value;
    handleDomainChange(field, updated);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        全局设置
      </Typography>

      <Grid container spacing={3}>
        {/* 计算域设置 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              计算域设置
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>域类型</InputLabel>
                  <Select
                    value={localDomain.type}
                    label="域类型"
                    onChange={(e) => handleDomainChange('type', e.target.value)}
                  >
                    <MenuItem value="xy">2D 笛卡尔坐标 (xy)</MenuItem>
                    <MenuItem value="rz">2D 轴对称坐标 (rz)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>网格类型</InputLabel>
                  <Select
                    value={localDomain.mesh_type}
                    label="网格类型"
                    onChange={(e) => handleDomainChange('mesh_type', e.target.value)}
                  >
                    <MenuItem value="uniform">均匀网格 (uniform)</MenuItem>
                    <MenuItem value="stretched">拉伸网格 (stretched)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="网格名称"
                  value={localDomain.mesh_name}
                  onChange={(e) => handleDomainChange('mesh_name', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  原点坐标
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      label="X 原点"
                      type="number"
                      value={localDomain.origin[0]}
                      onChange={(e) => handleArrayChange('origin', 0, parseFloat(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Y 原点"
                      type="number"
                      value={localDomain.origin[1]}
                      onChange={(e) => handleArrayChange('origin', 1, parseFloat(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  网格间距
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      label="X 间距"
                      type="number"
                      value={localDomain.spacing[0]}
                      onChange={(e) => handleArrayChange('spacing', 0, parseFloat(e.target.value) || 0.01)}
                      fullWidth
                      inputProps={{ step: 'any', min: 0.001 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Y 间距"
                      type="number"
                      value={localDomain.spacing[1]}
                      onChange={(e) => handleArrayChange('spacing', 1, parseFloat(e.target.value) || 0.01)}
                      fullWidth
                      inputProps={{ step: 'any', min: 0.001 }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  节点数量
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <TextField
                      label="X 方向节点数"
                      type="number"
                      value={localDomain.nodes[0]}
                      onChange={(e) => handleArrayChange('nodes', 0, parseInt(e.target.value) || 11)}
                      fullWidth
                      inputProps={{ min: 3 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Y 方向节点数"
                      type="number"
                      value={localDomain.nodes[1]}
                      onChange={(e) => handleArrayChange('nodes', 1, parseInt(e.target.value) || 11)}
                      fullWidth
                      inputProps={{ min: 3 }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 时间设置 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              时间设置
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="迭代次数"
                  type="number"
                  value={localSettings.iterations}
                  onChange={(e) => handleSettingsChange('iterations', parseInt(e.target.value) || 1000)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="时间步长 (s)"
                  type="number"
                  value={localSettings.time_step}
                  onChange={(e) => handleSettingsChange('time_step', parseFloat(e.target.value) || 1e-6)}
                  fullWidth
                  inputProps={{ step: 'any', min: 1e-12 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="稳态迭代次数"
                  type="number"
                  value={localSettings.steady_state || ''}
                  onChange={(e) => handleSettingsChange('steady_state', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  inputProps={{ min: 1 }}
                  helperText="可选：达到稳态所需的迭代次数"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 求解器设置 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              求解器设置
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>求解器类型</InputLabel>
                  <Select
                    value={localSettings.solver_type}
                    label="求解器类型"
                    onChange={(e) => handleSettingsChange('solver_type', e.target.value)}
                  >
                    <MenuItem value="poisson">Poisson (泊松求解器)</MenuItem>
                    <MenuItem value="constant-ef">Constant EF (恒定电场)</MenuItem>
                    <MenuItem value="qn">QN (准中性求解器)</MenuItem>
                    <MenuItem value="none">无求解器</MenuItem>
                  </Select>
                  <FormHelperText>
                    选择符合Starfish规范的求解器类型
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="最大迭代次数"
                  type="number"
                  value={localSettings.max_it || ''}
                  onChange={(e) => handleSettingsChange('max_it', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="收敛容差"
                  type="number"
                  value={localSettings.tolerance || ''}
                  onChange={(e) => handleSettingsChange('tolerance', e.target.value ? parseFloat(e.target.value) : undefined)}
                  fullWidth
                  inputProps={{ step: 'any', min: 1e-12 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="求解方法"
                  value={localSettings.method || ''}
                  onChange={(e) => handleSettingsChange('method', e.target.value)}
                  fullWidth
                  helperText="求解器使用的方法"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="求解器组件"
                  value={localSettings.comps || ''}
                  onChange={(e) => handleSettingsChange('comps', e.target.value)}
                  fullWidth
                  placeholder="0,0"
                  helperText="求解器组件配置，格式: x,y"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 高级设置 */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">高级设置</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* 泊松求解器参数 */}
                {localSettings.solver_type === 'poisson' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        泊松求解器参数
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>求解方法 (method)</InputLabel>
                        <Select
                          value={localSettings.method || ''}
                          label="求解方法 (method)"
                          onChange={(e) => handleSettingsChange('method', e.target.value)}
                        >
                          <MenuItem value="">默认</MenuItem>
                          <MenuItem value="gs">高斯-赛德尔 (gs)</MenuItem>
                          <MenuItem value="jacobi">雅可比 (jacobi)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="参考密度 (n0)"
                        type="number"
                        value={localSettings.n0 || ''}
                        onChange={(e) => handleSettingsChange('n0', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                        helperText="参考密度 (m⁻³)"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="电子温度 (Te0)"
                        type="number"
                        value={localSettings.Te0 || ''}
                        onChange={(e) => handleSettingsChange('Te0', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                        helperText="电子温度 (eV)"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="参考电势 (phi0)"
                        type="number"
                        value={localSettings.phi0 || ''}
                        onChange={(e) => handleSettingsChange('phi0', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                        helperText="参考电势 (V)"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="最大迭代次数 (max_it)"
                        type="number"
                        value={localSettings.max_it || ''}
                        onChange={(e) => handleSettingsChange('max_it', e.target.value ? parseInt(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="非线性最大迭代次数 (nl_max_it)"
                        type="number"
                        value={localSettings.nl_max_it || ''}
                        onChange={(e) => handleSettingsChange('nl_max_it', e.target.value ? parseInt(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="线性容差 (tol)"
                        type="number"
                        value={localSettings.tol || ''}
                        onChange={(e) => handleSettingsChange('tol', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="非线性容差 (nl_tol)"
                        type="number"
                        value={localSettings.nl_tol || ''}
                        onChange={(e) => handleSettingsChange('nl_tol', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="收敛容差 (tolerance)"
                        type="number"
                        value={localSettings.tolerance || ''}
                        onChange={(e) => handleSettingsChange('tolerance', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.linear || false}
                            onChange={(e) => handleSettingsChange('linear', e.target.checked)}
                          />
                        }
                        label="线性求解 (linear)"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={localSettings.initial_only || false}
                            onChange={(e) => handleSettingsChange('initial_only', e.target.checked)}
                          />
                        }
                        label="仅初始求解 (initial_only)"
                      />
                    </Grid>
                  </>
                )}

                {/* 常电场求解器参数 */}
                {localSettings.solver_type === 'constant-ef' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        常电场求解器参数
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="电场分量 (comps)"
                        value={localSettings.comps || ''}
                        onChange={(e) => handleSettingsChange('comps', e.target.value)}
                        fullWidth
                        helperText="如: Ex,Ey"
                      />
                    </Grid>
                  </>
                )}

                {/* 通用参数 */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    通用参数
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="最大核心数"
                    type="number"
                    value={localSettings.max_cores || ''}
                    onChange={(e) => handleSettingsChange('max_cores', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings.randomize || false}
                        onChange={(e) => handleSettingsChange('randomize', e.target.checked)}
                      />
                    }
                    label="随机化种子"
                  />
                </Grid>

                {/* 平均化设置 */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    平均化设置
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="平均化频率 (averaging_frequency)"
                    type="number"
                    value={localSettings.averaging_frequency || ''}
                    onChange={(e) => handleSettingsChange('averaging_frequency', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ min: 1 }}
                    helperText="平均化频率"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="平均化开始迭代 (averaging_start_it)"
                    type="number"
                    value={localSettings.averaging_start_it || ''}
                    onChange={(e) => handleSettingsChange('averaging_start_it', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ min: 0 }}
                    helperText="开始平均化的迭代次数"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="平均化变量 (averaging_variables)"
                    value={localSettings.averaging_variables || ''}
                    onChange={(e) => handleSettingsChange('averaging_variables', e.target.value)}
                    fullWidth
                    helperText="如: phi,nd.Ar+"
                  />
                </Grid>

                {/* 动画设置 */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    动画设置
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="动画开始迭代 (animation_start_it)"
                    type="number"
                    value={localSettings.animation_start_it || ''}
                    onChange={(e) => handleSettingsChange('animation_start_it', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ min: 0 }}
                    helperText="开始动画的迭代次数"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="动画频率 (animation_frequency)"
                    type="number"
                    value={localSettings.animation_frequency || ''}
                    onChange={(e) => handleSettingsChange('animation_frequency', e.target.value ? parseInt(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ min: 1 }}
                    helperText="动画输出频率"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GlobalSettings;
