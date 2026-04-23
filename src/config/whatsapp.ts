import axios from "axios";
import dotenv from "dotenv";
import errorResponseHandler from "@middlewares/axiosMiddleware";

dotenv.config();

const token: string | undefined = process.env.WA_CLOUD_API_ACCESS_TOKEN;

const whatsappInstance = () => {
  const instance = axios.create({
    baseURL: "https://graph.facebook.com/v23.0/431447016714732",
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

export default whatsappInstance;
