import axiosTool from '@src/utils/axiosTool';
import { AxiosResponse } from 'axios';

export const getSong = () => {
  return axiosTool.get('/song') as Promise<AxiosResponse<string, any>>;
};

export const getAllSong = () => {
  return axiosTool.get('/getAllSong') as Promise<AxiosResponse<any, any>>;
};
