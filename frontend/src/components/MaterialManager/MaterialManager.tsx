import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useProjectStore } from '../../store/projectStore';
import { Material } from '../../types';
import MaterialForm from './MaterialForm';

const MaterialManager: React.FC = () => {
  const { project, addMaterial, updateMaterial, deleteMaterial } = useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (window.confirm('确定要删除这个材料吗？')) {
      deleteMaterial(materialId);
    }
  };

  const handleSaveMaterial = (materialData: Omit<Material, 'id'>) => {
    if (editingMaterial) {
      // 更新现有材料
      updateMaterial(editingMaterial.id, materialData);
    } else {
      // 添加新材料
      const newMaterial: Material = {
        ...materialData,
        id: `material_${Date.now()}`
      };
      addMaterial(newMaterial);
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMaterial(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'GAS':
        return 'primary';
      case 'PLASMA-ELECTRON':
        return 'secondary';
      case 'PLASMA-ION':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          材料管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddMaterial}
        >
          添加材料
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>质量</TableCell>
              <TableCell>电荷</TableCell>
              <TableCell>分子量</TableCell>
              <TableCell>统计权重</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>{material.name}</TableCell>
                <TableCell>
                  <Chip
                    label={material.type}
                    color={getTypeColor(material.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{material.mass}</TableCell>
                <TableCell>{material.charge}</TableCell>
                <TableCell>{material.molwt || '-'}</TableCell>
                <TableCell>{material.spwt || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditMaterial(material)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteMaterial(material.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {project.materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    暂无材料，点击"添加材料"开始创建
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 材料编辑对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMaterial ? '编辑材料' : '添加材料'}
        </DialogTitle>
        <DialogContent>
          <MaterialForm
            material={editingMaterial}
            onSave={handleSaveMaterial}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MaterialManager;
