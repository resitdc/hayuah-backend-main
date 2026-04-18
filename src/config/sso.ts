import axios from "axios";
import dotenv from "dotenv";
import errorResponseHandler from "@middlewares/axiosMiddleware";

dotenv.config();
const ssoHost: string | undefined = process.env.SSO_BASE_URL;

const ssoInstance = (token?: string) => {
  const instance = axios.create({
    baseURL: ssoHost,
    withCredentials: true
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
      console.log("SSO INSTANCE ERROR ======>", error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use((response) => response, errorResponseHandler);

  return instance;
};

export default ssoInstance;
