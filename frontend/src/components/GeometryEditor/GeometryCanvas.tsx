import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Circle, Rect, Text } from 'react-konva';
import { Box } from '@mui/material';
import { Boundary, GeometryNode, DomainSettings } from '../../types';

interface GeometryCanvasProps {
  boundaries: Boundary[];
  selectedBoundaryId: string | null;
  isDrawing: boolean;
  onUpdateNodes: (nodes: GeometryNode[]) => void;
  onFinishDrawing: () => void;
  onSelectBoundary: (boundaryId: string) => void;
  domain: DomainSettings;
}

const GeometryCanvas: React.FC<GeometryCanvasProps> = ({
  boundaries,
  selectedBoundaryId,
  isDrawing,
  onUpdateNodes,
  onFinishDrawing,
  onSelectBoundary,
  domain
}) => {
  const stageRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 400 });
  const [currentNodes, setCurrentNodes] = useState<GeometryNode[]>([]);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算画布尺寸和缩放
  const canvasWidth = stageSize.width - 40; // 留边距
  const canvasHeight = stageSize.height - 40;
  
  // 计算域的实际尺寸
  const domainWidth = domain.spacing[0] * (domain.nodes[0] - 1);
  const domainHeight = domain.spacing[1] * (domain.nodes[1] - 1);
  
  // 计算缩放比例
  const scaleX = canvasWidth / domainWidth;
  const scaleY = canvasHeight / domainHeight;
  const scale = Math.min(scaleX, scaleY);

  // 坐标转换函数
  const worldToCanvas = (worldX: number, worldY: number) => ({
    x: 20 + (worldX - domain.origin[0]) * scale,
    y: 20 + (domainHeight - (worldY - domain.origin[1])) * scale // Y轴翻转
  });

  const canvasToWorld = (canvasX: number, canvasY: number) => ({
    x: domain.origin[0] + (canvasX - 20) / scale,
    y: domain.origin[1] + (domainHeight - (canvasY - 20) / scale)
  });

  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        const rect = container.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 当开始绘制时，如果有选中的边界，则从该边界的节点开始
  useEffect(() => {
    if (isDrawing && selectedBoundaryId) {
      const selectedBoundary = boundaries.find(b => b.id === selectedBoundaryId);
      if (selectedBoundary && selectedBoundary.nodes.length > 0) {
        setCurrentNodes([...selectedBoundary.nodes]);
      } else {
        setCurrentNodes([]);
      }
    } else if (!isDrawing) {
      setCurrentNodes([]);
    }
  }, [isDrawing, selectedBoundaryId, boundaries]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        handleFinishDrawing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);

  const handleStageClick = (e: any) => {
    if (!isDrawing) return;

    // 清除之前的点击超时
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // 设置延迟执行，避免与双击冲突
    clickTimeoutRef.current = setTimeout(() => {
      const pos = e.target.getStage().getPointerPosition();
      const worldPos = canvasToWorld(pos.x, pos.y);

      const newNodes = [...currentNodes, worldPos];
      setCurrentNodes(newNodes);
      onUpdateNodes(newNodes);
    }, 200); // 200ms延迟，避免与双击冲突
  };

  const handleStageDoubleClick = (e: any) => {
    // 双击时清除单击的延迟执行
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (isDrawing) {
      e.evt.preventDefault();
      handleFinishDrawing();
    }
  };

  const handleFinishDrawing = () => {
    setCurrentNodes([]);
    onFinishDrawing();
  };

  const handleBoundaryClick = (boundaryId: string, e: any) => {
    // 只在非绘制模式下阻止事件冒泡
    if (!isDrawing) {
      e.cancelBubble = true;
      onSelectBoundary(boundaryId);
    }
    // 在绘制模式下，让事件继续冒泡到Stage，这样可以继续添加点
  };

  // 绘制网格
  const renderGrid = () => {
    const gridLines = [];
    const gridSpacing = 20; // 像素间距

    // 垂直线
    for (let x = 20; x <= canvasWidth + 20; x += gridSpacing) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, 20, x, canvasHeight + 20]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    // 水平线
    for (let y = 20; y <= canvasHeight + 20; y += gridSpacing) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[20, y, canvasWidth + 20, y]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }

    return gridLines;
  };

  // 绘制域边界
  const renderDomainBoundary = () => {
    const topLeft = worldToCanvas(domain.origin[0], domain.origin[1] + domainHeight);
    const bottomRight = worldToCanvas(domain.origin[0] + domainWidth, domain.origin[1]);

    return (
      <Rect
        x={topLeft.x}
        y={topLeft.y}
        width={bottomRight.x - topLeft.x}
        height={bottomRight.y - topLeft.y}
        stroke="#2196f3"
        strokeWidth={2}
        fill="transparent"
        dash={[5, 5]}
      />
    );
  };

  // 绘制边界
  const renderBoundaries = () => {
    return boundaries.map((boundary) => {
      if (boundary.nodes.length < 2) return null;

      const canvasNodes = boundary.nodes.map(node => worldToCanvas(node.x, node.y));
      const points = canvasNodes.flatMap(node => [node.x, node.y]);

      const isSelected = boundary.id === selectedBoundaryId;
      const color = isSelected ? '#f44336' : '#4caf50';

      return (
        <React.Fragment key={boundary.id}>
          {/* 边界线 */}
          <Line
            points={points}
            stroke={color}
            strokeWidth={isSelected ? 3 : 2}
            closed={boundary.type === 'solid'}
            onClick={(e) => handleBoundaryClick(boundary.id, e)}
          />
          
          {/* 节点 */}
          {canvasNodes.map((node, index) => (
            <Circle
              key={`${boundary.id}-node-${index}`}
              x={node.x}
              y={node.y}
              radius={isSelected ? 4 : 3}
              fill={color}
              onClick={(e) => handleBoundaryClick(boundary.id, e)}
            />
          ))}
          
          {/* 边界标签 */}
          {canvasNodes.length > 0 && (
            <Text
              x={canvasNodes[0].x + 5}
              y={canvasNodes[0].y - 15}
              text={boundary.name}
              fontSize={12}
              fill={color}
            />
          )}
        </React.Fragment>
      );
    });
  };

  // 绘制当前绘制的节点
  const renderCurrentNodes = () => {
    if (!isDrawing || currentNodes.length === 0) return null;

    const canvasNodes = currentNodes.map(node => worldToCanvas(node.x, node.y));
    const points = canvasNodes.flatMap(node => [node.x, node.y]);

    return (
      <React.Fragment>
        {/* 当前线条 */}
        {canvasNodes.length > 1 && (
          <Line
            points={points}
            stroke="#ff9800"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* 当前节点 */}
        {canvasNodes.map((node, index) => (
          <Circle
            key={`current-${index}`}
            x={node.x}
            y={node.y}
            radius={4}
            fill="#ff9800"
          />
        ))}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      border: '1px solid #ccc',
      cursor: isDrawing ? 'crosshair' : 'default'
    }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onDblClick={handleStageDoubleClick}
      >
        <Layer>
          {/* 网格 */}
          {renderGrid()}
          
          {/* 域边界 */}
          {renderDomainBoundary()}
          
          {/* 边界 */}
          {renderBoundaries()}
          
          {/* 当前绘制 */}
          {renderCurrentNodes()}
          
          {/* 坐标轴标签 */}
          <Text x={10} y={10} text="Y" fontSize={14} fill="#666" />
          <Text x={stageSize.width - 20} y={stageSize.height - 20} text="X" fontSize={14} fill="#666" />
        </Layer>
      </Stage>
    </Box>
  );
};

export default GeometryCanvas;
