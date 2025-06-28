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
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Material } from '../../types';

interface MaterialFormProps {
  material: Material | null;
  onSave: (material: Omit<Material, 'id'>) => void;
  onCancel: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<Material, 'id'>>({
    name: '',
    type: 'kinetic',
    charge: 0.0,
    molwt: undefined,
    mass: undefined,
    spwt: undefined,
    init: undefined,
    ref_temp: undefined,
    visc_temp_index: undefined,
    vss_alpha: undefined,
    diam: undefined,
    model: undefined,
    kTe0: undefined,
    density: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        type: material.type,
        charge: material.charge,
        molwt: material.molwt,
        mass: material.mass,
        spwt: material.spwt,
        init: material.init,
        ref_temp: material.ref_temp,
        visc_temp_index: material.visc_temp_index,
        vss_alpha: material.vss_alpha,
        diam: material.diam,
        model: material.model,
        kTe0: material.kTe0,
        density: material.density
      });
    }
  }, [material]);

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
      newErrors.name = '材料名称不能为空';
    }

    if (formData.mass !== undefined && formData.mass <= 0) {
      newErrors.mass = '质量必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  // 预设材料模板 - 符合Starfish规范
  const materialTemplates = {
    'Ar': {
      name: 'Ar',
      type: 'kinetic' as const,
      charge: 0,
      molwt: 39.948,
      spwt: 1e11,
      ref_temp: 273,
      visc_temp_index: 0.81,
      vss_alpha: 1.00,
      diam: 4.17e-10
    },
    'Ar+': {
      name: 'Ar+',
      type: 'kinetic' as const,
      charge: 1,
      molwt: 39.948,
      spwt: 1e11,
      ref_temp: 273,
      visc_temp_index: 0.81,
      vss_alpha: 1.00,
      diam: 4.17e-10
    },
    'e-': {
      name: 'e-',
      type: 'boltzmann_electrons' as const,
      charge: -1,
      model: 'qn',
      kTe0: 1.5
    },
    'Cu': {
      name: 'Cu',
      type: 'solid' as const,
      charge: 0,
      molwt: 63.546,
      density: 8960,
      thermal_conductivity: 401,
      specific_heat: 385,
      work_function: 4.65
    },
    'Al': {
      name: 'Al',
      type: 'solid' as const,
      charge: 0,
      molwt: 26.982,
      density: 2700,
      thermal_conductivity: 237,
      specific_heat: 897,
      work_function: 4.28
    },
    'H2': {
      name: 'H2',
      type: 'kinetic' as const,
      charge: 0,
      molwt: 2.016,
      spwt: 1e11,
      ref_temp: 273,
      visc_temp_index: 0.81,
      vss_alpha: 1.00,
      diam: 2.89e-10
    },
    'O2': {
      name: 'O2',
      type: 'kinetic' as const,
      charge: 0,
      molwt: 32.0,
      spwt: 1e11,
      ref_temp: 273,
      visc_temp_index: 0.81,
      vss_alpha: 1.00,
      diam: 4.07e-10
    }
  };

  const handleLoadTemplate = (templateName: keyof typeof materialTemplates) => {
    const template = materialTemplates[templateName];
    setFormData(template);
  };

  return (
    <Box sx={{ pt: 2 }}>
      {/* 预设模板 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          快速模板
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Object.keys(materialTemplates).map((templateName) => (
            <Button
              key={templateName}
              size="small"
              variant="outlined"
              onClick={() => handleLoadTemplate(templateName as keyof typeof materialTemplates)}
            >
              {templateName}
            </Button>
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* 基本属性 */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            基本属性
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="材料名称"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>材料类型</InputLabel>
            <Select
              value={formData.type}
              label="材料类型"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <MenuItem value="kinetic">动力学材料 (kinetic)</MenuItem>
              <MenuItem value="boltzmann_electrons">玻尔兹曼电子 (boltzmann_electrons)</MenuItem>
              <MenuItem value="solid">固体材料 (solid)</MenuItem>
            </Select>
            <FormHelperText>
              选择符合Starfish规范的材料类型
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="分子量 (molwt) - 推荐"
            type="number"
            value={formData.molwt || ''}
            onChange={(e) => handleChange('molwt', e.target.value ? parseFloat(e.target.value) : undefined)}
            fullWidth
            inputProps={{ step: 'any' }}
            helperText="原子质量单位 (amu)，优先于质量字段"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="质量 (mass) - 可选"
            type="number"
            value={formData.mass || ''}
            onChange={(e) => handleChange('mass', e.target.value ? parseFloat(e.target.value) : undefined)}
            fullWidth
            inputProps={{ step: 'any' }}
            helperText="质量 (kg)，当未提供molwt时使用"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="电荷"
            type="number"
            value={formData.charge}
            onChange={(e) => handleChange('charge', parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ step: 'any' }}
            helperText="基本电荷单位"
          />
        </Grid>

        {/* 材料类型特定属性 */}
        {formData.type === 'kinetic' && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">动力学材料属性</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="统计权重 (spwt)"
                      type="number"
                      value={formData.spwt || ''}
                      onChange={(e) => handleChange('spwt', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                      helperText="每个计算粒子代表的真实粒子数"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="初始化条件 (init)"
                      value={formData.init || ''}
                      onChange={(e) => handleChange('init', e.target.value || undefined)}
                      fullWidth
                      helperText="如: nd_back=1e10"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="参考温度 (ref_temp)"
                      type="number"
                      value={formData.ref_temp || ''}
                      onChange={(e) => handleChange('ref_temp', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                      helperText="温度 (K)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="粘性温度指数 (visc_temp_index)"
                      type="number"
                      value={formData.visc_temp_index || ''}
                      onChange={(e) => handleChange('visc_temp_index', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="VSS alpha参数 (vss_alpha)"
                      type="number"
                      value={formData.vss_alpha || ''}
                      onChange={(e) => handleChange('vss_alpha', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="分子直径 (diam)"
                      type="number"
                      value={formData.diam || ''}
                      onChange={(e) => handleChange('diam', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                      helperText="直径 (m)"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {formData.type === 'boltzmann_electrons' && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">玻尔兹曼电子属性</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="模型类型 (model)"
                      value={formData.model || ''}
                      onChange={(e) => handleChange('model', e.target.value || undefined)}
                      fullWidth
                      helperText="通常为 'qn'"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="电子温度 (kTe0)"
                      type="number"
                      value={formData.kTe0 || ''}
                      onChange={(e) => handleChange('kTe0', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                      helperText="电子温度 (eV)"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {formData.type === 'solid' && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">固体材料属性</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="密度 (density)"
                      type="number"
                      value={formData.density || ''}
                      onChange={(e) => handleChange('density', e.target.value ? parseFloat(e.target.value) : undefined)}
                      fullWidth
                      inputProps={{ step: 'any' }}
                      helperText="密度 (kg/m³)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                  <TextField
                    label="粘度温度指数 (visc_temp_index)"
                    type="number"
                    value={formData.visc_temp_index || ''}
                    onChange={(e) => handleChange('visc_temp_index', e.target.value ? parseFloat(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ step: 'any' }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="VSS Alpha参数 (vss_alpha)"
                    type="number"
                    value={formData.vss_alpha || ''}
                    onChange={(e) => handleChange('vss_alpha', e.target.value ? parseFloat(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ step: 'any' }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="直径 (diam)"
                    type="number"
                    value={formData.diam || ''}
                    onChange={(e) => handleChange('diam', e.target.value ? parseFloat(e.target.value) : undefined)}
                    fullWidth
                    inputProps={{ step: 'any' }}
                  />
                </Grid>

                {/* 固体材料特有属性 */}
                {formData.type === 'solid' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="密度 (density)"
                        type="number"
                        value={formData.density || ''}
                        onChange={(e) => handleChange('density', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="热导率 (thermal_conductivity)"
                        type="number"
                        value={formData.thermal_conductivity || ''}
                        onChange={(e) => handleChange('thermal_conductivity', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="比热容 (specific_heat)"
                        type="number"
                        value={formData.specific_heat || ''}
                        onChange={(e) => handleChange('specific_heat', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="功函数 (work_function)"
                        type="number"
                        value={formData.work_function || ''}
                        onChange={(e) => handleChange('work_function', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="二次电子发射系数 (secondary_emission_yield)"
                        type="number"
                        value={formData.secondary_emission_yield || ''}
                        onChange={(e) => handleChange('secondary_emission_yield', e.target.value ? parseFloat(e.target.value) : undefined)}
                        fullWidth
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
        )}
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

export default MaterialForm;
