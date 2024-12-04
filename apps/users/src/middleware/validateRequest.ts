import { Request, Response, NextFunction } from "express";

export const validateRequest =
  (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        details: error.details.map(
          (detail: { message: string }) => detail.message
        ),
      });
    }

    next();
  };
