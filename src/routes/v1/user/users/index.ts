import { Router } from "express";
import requireAuth from "@middlewares/authMiddleware";
import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  sendUserInvitation,
  updateUserPassword,
  updateUserProfile,
} from "@controllers/user/users";
import { validateQuery, validateParams, validateBody } from "@middlewares/validationMiddlewareNew";
import {
  findAllUsersSchema,
  userIdSchema,
  createUserSchema,
  updateUserSchema,
  sendInvitationSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "@controllers/user/users/validation";

const router = Router();

router.post("/send-invitation", requireAuth, validateBody(sendInvitationSchema), sendUserInvitation);
router.get("/", requireAuth, validateQuery(findAllUsersSchema), findAllUsers);
router.get("/:id", requireAuth, validateParams(userIdSchema), findUserById);
router.post("/", requireAuth, validateBody(createUserSchema), createUser);
router.patch("/:id", requireAuth, validateParams(userIdSchema), validateBody(updateUserSchema), updateUser);
router.delete("/:id", requireAuth, validateParams(userIdSchema), deleteUser);
router.patch("/me/password", requireAuth, validateBody(updatePasswordSchema), updateUserPassword);
router.patch("/me/profile", requireAuth, validateBody(updateProfileSchema), updateUserProfile);

export default router;