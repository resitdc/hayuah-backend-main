import { Router } from "express";
import requireAuth from "@middlewares/authMiddleware";
import { validateQuery, validateParams, validateBody } from "@middlewares/validationMiddlewareNew";

import {
  findAllGuests,
  findGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  checkInGuest,
} from "@controllers/guest/guests";

import {
  findAllGuestsSchema,
  guestIdSchema,
  createGuestSchema,
  updateGuestSchema,
  checkInGuestSchema,
} from "@controllers/guest/guests/validation";

const router = Router();

router.post("/checkin", requireAuth, validateBody(checkInGuestSchema), checkInGuest);
router.get("/", requireAuth, validateQuery(findAllGuestsSchema), findAllGuests);
router.get("/:id", requireAuth, validateParams(guestIdSchema), findGuestById);
router.post("/", requireAuth, validateBody(createGuestSchema), createGuest);
router.patch("/:id", requireAuth, validateParams(guestIdSchema), validateBody(updateGuestSchema), updateGuest);
router.delete("/:id", requireAuth, validateParams(guestIdSchema), deleteGuest);

export default router;