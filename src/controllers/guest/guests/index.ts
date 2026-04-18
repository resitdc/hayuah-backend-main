import { Request, Response, NextFunction } from "express";
import guestsService from "@services/guests/guests.service";
import { successResponse, successListResponse } from "@utils/response";
import { Model } from "objection";

interface RequestWithUser extends Request {
  user?: any;
  currentUser?: any;
}

export const findAllGuests = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as any;
    const options = {
      limit: parseInt(query.limit, 10) || 10,
      page: parseInt(query.page, 10) || 1,
      event_id: query.event_id,
      search: query.search,
      is_partner: query.is_partner !== undefined ? query.is_partner === "true" : undefined,
      is_vip: query.is_vip !== undefined ? query.is_vip === "true" : undefined,
      sort: query.sort,
      withCheckins: query.withCheckins === "true",
    };

    const data = await guestsService.findAll(options);
    successListResponse(res, 200, data.results, data.total, options.limit, options.page);
  } catch (error) {
    next(error);
  }
};

export const findGuestById = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const query = req.query as any;
    
    const data = await guestsService.findOne(id, query.withCheckins === "true");

    successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const createGuest = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const data = req.body;
    const newGuest = await guestsService.create(data, trx);
    await trx.commit();
    
    successResponse(res, 201, newGuest, "Guest created successfully");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const updateGuest = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedGuest = await guestsService.update(id, data, trx);
    await trx.commit();
    
    successResponse(res, 200, updatedGuest, "Guest updated successfully");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const deleteGuest = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const id = req.params.id;
    const result = await guestsService.remove(id, trx);
    await trx.commit();

    successResponse(res, 200, null, result.message);
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const checkInGuest = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const payload = {
      guest_id: req.body.guest_id,
      checkin_type: req.body.checkin_type || "SCAN",
    };

    const newCheckin = await guestsService.checkIn(payload, trx);
    await trx.commit();
    
    successResponse(res, 200, newCheckin, "Guest checked in successfully");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};