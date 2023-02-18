export const statusCodes = {
  success: 200,
  created: 201,
  internalError: 500,
  clientInputError: 400,
  conflict: 409,
  forbidden: 403,
  unauthorized: 401,
  unprocessableEntity: 422,
  resourceNotActive: 401,
};

export const errorMessages = {
  internalError: "InternalServerError",
  clientInputError: "ClientInputError",
  rateLimitError: "RateLimitError",
  conflict: "ResourceConflict",
  banned: "Banned",
  unauthorized: "Unauthorized",
  forbidden: "Forbidden",
  accessDenied: "AccessDenied",
  resourceDoesNotBelongToUser: "ResourceDoesNotBelongToUser",
  unprocessableEntity: "UnprocessableEntity",
  deleteNondeletableField: "DeleteNondeletableField",
  resourceDoesNotExist: "ResourceDoesNotExist",
  incompleteSubmission: "IncompleteSubmission",
  resourceNotActive: "ResourceNotActive",
};
