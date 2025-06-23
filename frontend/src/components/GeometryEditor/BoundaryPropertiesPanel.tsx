import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Divider
} from '@mui/material';
import { Boundary } from '../../types';

interface BoundaryPropertiesPanelProps {
  boundary: Boundary;
  onUpdate: (updates: Partial<Boundary>) => void;
  onContinueDrawing?: () => void;
  isDrawing?: boolean;
}

const BoundaryPropertiesPanel: React.FC<BoundaryPropertiesPanelProps> = ({
  boundary,
  onUpdate,
  onContinueDrawing,
  isDrawing = false
}) => {
  const [localBoundary, setLocalBoundary] = useState(boundary);

  useEffect(() => {
    setLocalBoundary(boundary);
  }, [boundary]);

  const handleChange = (field: keyof Boundary, value: any) => {
    const updated = { ...localBoundary, [field]: value };
    setLocalBoundary(updated);
    onUpdate({ [field]: value });
  };

  const handleNodeChange = (index: number, field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedNodes = [...localBoundary.nodes];
    updatedNodes[index] = { ...updatedNodes[index], [field]: numValue };
    
    setLocalBoundary({ ...localBoundary, nodes: updatedNodes });
    onUpdate({ nodes: updatedNodes });
  };

  const handleAddNode = () => {
    const newNode = { x: 0, y: 0 };
    const updatedNodes = [...localBoundary.nodes, newNode];
    
    setLocalBoundary({ ...localBoundary, nodes: updatedNodes });
    onUpdate({ nodes: updatedNodes });
  };

  const handleRemoveNode = (index: number) => {
    const updatedNodes = localBoundary.nodes.filter((_, i) => i !== index);
    
    setLocalBoundary({ ...localBoundary, nodes: updatedNodes });
    onUpdate({ nodes: updatedNodes });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          边界属性
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 基本属性 */}
          <TextField
            label="边界名称"
            value={localBoundary.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>边界类型</InputLabel>
            <Select
              value={localBoundary.type}
              label="边界类型"
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <MenuItem value="SOLID">固体边界 (SOLID)</MenuItem>
              <MenuItem value="OPEN">开放边界 (OPEN)</MenuItem>
              <MenuItem value="SYMMETRY">对称边界 (SYMMETRY)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="电势 (V)"
            type="number"
            value={localBoundary.potential}
            onChange={(e) => handleChange('potential', parseFloat(e.target.value) || 0)}
            fullWidth
            size="small"
            inputProps={{ step: 0.1 }}
          />

          <Divider />

          {/* 节点坐标 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                节点坐标 ({localBoundary.nodes.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {onContinueDrawing && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={onContinueDrawing}
                    disabled={isDrawing}
                    color="primary"
                  >
                    {isDrawing ? '绘制中...' : '继续绘制'}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddNode}
                >
                  添加节点
                </Button>
              </Box>
            </Box>

            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {localBoundary.nodes.map((node, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    mb: 1,
                    p: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="caption" sx={{ minWidth: 20 }}>
                    {index + 1}
                  </Typography>
                  
                  <TextField
                    label="X"
                    type="number"
                    value={node.x}
                    onChange={(e) => handleNodeChange(index, 'x', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    inputProps={{ step: 0.01 }}
                  />
                  
                  <TextField
                    label="Y"
                    type="number"
                    value={node.y}
                    onChange={(e) => handleNodeChange(index, 'y', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    inputProps={{ step: 0.01 }}
                  />
                  
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveNode(index)}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    ×
                  </Button>
                </Box>
              ))}
            </Box>

            {localBoundary.nodes.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                暂无节点，请在画布上绘制或手动添加
              </Typography>
            )}
          </Box>

          {/* 边界信息 */}
          <Box sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              边界信息
            </Typography>
            <Typography variant="body2">
              节点数量: {localBoundary.nodes.length}
            </Typography>
            <Typography variant="body2">
              类型: {localBoundary.type}
            </Typography>
            <Typography variant="body2">
              电势: {localBoundary.potential} V
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BoundaryPropertiesPanel;
