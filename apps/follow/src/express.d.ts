import "express";
import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      client_id: string;
      user: {
        id: string;
        email?: string;
      };
    }
  }
}

export {}; //
