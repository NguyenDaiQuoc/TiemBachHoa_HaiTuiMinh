import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./src/shared/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(env.PORT || 3000);
  const isProduction = process.env.NODE_ENV === "production";

  // Trust proxy for rate limiting (behind Nginx/Cloud Run)
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now as it might break Vite dev server preview
  }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use('/generated', express.static(path.join(process.cwd(), 'public', 'generated')));

  // Security: Rate Limiting
  const authLimiter = rateLimit({
    windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000,
    max: isProduction ? 10 : 200,
    message: { error: isProduction ? "Too many login attempts. Please try again in 15 minutes." : "Bạn đang gửi yêu cầu đăng nhập quá nhanh. Vui lòng thử lại sau ít phút." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100, // 100 req/min for general API
    message: { error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  // Import Routers
  const authRouter = (await import("./src/server/auth-router.js")).default;
  const userRouter = (await import("./src/server/user-router.js")).default;
  const productRouter = (await import("./src/server/product-router.js")).default;
  const categoryRouter = (await import("./src/server/category-router.js")).default;
  const cartRouter = (await import("./src/server/cart-router.js")).default;
  const orderRouter = (await import("./src/server/order-router.js")).default;
  const adminRouter = (await import("./src/server/admin-router.js")).default;
  const communityRouter = (await import("./src/server/community-router.js")).default;

  // API Routes
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api", apiLimiter); // Apply to all other API routes
  app.use("/api/products", productRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", orderRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/community", communityRouter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Error Handler (MUST BE LAST)
  const { errorHandler } = (await import("./src/server/middleware/error-handler.js"));
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
