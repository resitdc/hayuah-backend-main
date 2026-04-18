import { Request, Response, NextFunction } from "express";
import { ObjectSchema, ValidationOptions, ValidationError } from "joi";
import { errorResponse } from "@utils/response";
import { BadRequestError } from "@utils/errors";

interface ValidationErrorItem {
  field: string;
  message: string;
}

const joiOptions: ValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
};

const formatValidationErrors = (error: ValidationError): ValidationErrorItem[] => {
  return error.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  }));
};

export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, joiOptions);

    if (error) {
      const validationErrors = formatValidationErrors(error);
      const badRequestError = new BadRequestError("Validation error in request body");
      (badRequestError as any).errors = validationErrors;
      return next(badRequestError);
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, joiOptions);

    if (error) {
      const validationErrors = formatValidationErrors(error);
      const badRequestError = new BadRequestError("Validation error in URL parameters");
      (badRequestError as any).errors = validationErrors;
      return next(badRequestError);
    }

    req.params = value;
    next();
  };
};

export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const queryOptions = { ...joiOptions, allowUnknown: true, stripUnknown: false };
    const { error, value } = schema.validate(req.query, queryOptions);

    if (error) {
      const validationErrors = formatValidationErrors(error);
      const badRequestError = new BadRequestError("Validation error in query parameters");
      (badRequestError as any).errors = validationErrors;
      return next(badRequestError);
    }

    req.query = value;
    next();
  };
};
