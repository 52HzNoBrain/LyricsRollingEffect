import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 创建一个 Axios 实例
const axiosTool: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // 设置后端 API 地址
  timeout: 10000, // 请求超时时间（单位：毫秒）
});

// 请求拦截器
axiosTool.interceptors.request.use(
  (config: any) => {
    // 在发送请求之前做些什么
    // 比如可以在这里添加 token 等认证信息
    return config;
  },
  (error: any) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  },
);

// 响应拦截器
axiosTool.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    return response.data;
  },
  (error: any) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  },
);

export default axiosTool;
