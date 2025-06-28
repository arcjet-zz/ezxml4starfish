import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  CircularProgress
} from '@mui/material';
import { Add, FolderOpen } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { ApiService } from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { resetProject, setProject, setLoading, setError, isLoading } = useProjectStore();

  const handleCreateNew = () => {
    // 重置项目状态并导航到编辑器
    resetProject();
    navigate('/editor');
  };

  const handleOpenProject = () => {
    // 打开本地项目逻辑
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
          setProject(parsedProject);
          navigate('/editor');

        } catch (error) {
          console.error('Failed to parse project:', error);
          setError('解析项目文件失败，请检查文件格式是否正确');
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          欢迎使用 Starfish-ezxml
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          可视化XML配置工具，让Starfish仿真配置变得简单
        </Typography>
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
          ✅ 完全兼容 Starfish v0.25 | 自动类型映射 | 智能参数配置
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>正在处理文件...</Typography>
          </Box>
        )}

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
              onClick={isLoading ? undefined : handleCreateNew}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Add sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  创建新项目
                </Typography>
                <Typography color="text.secondary" paragraph>
                  从头开始创建一个新的仿真配置项目
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleCreateNew}
                  disabled={isLoading}
                >
                  开始创建
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
              onClick={isLoading ? undefined : handleOpenProject}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <FolderOpen sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  打开本地项目
                </Typography>
                <Typography color="text.secondary" paragraph>
                  导入现有的XML配置文件进行编辑
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={handleOpenProject}
                  disabled={isLoading}
                >
                  选择文件
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'left' }}>
          <Typography variant="h6" gutterBottom>
            功能特性
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                • 🎨 可视化2D几何绘制
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 📝 表单化参数配置
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 📁 项目生命周期管理
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                • 🔄 XML文件解析和生成
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 💾 本地文件导入导出
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • ⚡ 实时配置验证
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 🔄 自动类型映射兼容
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
