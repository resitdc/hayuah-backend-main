import Joi from "joi";

const validCheckinTypes = ["SCAN", "MANUAL"]; 

export const findAllGuestsSchema = Joi.object({
  limit: Joi.number().integer().min(1).default(10).label("Limit"),
  page: Joi.number().integer().min(1).default(1).label("Page"),
  event_id: Joi.string().max(200).allow(null, "").label("Event ID"),
  search: Joi.string().trim().allow("").label("Search term"),
  is_partner: Joi.boolean().label("Is Partner"),
  is_vip: Joi.boolean().label("Is VIP"),
  sort: Joi.string()
    .trim()
    .pattern(/^([a-zA-Z0-9_]+):(asc|desc)$/i)
    .label("Sort (column:direction)"),
  withCheckins: Joi.boolean().default(false).label("Include Checkins"),
});

export const guestIdSchema = Joi.object({
  id: Joi.string().max(200).required().label("Guest ID"), 
});

export const createGuestSchema = Joi.object({
  id: Joi.string().max(200).optional().label("Guest ID"),
  event_id: Joi.string().max(200).required().label("Event ID"),
  name: Joi.string().max(200).required().label("Name"),
  email: Joi.string().email().max(200).allow(null, "").label("Email"),
  whatsapp: Joi.string().max(100).allow(null, "").label("WhatsApp"),
  instagram: Joi.string().max(100).allow(null, "").label("Instagram"),
  qrcode: Joi.string().allow(null, "").label("QR Code"),
  is_partner: Joi.boolean().default(false).label("Is Partner"),
  avatar: Joi.string().uri().allow(null, "").label("Avatar URL"),
  is_print: Joi.boolean().allow(null).label("Is Print"),
  is_vip: Joi.boolean().allow(null).label("Is VIP"),
});

export const updateGuestSchema = Joi.object({
  event_id: Joi.string().max(200).allow(null, "").label("Event ID"),
  name: Joi.string().max(200).allow(null, "").label("Name"),
  email: Joi.string().email().max(200).allow(null, "").label("Email"),
  whatsapp: Joi.string().max(100).allow(null, "").label("WhatsApp"),
  instagram: Joi.string().max(100).allow(null, "").label("Instagram"),
  qrcode: Joi.string().allow(null, "").label("QR Code"),
  is_partner: Joi.boolean().label("Is Partner"),
  avatar: Joi.string().uri().allow(null, "").label("Avatar URL"),
  is_print: Joi.boolean().allow(null).label("Is Print"),
  is_vip: Joi.boolean().allow(null).label("Is VIP"),
})
  .min(1)
  .label("Update Guest Data");

export const checkInGuestSchema = Joi.object({
  guest_id: Joi.string().max(200).required().label("Guest ID"),
  checkin_type: Joi.string()
    .valid(...validCheckinTypes)
    .default("SCAN")
    .label("Check-In Type"),
});