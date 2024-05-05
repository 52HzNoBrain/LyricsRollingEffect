import axiosTool from '@src/utils/axiosTool';

export const hello = () => {
  return axiosTool.get('/hello');
};
