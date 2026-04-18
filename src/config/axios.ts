import axios from "axios";
import dotenv from "dotenv";
import errorResponseHandler from "@middlewares/axiosMiddleware";

dotenv.config();

let adminBaseURL: string | undefined = process.env.ADMIN_WA_API;
const token: string | undefined = process.env.WA_CLOUD_API_ACCESS_TOKEN;

const axiosInstance = () => {
  const instance = axios.create({
    baseURL: adminBaseURL,
  });

  instance.interceptors.request.use(
    (config) => {
      if (token) {
        const bearerToken = `Bearer ${token}`;
        config.headers.Authorization = bearerToken;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    errorResponseHandler,
  );

  return instance;
};

export default axiosInstance;
