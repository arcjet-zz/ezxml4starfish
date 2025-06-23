import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Container,
  Fab,
  Tooltip
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useProjectStore } from '../store/projectStore';
import GeometryEditor from '../components/GeometryEditor/GeometryEditor';
import MaterialManager from '../components/MaterialManager/MaterialManager';
import GlobalSettings from '../components/GlobalSettings/GlobalSettings';
import SourceManager from '../components/SourceManager/SourceManager';
import InteractionManager from '../components/InteractionManager/InteractionManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`editor-tabpanel-${index}`}
      aria-labelledby={`editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EditorPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const { project, isDirty } = useProjectStore();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleQuickSave = () => {
    // 快速保存功能 - 导出项目
    const event = new CustomEvent('export-project');
    window.dispatchEvent(event);
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Box sx={{ width: '100%', position: 'relative' }}>
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="editor tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="几何绘制" />
            <Tab label="材料管理" />
            <Tab label="全局设置" />
            <Tab label="源配置" />
            <Tab label="相互作用" />
          </Tabs>
        </Paper>

        <TabPanel value={tabValue} index={0}>
          <GeometryEditor />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MaterialManager />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <GlobalSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <SourceManager />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <InteractionManager />
        </TabPanel>

        {/* 快速保存按钮 */}
        {isDirty && (
          <Tooltip title="快速导出项目">
            <Fab
              color="primary"
              aria-label="save"
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000
              }}
              onClick={handleQuickSave}
            >
              <Save />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </Container>
  );
};

export default EditorPage;
