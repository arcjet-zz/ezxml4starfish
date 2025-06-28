import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Button,
  Divider
} from '@mui/material';
import { Source, Material, Boundary } from '../../types';

interface SourceFormProps {
  source: Source | null;
  materials: Material[];
  boundaries: Boundary[];
  onSave: (source: Omit<Source, 'id'>) => void;
  onCancel: () => void;
}

const SourceForm: React.FC<SourceFormProps> = ({
  source,
  materials,
  boundaries,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<Source, 'id'>>({
    name: '',
    type: 'volume',
    material: '',
    rate: undefined,
    temperature: undefined,
    region: undefined,
    boundary: undefined,
    mdot: undefined,
    v_drift: undefined,
    enforce: undefined,
    density: undefined,
    total_pressure: undefined,
    drift_velocity: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (source) {
      setFormData({
        name: source.name,
        type: source.type,
        material: source.material || '',
        rate: source.rate,
        temperature: source.temperature,
        region: source.region,
        boundary: source.boundary,
        mdot: source.mdot,
        v_drift: source.v_drift,
        enforce: source.enforce,
        density: source.density,
        total_pressure: source.total_pressure,
        drift_velocity: source.drift_velocity
      });
    }
  }, [source]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '源名称不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择源类型';
    }

    // 边界源需要边界关联
    if (isBoundarySource(formData.type) && !formData.boundary) {
      newErrors.boundary = '边界源必须关联一个边界';
    }

    // 体积源需要材料
    if (isVolumeSource(formData.type) && !formData.material) {
      newErrors.material = '体积源必须指定材料';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // 清理不相关的字段
      const cleanedData = { ...formData };

      if (isVolumeSource(formData.type)) {
        // 体积源不需要边界相关字段
        delete cleanedData.boundary;
        delete cleanedData.mdot;
        delete cleanedData.v_drift;
        delete cleanedData.enforce;
        delete cleanedData.drift_velocity;
        delete cleanedData.density;
        delete cleanedData.total_pressure;
      } else if (isBoundarySource(formData.type)) {
        // 边界源不需要体积源字段
        delete cleanedData.rate;
        delete cleanedData.region;
      }

      onSave(cleanedData);
    }
  };

  const isBoundarySource = (type: string) => {
    return ['uniform', 'cosine', 'ambient', 'thermionic'].includes(type);
  };

  const isVolumeSource = (type: string) => {
    return ['volume', 'preload', 'maxwellian'].includes(type);
  };

  const sourceTypes = [
    // 体积源类型
    { value: 'volume', label: '体积源 (Volume)' },
    { value: 'preload', label: '预加载源 (Preload)' },
    { value: 'maxwellian', label: '麦克斯韦分布源 (Maxwellian)' },
    // 边界源类型 - 注意：所有边界源都会映射为ambient类型
    { value: 'uniform', label: '均匀边界源 (Uniform) → ambient' },
    { value: 'cosine', label: '余弦边界源 (Cosine) → ambient' },
    { value: 'ambient', label: '环境源 (Ambient)' },
    { value: 'thermionic', label: '热离子发射源 (Thermionic) → ambient' }
  ];

  return (
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={3}>
        {/* 基本属性 */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            基本属性
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="源名称"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel>源类型</InputLabel>
            <Select
              value={formData.type}
              label="源类型"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {sourceTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>关联材料</InputLabel>
            <Select
              value={formData.material}
              label="关联材料"
              onChange={(e) => handleChange('material', e.target.value)}
            >
              <MenuItem value="">
                <em>无</em>
              </MenuItem>
              {materials.map((material) => (
                <MenuItem key={material.id} value={material.name}>
                  {material.name} ({material.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="温度 (K)"
            type="number"
            value={formData.temperature || ''}
            onChange={(e) => handleChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
            fullWidth
            inputProps={{ step: 'any', min: 0 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {/* 条件渲染：体积源参数 */}
        {isVolumeSource(formData.type) && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                体积源参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="粒子产生率 (rate)"
                type="number"
                value={formData.rate || ''}
                onChange={(e) => handleChange('rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
                helperText="粒子产生率"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="区域定义 (region)"
                value={formData.region || ''}
                onChange={(e) => handleChange('region', e.target.value || undefined)}
                fullWidth
                helperText="区域定义，如box区域"
              />
            </Grid>
          </>
        )}

        {/* 条件渲染：边界源参数 */}
        {isBoundarySource(formData.type) && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                边界源参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required={isBoundarySource(formData.type)} error={!!errors.boundary}>
                <InputLabel>关联边界</InputLabel>
                <Select
                  value={formData.boundary || ''}
                  label="关联边界"
                  onChange={(e) => handleChange('boundary', e.target.value)}
                >
                  <MenuItem value="">
                    <em>请选择边界</em>
                  </MenuItem>
                  {boundaries.map((boundary) => (
                    <MenuItem key={boundary.id} value={boundary.name}>
                      {boundary.name} ({boundary.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="质量流率 (mdot)"
                type="number"
                value={formData.mdot || ''}
                onChange={(e) => handleChange('mdot', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
                helperText="质量流率 (kg/s)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="漂移速度 (v_drift)"
                type="number"
                value={formData.v_drift || ''}
                onChange={(e) => handleChange('v_drift', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any' }}
                helperText="漂移速度 (m/s)"
              />
            </Grid>

            {/* 环境源特有参数 */}
            {formData.type === 'ambient' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>强制条件类型</InputLabel>
                    <Select
                      value={formData.enforce || ''}
                      label="强制条件类型"
                      onChange={(e) => handleChange('enforce', e.target.value)}
                    >
                      <MenuItem value="">无</MenuItem>
                      <MenuItem value="density">密度 (density)</MenuItem>
                      <MenuItem value="pressure">压力 (pressure)</MenuItem>
                      <MenuItem value="partial_pressure">分压 (partial_pressure)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="密度"
                    type="number"
                    value={formData.density || ''}
                    onChange={(e) => handleChange('density', e.target.value ? parseFloat(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ step: 'any', min: 0 }}
                    helperText="密度"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="总压力 (total_pressure)"
                    type="number"
                    value={formData.total_pressure || ''}
                    onChange={(e) => handleChange('total_pressure', e.target.value ? parseFloat(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ step: 'any', min: 0 }}
                    helperText="总压力 (Pa)"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="漂移速度矢量 (drift_velocity)"
                    value={formData.drift_velocity || ''}
                    onChange={(e) => handleChange('drift_velocity', e.target.value)}
                    fullWidth
                    placeholder="vx,vy,vz"
                    helperText="格式: vx,vy,vz"
                  />
                </Grid>
              </>
            )}
          </>
        )}

        {/* 帮助信息 */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>源类型说明：</strong><br />
              • 体积源 (volume/preload/maxwellian)：在计算域内部生成粒子，使用 &lt;source&gt; 标签<br />
              • 边界源 (uniform/cosine/ambient/thermionic)：在边界上生成粒子，使用 &lt;boundary_source&gt; 标签<br />
              <br />
              <strong>Starfish XML映射：</strong><br />
              • 体积源：直接使用指定的type属性 (volume, preload, maxwellian)<br />
              • 边界源：所有类型都映射为 type="ambient"，通过不同参数实现不同行为<br />
              • 已通过StarfishCLI.jar验证兼容性 ✓
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel}>
          取消
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          保存
        </Button>
      </Box>
    </Box>
  );
};

export default SourceForm;
