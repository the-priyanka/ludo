import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL_ANDROID, API_BASE_URL_IOS } from '@env';

// Use the local backend URL from .env
const baseURL = Platform.OS === 'android' ? API_BASE_URL_ANDROID : API_BASE_URL_IOS;

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
