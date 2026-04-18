import Joi from "joi";
import { user } from "@resitdc/hayuah-models";

const validRoles = Object.values(user.Users.USER_ROLE);

export const findAllUsersSchema = Joi.object({
  limit: Joi.number().integer().min(1).default(10).label("Limit"),
  offset: Joi.number().integer().min(0).default(0).label("Offset"),
  search: Joi.string().trim().allow("").label("Search term"),
  role: Joi.string().valid(...validRoles).label("User Role"),
  is_active: Joi.boolean().label("Is Active"),
  is_reviewer: Joi.boolean().label("Is Reviewer"),
  sort: Joi.string()
    .trim()
    .pattern(/^([a-zA-Z0-9_]+):(asc|desc)$/i)
    .label("Sort (column:direction)"),
  withEmails: Joi.boolean().default(false).label("Include Emails"),
  withPhones: Joi.boolean().default(false).label("Include Phones"),
  withSosialMedia: Joi.boolean().default(false).label("Include Sosial Media"),
  withSessions: Joi.boolean().default(false).label("Include Sessions"),
});

export const userIdSchema = Joi.object({
  id: Joi.string().max(200).required().label("User ID"), 
});

export const createUserSchema = Joi.object({
  id: Joi.string().max(200).optional().label("User ID"),
  name: Joi.string().max(200).allow(null, "").label("Name"),
  alias: Joi.string().max(50).allow(null, "").label("Alias"),
  username: Joi.string().max(100).allow(null, "").label("Username"),
  password: Joi.string().min(6).allow(null, "").label("Password"),
  avatar: Joi.string().uri().allow(null, "").label("Avatar URL"),
  about: Joi.string().allow(null, "").label("About"),
  role: Joi.string().valid(...validRoles).default("INTERNAL").label("Role"),
  is_reviewer: Joi.boolean().default(false).label("Is Reviewer"),
  is_active: Joi.boolean().default(false).label("Is Active"),
  is_multi_device: Joi.boolean().allow(null).label("Is Multi Device"),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().max(200).allow(null, "").label("Name"),
  alias: Joi.string().max(50).allow(null, "").label("Alias"),
  username: Joi.string().max(100).allow(null, "").label("Username"),
  password: Joi.string().min(6).allow(null, "").label("Password"),
  avatar: Joi.string().uri().allow(null, "").label("Avatar URL"),
  about: Joi.string().allow(null, "").label("About"),
  role: Joi.string().valid(...validRoles).label("Role"),
  is_reviewer: Joi.boolean().label("Is Reviewer"),
  is_active: Joi.boolean().label("Is Active"),
  is_multi_device: Joi.boolean().allow(null).label("Is Multi Device"),
})
  .min(1)
  .label("Update User Data");

export const sendInvitationSchema = Joi.object({
  name: Joi.string().max(200).required().label("Name"),
  email: Joi.string().email().required().label("Email")
});

export const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().label("Old Password"),
  newPassword: Joi.string().min(6).required().label("New Password"),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().label("Confirm Password")
    .messages({ 'any.only': '{{#label}} does not match New Password' }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().max(200).allow(null, "").label("Name"),
  alias: Joi.string().max(50).allow(null, "").label("Alias"),
  username: Joi.string().max(100).allow(null, "").label("username"),
  about: Joi.string().allow(null, "").label("about"),
  phone: Joi.string().max(20).allow(null, "").label("Phone"),
}).min(1).label("Update Profile Data");