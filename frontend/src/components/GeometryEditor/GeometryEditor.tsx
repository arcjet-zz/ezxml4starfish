import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useProjectStore } from '../../store/projectStore';
import { Boundary, GeometryNode } from '../../types';
import GeometryCanvas from './GeometryCanvas';
import BoundaryPropertiesPanel from './BoundaryPropertiesPanel';

const GeometryEditor: React.FC = () => {
  const { project, addBoundary, updateBoundary, deleteBoundary } = useProjectStore();
  const [selectedBoundaryId, setSelectedBoundaryId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const selectedBoundary = selectedBoundaryId 
    ? project.boundaries.find(b => b.id === selectedBoundaryId) 
    : null;

  const handleAddBoundary = () => {
    const newBoundary: Boundary = {
      id: `boundary_${Date.now()}`,
      name: `边界 ${project.boundaries.length + 1}`,
      type: 'solid',
      potential: 0.0,
      nodes: []
    };
    
    addBoundary(newBoundary);
    setSelectedBoundaryId(newBoundary.id);
    setIsDrawing(true);
  };

  const handleSelectBoundary = (boundaryId: string) => {
    setSelectedBoundaryId(boundaryId);
    setIsDrawing(false);
  };

  const handleContinueDrawing = () => {
    if (selectedBoundaryId) {
      setIsDrawing(true);
    }
  };

  const handleDeleteBoundary = (boundaryId: string) => {
    deleteBoundary(boundaryId);
    if (selectedBoundaryId === boundaryId) {
      setSelectedBoundaryId(null);
    }
  };

  const handleUpdateBoundaryNodes = (nodes: GeometryNode[]) => {
    if (selectedBoundaryId) {
      updateBoundary(selectedBoundaryId, { nodes });
    }
  };

  const handleFinishDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        几何绘制与边界定义
      </Typography>
      
      <Grid container spacing={3}>
        {/* 左侧：画布 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 600 }}>
            <Typography variant="subtitle1" gutterBottom>
              2D 绘图画布
            </Typography>
            <GeometryCanvas
              boundaries={project.boundaries}
              selectedBoundaryId={selectedBoundaryId}
              isDrawing={isDrawing}
              onUpdateNodes={handleUpdateBoundaryNodes}
              onFinishDrawing={handleFinishDrawing}
              onSelectBoundary={handleSelectBoundary}
              domain={project.domain}
            />
          </Paper>
        </Grid>

        {/* 右侧：控制面板 */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 边界列表 */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">边界列表</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddBoundary}
                    disabled={isDrawing}
                  >
                    添加边界
                  </Button>
                </Box>
                
                <List dense>
                  {project.boundaries.map((boundary) => (
                    <React.Fragment key={boundary.id}>
                      <ListItem
                        button
                        selected={selectedBoundaryId === boundary.id}
                        onClick={() => handleSelectBoundary(boundary.id)}
                      >
                        <ListItemText
                          primary={boundary.name}
                          secondary={`类型: ${boundary.type}, 节点: ${boundary.nodes.length}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBoundary(boundary.id);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {project.boundaries.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="暂无边界"
                        secondary="点击'添加边界'开始绘制"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* 边界属性面板 */}
            {selectedBoundary && (
              <BoundaryPropertiesPanel
                boundary={selectedBoundary}
                onUpdate={(updates) => updateBoundary(selectedBoundary.id, updates)}
                onContinueDrawing={handleContinueDrawing}
                isDrawing={isDrawing}
              />
            )}

            {/* 绘制提示 */}
            {isDrawing && (
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    绘制模式
                  </Typography>
                  <Typography variant="body2">
                    在画布上点击来添加边界节点。双击或按ESC键完成绘制。
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeometryEditor;
