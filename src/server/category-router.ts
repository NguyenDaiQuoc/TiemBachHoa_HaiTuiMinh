import express from "express";
import prisma from "../shared/lib/prisma.js";
import { sendSuccess } from "./utils/api-response.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null
      }
    });
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

export default router;
