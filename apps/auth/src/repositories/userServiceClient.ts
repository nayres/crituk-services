import axios from "axios";

export const userServiceClient = axios.create({
  baseURL: process.env.USER_SERVICE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
