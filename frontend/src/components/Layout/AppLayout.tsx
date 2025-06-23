import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Save, 
  Download, 
  Upload, 
  Home,
  Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { ApiService } from '../../services/api';

interface AppLayoutProps {
  children: React.ReactNode;
  showProjectActions?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, showProjectActions = false }) => {
  const navigate = useNavigate();
  const { project, isDirty, setLoading, setError } = useProjectStore();

  const handleHome = () => {
    if (isDirty) {
      const confirmed = window.confirm('您有未保存的更改，确定要离开吗？');
      if (!confirmed) return;
    }
    navigate('/');
  };

  // 监听快速导出事件
  React.useEffect(() => {
    const handleExportEvent = () => {
      handleExportProject();
    };

    window.addEventListener('export-project', handleExportEvent);
    return () => {
      window.removeEventListener('export-project', handleExportEvent);
    };
  }, [project]);

  const handleExportProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const blob = await ApiService.generateProject(project);
      ApiService.downloadProject(blob);
      
    } catch (error) {
      console.error('Export failed:', error);
      setError('导出项目失败，请检查配置是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.xml';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          setLoading(true);
          setError(null);
          
          const parsedProject = await ApiService.parseProject(files);
          useProjectStore.getState().setProject(parsedProject);
          
        } catch (error) {
          console.error('Import failed:', error);
          setError('导入项目失败，请检查文件格式是否正确');
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Starfish-ezxml
            {isDirty && (
              <Tooltip title="有未保存的更改">
                <Warning sx={{ ml: 1, fontSize: 20, color: 'warning.main' }} />
              </Tooltip>
            )}
          </Typography>
          
          {showProjectActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="导入项目">
                <IconButton color="inherit" onClick={handleImportProject}>
                  <Upload />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="导出项目">
                <IconButton color="inherit" onClick={handleExportProject}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <Tooltip title="返回首页">
            <IconButton color="inherit" onClick={handleHome}>
              <Home />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout;
