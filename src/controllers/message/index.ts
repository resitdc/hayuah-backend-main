import { Request, Response } from "express";
import { successResponseOld, errorResponseOld } from "@utils/response";
import {
  sendTemplateMessage,
} from "@whatsapp/instance";
import dotenv from "dotenv";

dotenv.config();

interface Error {
  message: string;
  status: number;
  [key: string]: any;
}

const waPhoneNumberId: string | number = process.env.WA_PHONE_NUMBER_ID || "";
const phoneNumber = process.env.PHONE_NUMBER;

export const sendTemplate = async (req: Request, res: Response) => {
  let to: string = req.body.to;
  let template: any = req.body.template;

  try {
    const sendMessage = await sendTemplateMessage(to, template);
    
    res.status(sendMessage?.status || 200).json(
      successResponseOld("Message sent", {
        results: sendMessage.data
      })
    );
  } catch (error) {
    const err = error as Error;
    res.status(err?.status || 500).json(
      errorResponseOld(err?.message || "Internal server error", { results: error })
    );
  }
};
