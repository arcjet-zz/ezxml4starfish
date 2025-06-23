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
    boundary: undefined,
    mdot: undefined,
    v_drift: undefined
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
        boundary: source.boundary,
        mdot: source.mdot,
        v_drift: source.v_drift
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // 清理不相关的字段
      const cleanedData = { ...formData };
      
      if (!isBoundarySource(formData.type)) {
        // 体积源不需要边界相关字段
        delete cleanedData.boundary;
        delete cleanedData.mdot;
        delete cleanedData.v_drift;
      } else {
        // 边界源不需要体积源字段
        delete cleanedData.rate;
      }

      onSave(cleanedData);
    }
  };

  const isBoundarySource = (type: string) => {
    return ['uniform', 'cosine', 'boundary'].includes(type);
  };

  const sourceTypes = [
    { value: 'volume', label: '体积源 (Volume)' },
    { value: 'uniform', label: '均匀边界源 (Uniform)' },
    { value: 'cosine', label: '余弦边界源 (Cosine)' },
    { value: 'boundary', label: '边界源 (Boundary)' }
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
        {!isBoundarySource(formData.type) && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                体积源参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="生成率 (particles/s)"
                type="number"
                value={formData.rate || ''}
                onChange={(e) => handleChange('rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="漂移速度 (m/s)"
                type="number"
                value={formData.v_drift || ''}
                onChange={(e) => handleChange('v_drift', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any' }}
              />
            </Grid>
          </>
        )}

        {/* 帮助信息 */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>源类型说明：</strong><br />
              • 体积源：在计算域内部生成粒子<br />
              • 均匀边界源：在边界上均匀分布生成粒子<br />
              • 余弦边界源：在边界上按余弦分布生成粒子<br />
              • 边界源：通用边界源类型
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
