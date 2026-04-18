import { Request, Response, NextFunction } from "express";
import usersService from "@services/user/Users.service";
import { successResponse, successListResponse } from "@utils/response";
import { Model } from "objection";

interface RequestWithUser extends Request {
  user?: any;
}

export const findAllUsers = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query as any;
    const options = {
      limit: parseInt(query.limit, 10) || 10,
      page: parseInt(query.page, 10) || 1,
      search: query.search,
      role: query.role,
      is_active: query.isActive !== undefined ? query.isActive === "true" : undefined,
      is_reviewer: query.isReviewer !== undefined ? query.isReviewer === "true" : undefined,
      sort: query.sort,
      withEmails: query.withEmails === "true",
      withPhones: query.withPhones === "true",
      withSosialMedia: query.withSosialMedia === "true",
      withSessions: query.withSessions === "true",
    };

    const data = await usersService.findAll(options);
    successListResponse(res, 200, data.results, data.total, options.limit, options.page);
  } catch (error) {
    next(error);
  }
};

export const findUserById = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const query = req.query as any;
    
    const data = await usersService.findOne(id, {
      withEmails: query.withEmails === "true",
      withPhones: query.withPhones === "true",
      withSosialMedia: query.withSosialMedia === "true",
      withActivities: query.withActivities === "true",
      withSessions: query.withSessions === "true",
    });

    successResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const data = req.body;
    const newUser = await usersService.create(data, trx);
    await trx.commit();
    
    successResponse(res, 201, newUser, "User created successfully");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const updateUser = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedUser = await usersService.update(id, data, trx);
    await trx.commit();
    
    successResponse(res, 200, updatedUser, "User updated successfully");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const deleteUser = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const id = req.params.id;
    const result = await usersService.remove(id, trx);
    await trx.commit();

    successResponse(res, 200, null, result.message);
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const sendUserInvitation = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const { name, email } = req.body;
    const result = await usersService.sendInvitation({ name, email }, trx);
    await trx.commit();
    successResponse(res, 200, null, result.message);
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const updateUserPassword = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const userId = req.currentUser?.sub;

    if (!userId) {
      return res.status(401).json({ success: false, message: "UNAUTHENTICATED" }); 
    }

    const { oldPassword, newPassword } = req.body;

    const result = await usersService.updatePassword(userId, { oldPassword, newPassword }, trx);
    
    await trx.commit();
    successResponse(res, 200, null, result.message);
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const updateUserProfile = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const trx = await Model.startTransaction();
  try {
    const userId = req.currentUser?.sub;

    if (!userId) {
      return res.status(401).json({ success: false, message: "UNAUTHENTICATED" }); 
    }

    const data = req.body;

    const updatedUser = await usersService.updateProfile(userId, data, trx);
    
    await trx.commit();
    successResponse(res, 200, updatedUser, "Profile updated successfully.");
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

export const getMe = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.currentUser?.sub;

    if (!userId) {
      return res.status(401).json({ success: false, message: "UNAUTHENTICATED" }); 
    }

    const data = await usersService.getMe(userId);
    
    successResponse(res, 200, data, "User profile fetched successfully");
  } catch (error) {
    next(error);
  }
};