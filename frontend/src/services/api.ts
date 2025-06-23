import axios from 'axios';
import { SimulationProject } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

// API服务类
export class ApiService {
  /**
   * 解析上传的XML文件
   */
  static async parseProject(files: FileList): Promise<SimulationProject> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    const response = await api.post('/project/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * 生成并下载项目ZIP文件
   */
  static async generateProject(project: SimulationProject): Promise<Blob> {
    const response = await api.post('/project/generate', project, {
      responseType: 'blob',
    });
    
    return response.data;
  }

  /**
   * 下载生成的项目文件
   */
  static downloadProject(blob: Blob, filename: string = 'starfish_project.zip') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default api;
