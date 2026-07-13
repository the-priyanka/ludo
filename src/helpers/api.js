import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use the live backend URL
const baseURL = 'https://ludo-backend-vmoj.onrender.com/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token if available
api.interceptors.request.use(
  async (config) => {

    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${ token }`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
