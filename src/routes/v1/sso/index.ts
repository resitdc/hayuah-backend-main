import { Router } from "express";
import requireAuth from "@middlewares/authMiddleware";
import {
  exchange,
  check,
  refresh,
  logout,
} from "@controllers/sso";

const router = Router();

router.post("/exchange", exchange);
router.post("/refresh", refresh);
router.get("/check", check);
router.post("/logout", requireAuth, logout);

export default router;