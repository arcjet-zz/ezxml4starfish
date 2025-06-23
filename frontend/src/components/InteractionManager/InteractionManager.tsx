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
  Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useProjectStore } from '../../store/projectStore';
import { Interaction } from '../../types';
import InteractionForm from './InteractionForm';

const InteractionManager: React.FC = () => {
  const { project, addInteraction, updateInteraction, deleteInteraction } = useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

  const handleAddInteraction = () => {
    setEditingInteraction(null);
    setDialogOpen(true);
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setDialogOpen(true);
  };

  const handleDeleteInteraction = (interactionId: string) => {
    if (window.confirm('确定要删除这个相互作用吗？')) {
      deleteInteraction(interactionId);
    }
  };

  const handleSaveInteraction = (interactionData: Omit<Interaction, 'id'>) => {
    if (editingInteraction) {
      // 更新现有相互作用
      updateInteraction(editingInteraction.id, interactionData);
    } else {
      // 添加新相互作用
      const newInteraction: Interaction = {
        ...interactionData,
        id: `interaction_${Date.now()}`
      };
      addInteraction(newInteraction);
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInteraction(null);
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'collision':
        return 'primary';
      case 'ionization':
        return 'secondary';
      case 'excitation':
        return 'success';
      case 'charge_exchange':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          相互作用管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddInteraction}
        >
          添加相互作用
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>参与材料</TableCell>
              <TableCell>材料数量</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.interactions.map((interaction) => (
              <TableRow key={interaction.id}>
                <TableCell>{interaction.name}</TableCell>
                <TableCell>
                  <Chip
                    label={interaction.type}
                    color={getInteractionTypeColor(interaction.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {interaction.materials.map((material, index) => (
                      <Chip
                        key={index}
                        label={material}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {interaction.materials.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        无
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{interaction.materials.length}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditInteraction(interaction)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteInteraction(interaction.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {project.interactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    暂无相互作用配置，点击"添加相互作用"开始创建
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 相互作用编辑对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingInteraction ? '编辑相互作用' : '添加相互作用'}
        </DialogTitle>
        <DialogContent>
          <InteractionForm
            interaction={editingInteraction}
            materials={project.materials}
            onSave={handleSaveInteraction}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* 帮助信息 */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          相互作用类型说明
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>碰撞 (collision)</strong>: 粒子间的弹性或非弹性碰撞<br />
          • <strong>电离 (ionization)</strong>: 中性粒子被电离成离子和电子<br />
          • <strong>激发 (excitation)</strong>: 粒子的能级跃迁<br />
          • <strong>电荷交换 (charge_exchange)</strong>: 离子与中性粒子间的电荷转移
        </Typography>
      </Box>
    </Box>
  );
};

export default InteractionManager;
