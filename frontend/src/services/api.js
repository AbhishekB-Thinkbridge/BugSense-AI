import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include Firebase authentication token
api.interceptors.request.use(async (config) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser?.token) {
    config.headers.Authorization = `Bearer ${currentUser.token}`;
  }
  return config;
});

// Bug API
export const bugAPI = {
  submitBug: async (bugData) => {
    const formData = new FormData();
    
    // Append text fields
    Object.keys(bugData).forEach(key => {
      if (key !== 'screenshots' && key !== 'logImages') {
        if (bugData[key] !== null && bugData[key] !== undefined) {
          formData.append(key, bugData[key]);
        }
      }
    });
    
    // Append screenshots
    if (bugData.screenshots && bugData.screenshots.length > 0) {
      bugData.screenshots.forEach((file) => {
        formData.append('screenshots', file);
      });
    }
    
    // Append log images
    if (bugData.logImages && bugData.logImages.length > 0) {
      bugData.logImages.forEach((file) => {
        formData.append('logImages', file);
      });
    }
    
    const response = await api.post('/bugs/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getBug: async (bugId) => {
    const response = await api.get(`/bugs/${bugId}`);
    return response.data;
  },

  getAllBugs: async (params = {}) => {
    const response = await api.get('/bugs', { params });
    return response.data;
  },

  updateAnalysis: async (bugId, analysis) => {
    const response = await api.put(`/bugs/${bugId}/analysis`, { analysis });
    return response.data;
  },

  createJiraTicket: async (bugId) => {
    const response = await api.post(`/bugs/${bugId}/create-ticket`);
    return response.data;
  }
};

// JIRA API
export const jiraAPI = {
  getStory: async (storyKey) => {
    const response = await api.get(`/jira/story/${storyKey}`);
    return response.data;
  },

  searchSimilarBugs: async (summary) => {
    const response = await api.get('/jira/similar-bugs', {
      params: { summary }
    });
    return response.data;
  },

  getPotentialAssignees: async (component) => {
    const response = await api.get(`/jira/assignees/${component}`);
    return response.data;
  }
};

// Analysis API
export const analysisAPI = {
  analyzeBug: async (bugData) => {
    const response = await api.post('/analysis/analyze', bugData);
    return response.data;
  },

  generateTests: async (bugAnalysis) => {
    const response = await api.post('/analysis/generate-tests', { bugAnalysis });
    return response.data;
  },

  identifyModule: async (description, availableComponents = []) => {
    const response = await api.post('/analysis/identify-module', {
      description,
      availableComponents
    });
    return response.data;
  }
};

export default api;
