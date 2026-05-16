import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/api-response.js";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("API Error:", err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." 
    : err.message;

  return sendError(res, message, statusCode);
};
