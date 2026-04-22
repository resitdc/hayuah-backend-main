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

const router = Router({ mergeParams: true });

router.post("/checkin", validateBody(checkInGuestSchema), checkInGuest);
router.get("/:eventId", validateQuery(findAllGuestsSchema), findAllGuests);
router.get("/:eventId/:id", validateParams(guestIdSchema), findGuestById);
router.post("/:eventId", validateBody(createGuestSchema), createGuest);
router.patch("/:eventId/:id", validateParams(guestIdSchema), validateBody(updateGuestSchema), updateGuest);
router.delete("/:eventId/:id", validateParams(guestIdSchema), deleteGuest);

export default router;