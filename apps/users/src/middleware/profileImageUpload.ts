import { CritukError, ErrorCodes } from "@org/errors";
import multer, { FileFilterCallback } from "multer";
import path from "path";

const storage = multer.memoryStorage();
const fileLimits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const fileFilterCallback = (
  req: unknown,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (fileExt === ".jpeg" || fileExt === ".jpg" || fileExt === ".png") {
    cb(null, true);
  } else {
    cb(
      new CritukError(
        "Image must be JPEG or PNG",
        ErrorCodes.VALIDATION.INVALID_FORMAT,
        409
      )
    );
  }
};

export const profileImageUpload = multer({
  storage,
  fileFilter: fileFilterCallback,
  limits: fileLimits,
});
