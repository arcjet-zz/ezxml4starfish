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
  SelectChangeEvent
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
    type: 'collision',
    materials: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (interaction) {
      setFormData({
        name: interaction.name,
        type: interaction.type,
        materials: interaction.materials
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
    { value: 'collision', label: '碰撞 (Collision)' },
    { value: 'ionization', label: '电离 (Ionization)' },
    { value: 'excitation', label: '激发 (Excitation)' },
    { value: 'charge_exchange', label: '电荷交换 (Charge Exchange)' },
    { value: 'recombination', label: '复合 (Recombination)' },
    { value: 'attachment', label: '附着 (Attachment)' },
    { value: 'detachment', label: '脱附 (Detachment)' }
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
              {formData.type === 'collision' && '粒子间的弹性或非弹性碰撞，影响粒子的动量和能量分布。'}
              {formData.type === 'ionization' && '中性粒子被电离成离子和电子，通常需要电子和中性粒子参与。'}
              {formData.type === 'excitation' && '粒子的能级跃迁，改变粒子的内能状态。'}
              {formData.type === 'charge_exchange' && '离子与中性粒子间的电荷转移过程。'}
              {formData.type === 'recombination' && '离子和电子结合形成中性粒子的过程。'}
              {formData.type === 'attachment' && '电子附着到中性粒子上形成负离子。'}
              {formData.type === 'detachment' && '负离子释放电子变成中性粒子。'}
            </Typography>
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
