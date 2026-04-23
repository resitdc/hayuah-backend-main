import { Router } from "express";
import requireAuth from "@middlewares/authMiddleware";

import userRoutes from "./user/users";
import { getMe } from "@controllers/user/users";
import guestsRoutes from "./guest/guests";

const router = Router();

router.get("/me", requireAuth, getMe);

//#endregion - User
router.use("/user/users", userRoutes);
//#region - User

//#endregion - Guest
router.use("/guest/guests", guestsRoutes);
//#region - Guest


export default router;
