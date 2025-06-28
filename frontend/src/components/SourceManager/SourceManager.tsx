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
import { Source } from '../../types';
import SourceForm from './SourceForm';

const SourceManager: React.FC = () => {
  const { project, addSource, updateSource, deleteSource } = useProjectStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  const handleAddSource = () => {
    setEditingSource(null);
    setDialogOpen(true);
  };

  const handleEditSource = (source: Source) => {
    setEditingSource(source);
    setDialogOpen(true);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (window.confirm('确定要删除这个源吗？')) {
      deleteSource(sourceId);
    }
  };

  const handleSaveSource = (sourceData: Omit<Source, 'id'>) => {
    if (editingSource) {
      // 更新现有源
      updateSource(editingSource.id, sourceData);
    } else {
      // 添加新源
      const newSource: Source = {
        ...sourceData,
        id: `source_${Date.now()}`
      };
      addSource(newSource);
    }
    setDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSource(null);
  };

  const getSourceTypeColor = (type: string) => {
    switch (type) {
      // 体积源类型
      case 'volume':
      case 'preload':
      case 'maxwellian':
        return 'primary';
      // 边界源类型
      case 'uniform':
      case 'cosine':
      case 'ambient':
      case 'thermionic':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          源配置管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddSource}
        >
          添加源
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>材料</TableCell>
              <TableCell>生成率/流率</TableCell>
              <TableCell>温度</TableCell>
              <TableCell>边界</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>{source.name}</TableCell>
                <TableCell>
                  <Chip
                    label={source.type}
                    color={getSourceTypeColor(source.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{source.material || '-'}</TableCell>
                <TableCell>
                  {source.rate ? `${source.rate}` : ''}
                  {source.mdot ? `${source.mdot} (mdot)` : ''}
                  {!source.rate && !source.mdot ? '-' : ''}
                </TableCell>
                <TableCell>{source.temperature || '-'}</TableCell>
                <TableCell>{source.boundary || '-'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditSource(source)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSource(source.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {project.sources.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    暂无源配置，点击"添加源"开始创建
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 源编辑对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSource ? '编辑源' : '添加源'}
        </DialogTitle>
        <DialogContent>
          <SourceForm
            source={editingSource}
            materials={project.materials}
            boundaries={project.boundaries}
            onSave={handleSaveSource}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SourceManager;
