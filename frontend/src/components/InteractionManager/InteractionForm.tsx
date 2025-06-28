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
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  FormHelperText,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Interaction, Material } from '../../types';

interface InteractionFormProps {
  interaction: Interaction | null;
  materials: Material[];
  onSave: (interaction: Omit<Interaction, 'id'>) => void;
  onCancel: () => void;
}

const InteractionForm: React.FC<InteractionFormProps> = ({
  interaction,
  materials,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Omit<Interaction, 'id'>>({
    name: '',
    type: 'surface_hit',
    materials: [],

    // 表面碰撞属性
    source: undefined,
    target: undefined,
    product: undefined,
    model: undefined,
    prob: undefined,
    c_accom: undefined,
    c_rest: undefined,

    // DSMC碰撞属性
    pair: undefined,
    sigma: undefined,
    sigma_coeffs: undefined,
    frequency: undefined,
    sig_cr_max: undefined,

    // MCC碰撞属性
    mcc_model: undefined,
    max_target_temp: undefined,
    ionization_energy: undefined,

    // 化学反应属性
    sources: undefined,
    products: undefined,
    rate_type: undefined,
    is_sigma: undefined,
    coeffs: undefined,
    output_wrappers: undefined,
    dep_var: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (interaction) {
      setFormData({
        name: interaction.name,
        type: interaction.type,
        materials: interaction.materials,

        // 表面碰撞属性
        source: interaction.source,
        target: interaction.target,
        product: interaction.product,
        model: interaction.model,
        prob: interaction.prob,
        c_accom: interaction.c_accom,
        c_rest: interaction.c_rest,

        // DSMC碰撞属性
        pair: interaction.pair,
        sigma: interaction.sigma,
        sigma_coeffs: interaction.sigma_coeffs,
        frequency: interaction.frequency,
        sig_cr_max: interaction.sig_cr_max,

        // MCC碰撞属性
        mcc_model: interaction.mcc_model,
        max_target_temp: interaction.max_target_temp,
        ionization_energy: interaction.ionization_energy,

        // 化学反应属性
        sources: interaction.sources,
        products: interaction.products,
        rate_type: interaction.rate_type,
        is_sigma: interaction.is_sigma,
        coeffs: interaction.coeffs,
        output_wrappers: interaction.output_wrappers,
        dep_var: interaction.dep_var
      });
    }
  }, [interaction]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMaterialsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleChange('materials', typeof value === 'string' ? value.split(',') : value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '相互作用名称不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择相互作用类型';
    }

    if (formData.materials.length < 2) {
      newErrors.materials = '相互作用至少需要两种材料';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const interactionTypes = [
    { value: 'surface_hit', label: '表面碰撞 (Surface Hit)' },
    { value: 'dsmc', label: 'DSMC碰撞 (DSMC)' },
    { value: 'mcc', label: 'MCC碰撞 (MCC)' },
    { value: 'chemistry', label: '化学反应 (Chemistry)' },
    { value: 'sputtering', label: '溅射 (Sputtering)' }
  ];

  const availableMaterials = materials.map(m => m.name);

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
            label="相互作用名称"
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
            <InputLabel>相互作用类型</InputLabel>
            <Select
              value={formData.type}
              label="相互作用类型"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {interactionTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth required error={!!errors.materials}>
            <InputLabel>参与材料</InputLabel>
            <Select
              multiple
              value={formData.materials}
              onChange={handleMaterialsChange}
              input={<OutlinedInput label="参与材料" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableMaterials.map((materialName) => (
                <MenuItem key={materialName} value={materialName}>
                  {materialName}
                </MenuItem>
              ))}
            </Select>
            {errors.materials && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.materials}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* 表面碰撞参数 */}
        {formData.type === 'surface_hit' && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                表面碰撞参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="源材料 (source)"
                value={formData.source || ''}
                onChange={(e) => handleChange('source', e.target.value)}
                fullWidth
                helperText="碰撞的源材料"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="目标材料 (target)"
                value={formData.target || ''}
                onChange={(e) => handleChange('target', e.target.value)}
                fullWidth
                helperText="碰撞的目标材料"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="产物材料 (product)"
                value={formData.product || ''}
                onChange={(e) => handleChange('product', e.target.value)}
                fullWidth
                helperText="碰撞产生的材料"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>碰撞模型 (model)</InputLabel>
                <Select
                  value={formData.model || ''}
                  label="碰撞模型 (model)"
                  onChange={(e) => handleChange('model', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="diffuse">漫反射 (diffuse)</MenuItem>
                  <MenuItem value="cosine">余弦分布 (cosine)</MenuItem>
                  <MenuItem value="specular">镜面反射 (specular)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="碰撞概率 (prob)"
                type="number"
                value={formData.prob || ''}
                onChange={(e) => handleChange('prob', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0, max: 1 }}
                helperText="碰撞概率 (0-1)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="能量适应系数 (c_accom)"
                type="number"
                value={formData.c_accom || ''}
                onChange={(e) => handleChange('c_accom', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0, max: 1 }}
                helperText="能量适应系数 (0-1)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="恢复系数 (c_rest)"
                type="number"
                value={formData.c_rest || ''}
                onChange={(e) => handleChange('c_rest', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0, max: 1 }}
                helperText="恢复系数 (0-1)"
              />
            </Grid>
          </>
        )}

        {/* DSMC碰撞参数 */}
        {formData.type === 'dsmc' && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                DSMC碰撞参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>DSMC模型 (model)</InputLabel>
                <Select
                  value={formData.model || ''}
                  label="DSMC模型 (model)"
                  onChange={(e) => handleChange('model', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="elastic">弹性碰撞 (elastic)</MenuItem>
                  <MenuItem value="inelastic">非弹性碰撞 (inelastic)</MenuItem>
                </Select>
                <FormHelperText>
                  DSMC模型类型，默认为 elastic
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="材料对 (pair)"
                value={formData.pair || ''}
                onChange={(e) => handleChange('pair', e.target.value)}
                fullWidth
                placeholder="材料1,材料2"
                helperText="参与碰撞的材料对"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>碰撞截面类型 (sigma)</InputLabel>
                <Select
                  value={formData.sigma || ''}
                  label="碰撞截面类型 (sigma)"
                  onChange={(e) => handleChange('sigma', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="const">常数 (const)</MenuItem>
                  <MenuItem value="inv">反比 (inv) - 仅DSMC支持</MenuItem>
                  <MenuItem value="bird463">Bird463模型</MenuItem>
                  <MenuItem value="tabulated">表格数据 (tabulated) - 将映射为const</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  注意：Starfish不支持tabulated，将自动映射为const并提供默认系数
                </Typography>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="截面系数 (sigma_coeffs)"
                value={formData.sigma_coeffs || ''}
                onChange={(e) => handleChange('sigma_coeffs', e.target.value)}
                fullWidth
                helperText="截面系数"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="碰撞频率 (frequency)"
                type="number"
                value={formData.frequency || ''}
                onChange={(e) => handleChange('frequency', e.target.value ? parseInt(e.target.value) : undefined)}
                fullWidth
                inputProps={{ min: 0 }}
                helperText="碰撞频率"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="最大sigma*cr值 (sig_cr_max)"
                type="number"
                value={formData.sig_cr_max || ''}
                onChange={(e) => handleChange('sig_cr_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
                helperText="最大sigma*cr值"
              />
            </Grid>
          </>
        )}

        {/* MCC碰撞参数 */}
        {formData.type === 'mcc' && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                MCC碰撞参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>MCC模型 (mcc_model)</InputLabel>
                <Select
                  value={formData.mcc_model || ''}
                  label="MCC模型 (mcc_model)"
                  onChange={(e) => handleChange('mcc_model', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="cex">电荷交换 (cex)</MenuItem>
                  <MenuItem value="mex">动量交换 (mex)</MenuItem>
                  <MenuItem value="ionization">电离 (ionization)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="源材料 (source)"
                value={formData.source || ''}
                onChange={(e) => handleChange('source', e.target.value)}
                fullWidth
                helperText="源材料"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="目标材料 (target)"
                value={formData.target || ''}
                onChange={(e) => handleChange('target', e.target.value)}
                fullWidth
                helperText="目标材料"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>碰撞截面类型 (sigma)</InputLabel>
                <Select
                  value={formData.sigma || ''}
                  label="碰撞截面类型 (sigma)"
                  onChange={(e) => handleChange('sigma', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="const">常数 (const)</MenuItem>
                  <MenuItem value="tabulated">表格数据 (tabulated) - 将映射为const</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  注意：MCC碰撞推荐使用const，tabulated将自动映射为const
                </Typography>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="截面系数 (sigma_coeffs)"
                value={formData.sigma_coeffs || ''}
                onChange={(e) => handleChange('sigma_coeffs', e.target.value)}
                fullWidth
                helperText="截面系数"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="最大目标温度 (max_target_temp)"
                type="number"
                value={formData.max_target_temp || ''}
                onChange={(e) => handleChange('max_target_temp', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
                helperText="最大目标温度 (K)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="电离能 (ionization_energy)"
                type="number"
                value={formData.ionization_energy || ''}
                onChange={(e) => handleChange('ionization_energy', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 'any', min: 0 }}
                helperText="电离能"
              />
            </Grid>
          </>
        )}

        {/* 化学反应参数 */}
        {formData.type === 'chemistry' && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                化学反应参数
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="反应物 (sources)"
                value={formData.sources || ''}
                onChange={(e) => handleChange('sources', e.target.value)}
                fullWidth
                helperText="反应物列表"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="产物 (products)"
                value={formData.products || ''}
                onChange={(e) => handleChange('products', e.target.value)}
                fullWidth
                helperText="产物列表"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>反应速率类型 (rate_type)</InputLabel>
                <Select
                  value={formData.rate_type || ''}
                  label="反应速率类型 (rate_type)"
                  onChange={(e) => handleChange('rate_type', e.target.value)}
                >
                  <MenuItem value="">默认</MenuItem>
                  <MenuItem value="const">常数 (const)</MenuItem>
                  <MenuItem value="poly">多项式 (poly)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_sigma || false}
                    onChange={(e) => handleChange('is_sigma', e.target.checked)}
                  />
                }
                label="是否为截面 (is_sigma)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="系数列表 (coeffs)"
                value={formData.coeffs || ''}
                onChange={(e) => handleChange('coeffs', e.target.value)}
                fullWidth
                helperText="系数列表"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="输出包装器 (output_wrappers)"
                value={formData.output_wrappers || ''}
                onChange={(e) => handleChange('output_wrappers', e.target.value)}
                fullWidth
                helperText="输出包装器"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="依赖变量 (dep_var)"
                value={formData.dep_var || ''}
                onChange={(e) => handleChange('dep_var', e.target.value)}
                fullWidth
                helperText="依赖变量 (对于const类型将自动映射为合适的变量)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="表面碰撞模型 (model)"
                value={formData.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                fullWidth
                placeholder="absorb, diffuse"
                helperText="表面碰撞模型"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="概率"
                type="number"
                value={formData.prob || ''}
                onChange={(e) => handleChange('prob', e.target.value ? parseFloat(e.target.value) : undefined)}
                fullWidth
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                helperText="碰撞概率 (0-1)"
              />
            </Grid>
          </>
        )}

        {/* 相互作用信息 */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              相互作用信息
            </Typography>
            <Typography variant="body2" color="text.secondary">
              类型: {formData.type}<br />
              参与材料数量: {formData.materials.length}<br />
              材料列表: {formData.materials.join(', ') || '无'}
            </Typography>
          </Box>
        </Grid>

        {/* 类型特定的帮助信息 */}
        <Grid item xs={12}>
          <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {interactionTypes.find(t => t.value === formData.type)?.label} 说明
            </Typography>
            <Typography variant="body2">
              {formData.type === 'surface_hit' && '粒子与固体表面的碰撞，可设置反射模型、概率和能量适应系数。'}
              {formData.type === 'dsmc' && 'Direct Simulation Monte Carlo碰撞，支持const、bird463等截面模型。'}
              {formData.type === 'mcc' && 'Monte Carlo Collision碰撞，用于电离、电荷交换等过程，推荐使用const截面。'}
              {formData.type === 'chemistry' && '化学反应过程，定义反应物、产物和反应速率。注意：依赖变量会根据反应类型自动调整。'}
              {formData.type === 'sputtering' && '表面溅射过程，粒子撞击表面产生新粒子。'}
            </Typography>
            {(formData.type === 'dsmc' || formData.type === 'mcc') && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                <strong>截面映射说明：</strong> tabulated → const (自动提供默认系数)，inv仅DSMC支持，推荐使用const或bird463。
              </Typography>
            )}
          </Box>
        </Grid>

        {/* 材料不足提示 */}
        {materials.length < 2 && (
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark">
                ⚠️ 当前项目中的材料数量不足。相互作用至少需要两种材料。
                请先在"材料管理"中添加更多材料。
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel}>
          取消
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={materials.length < 2}
        >
          保存
        </Button>
      </Box>
    </Box>
  );
};

export default InteractionForm;
