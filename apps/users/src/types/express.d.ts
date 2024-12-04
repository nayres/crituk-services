import "express";
import { Multer } from "multer";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email?: string;
      };
      file?: Multer.File;
    }
  }
}

export {}; //
