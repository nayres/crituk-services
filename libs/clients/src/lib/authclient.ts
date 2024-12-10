import axios from "axios";

export const authClient = axios.create({
  baseURL: process.env.AUTH_SERVICE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
