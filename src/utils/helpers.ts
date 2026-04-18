import { Request } from "express";
import bcrypt from "bcryptjs";
import CryptoJs from "crypto-js";
import devConfig from "@config/devConfig";
import dotenv from "dotenv";
dotenv.config();
const SECRET_KEY = process.env.JWT_ACCESS_SECRET || "default_secret_key";
import fs from "fs";
import { AccessTokenPayload } from "../dataTypes";
import { sendEmail } from "@services/gsuite/gsuite.service";
import { dashboardInvitation } from "@utils/emailTemplates";

interface DynamicObject {
  [key: string]: any;
}

export const generateId = (name?: string): string => {
  const personName: string[] = (name || "Anonymous").split(" ");
  const prefixCode: string =
    personName[0].substring(0, 1).toUpperCase() +
    (personName[1] ? personName[1].substring(0, 1).toUpperCase() : "");
  const dateNow = new Date();
  const h: number = dateNow.getHours();
  const i: number = dateNow.getMinutes();
  const s: number = dateNow.getSeconds();
  const y: number = dateNow.getFullYear();
  const m: number = dateNow.getMonth() + 1;
  const d: number = dateNow.getDate();
  const rn: number[] = [...Array(4)].map(() => Math.floor(Math.random() * 10));
  const uniqId: string =
    prefixCode + s + d + h + m + i + y + rn[0] + rn[1] + rn[2] + rn[3];

  return uniqId;
};

export const toUTC = (date: Date, offset: number): string => {
  const utcDate = new Date(date.getTime() - offset * 60000);
  return utcDate.toISOString().split(".")[0] + "Z";
};

export const generateDateWithOffset = async (
  date?: string | null,
  offset: number = 0
) => {
  return toUTC(date ? new Date(date) : new Date(), offset * 60);
};

export const generateOtp = (otpLength: number | null = 6): string => {
  return [...Array(otpLength)]
    .map((a) => Math.ceil(Math.random() * 9))
    .join("");
};

export const insertLoginOtp = async (userId: string) => {
  let currentDate = new Date();
  currentDate.setSeconds(currentDate.getSeconds() + 10); // I add 20 second for entire process
  const interval = 3; // this is minutes
  const otp: string = generateOtp();
  const hashedOtp: string = await bcrypt.hash(otp, 13);
  const createdAt = await generateDateWithOffset(currentDate.toISOString(), 0);
  currentDate.setMinutes(currentDate.getMinutes() + interval);
  const expiredAt = await generateDateWithOffset(currentDate.toISOString(), 0);

  return {
    user_id: userId,
    name: "LOGIN OTP",
    code: hashedOtp,
    otp,
    expired_at: expiredAt,
    created_at: createdAt,
  };
};

export const onlyNumber = (input: string): string => {
  return input.replace(/\D/g, "");
};

export const phoneNumber = (phone: string): string => {
  let defaultCode: string = "62";
  let fullPhone: string = onlyNumber(phone);
  return fullPhone.charAt(0) === "0"
    ? fullPhone.replace(/^0/, defaultCode)
    : fullPhone;
};

export const getTodayDate = (timezone: string = "Asia/Jakarta"): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
  }
  return shuffledArray;
};

export const modifyObject = (results: DynamicObject): DynamicObject => {
  return Object.fromEntries(
    Object.entries(results).map(([key, value]) => {
      if (key.endsWith("_fix")) {
        return [key.slice(0, -4), value];
      }
      return [key, value];
    })
  );
};

export const fixResults = (
  results: DynamicObject | DynamicObject[]
): DynamicObject | DynamicObject[] => {
  if (Array.isArray(results)) {
    return results.map((obj) => modifyObject(obj));
  } else {
    return modifyObject(results);
  }
};

export const formatDateString = (dateString: string, type?: string) => {
  const date = new Date(dateString);
  let options: Intl.DateTimeFormatOptions;
  if (type === "short") {
    options = { year: "numeric", month: "short" };
  } else {
    options = { day: "numeric", month: "long", year: "numeric" };
  }
  return date.toLocaleDateString("id-ID", options);
};

export const jakartaDate = (d: Date) => {
  const date = new Date(String(d));
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const formattedDate = `${day} ${
    monthNames[date.getMonth()]
  } ${year} ${hours}:${minutes}`;

  return formattedDate;
};

export const decryptAes = (ciphertext: string) => {
  console.log("SECRET KEY", SECRET_KEY);
  const bytes = CryptoJs.AES.decrypt(ciphertext, SECRET_KEY as string);
  const originalText = bytes.toString(CryptoJs.enc.Utf8);
  return originalText;
};

export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const convertKeysToCamel = <T>(data: T): T => {
  // return data;
  if (Array.isArray(data)) {
    return data.map((item) => convertKeysToCamel(item)) as unknown as T;
  } else if (data !== null && typeof data === "object") {
    return Object.keys(data).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      (acc as any)[camelKey] = convertKeysToCamel((data as any)[key]);
      return acc;
    }, {} as any) as T;
  }
  return data;
};

export const generateFakeAccessTokenPayload = (): AccessTokenPayload => {
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: devConfig.id,
    role: devConfig.role,
    jti: "dev-jti-static",
    iss: "en-auth",
    aud: "en-client",
    iat: now,
    exp: now + 60 * 60 * 24 * 24
  };
};

export const isLocalhost = (req: Request) => {
  const ip = req?.ip || req?.socket.remoteAddress;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip?.includes("127.0.0.1")
  );
};

export const sendDashboardInvitation = async (
  name: string,
  email: string,
  password: string,
) => {
  const template = dashboardInvitation(name, email, password);

  await sendEmail(
    "Dashboard - Escape Nomade <server@escapenomade.com>",
    {
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      list: template.list,
    }
  );
};

export const getWeeksInMonth = (month: number, year: number) => {
  const weeks = [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  let currentDay = new Date(year, month - 1, 1);
  
  let dayOfWeek = currentDay.getDay();
  let diff = currentDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  currentDay.setDate(diff);

  let lastDayOfMonth = new Date(year, month, 0);

  while (currentDay <= lastDayOfMonth) {
    let weekStart = new Date(currentDay);
    let weekEnd = new Date(currentDay);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let label = "";
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      label = `${weekStart.getDate()} - ${weekEnd.getDate()} ${months[weekStart.getMonth()]}`;
    } else {
      label = `${weekStart.getDate()} ${months[weekStart.getMonth()]} - ${weekEnd.getDate()} ${months[weekEnd.getMonth()]}`;
    }

    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: label,
    });

    currentDay.setDate(currentDay.getDate() + 7);
  }
  return weeks;
};

export const getColorFromInitial = (initial: string) => {
  const code = initial.toUpperCase().charCodeAt(0);
  const r = (code * 45) % 255;
  const g = (code * 85) % 255;
  const b = (code * 125) % 255;
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

export const getDistinctColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const getDistinctHexColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash) % 360;
  
  return hslToHex(h, 70, 50);
};