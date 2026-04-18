import { Response, NextFunction, Request } from "express";
import { convertKeysToCamel } from "./helpers";

interface SuccessResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

interface PaginationResponse {
  page: number;
  next: number;
  prev: number;
  limit: number;
  totalPage: number;
  totalData: number;
}

export const paginationResponse = (
  page: number,
  limit: number,
  totalData: number
): PaginationResponse => {
  let response: PaginationResponse = {
    page,
    next: page + 1,
    prev: page < 1 ? page : page - 1,
    limit: limit,
    totalPage: Math.ceil(totalData / limit),
    totalData: totalData,
  };

  return response;
};

interface AuthResponse {
  success: boolean;
  message: string;
  results: object | null;
}

export const authResponse = (
  status: boolean,
  message: string,
  rest?: object
): AuthResponse => {
  return {
    success: status,
    message: message,
    results: {
      ...rest
    }
  };
};

interface NoAccessResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export const noAccess = (results: object): NoAccessResponse => {
  let response: NoAccessResponse = {
    success: false,
    message: "You do not have access to this endpoint",
    ...results,
  };

  return response;
};

export const successResponseOld = (message: string, results: object): SuccessResponse => {
  const response: SuccessResponse = convertKeysToCamel({
    success: true,
    message: message,
    ...results,
  });

  return response;
};

export const errorResponseOld = (message: string, results?: object): ErrorResponse => {
  const response: ErrorResponse = convertKeysToCamel({
    success: false,
    message: message,
    ...results,
  });

  return response;
};

export const successResponse = (
  res: Response,
  statusCode: number,
  results: any,
  message?: string
) => {
  const responseBody: any = {
    success: true,
    message: message || "Operation successful",
  };

  if (results !== null && results !== undefined) {
    responseBody.results = results;
  }

  res.status(statusCode).json(convertKeysToCamel(responseBody));
};

export const errorResponse = (res: Response, statusCode: number, message: string, errors?: any) => {
  const responseBody: any = {
    success: false,
    message: message,
  };
  if (errors) {
    responseBody.errors = errors;
  }
  res.status(statusCode).json(responseBody);
};

export const successListResponse = (
  res: Response,
  statusCode: number,
  data: any[],
  total: number,
  limit: number,
  page: number,
  message?: string
) => {
  const responseBody: any = {
    success: true,
    message: message || "Data retrieved successfully",
    results: data,
  };

  const pageCount = limit > 0 ? Math.ceil(total / limit) : total > 0 ? 1 : 0;
  responseBody.pagination = {
    total,
    limit,
    totalPage: pageCount,
    totalData: total,
    page: page
  };

  res.status(statusCode).json(convertKeysToCamel(responseBody));
};


export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // console.error("Error:", err.message || err);
  // if (err.errors) {
  //   console.error("Validation Details:", err.errors);
  // }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  errorResponse(res, statusCode, message, err.errors);
};
