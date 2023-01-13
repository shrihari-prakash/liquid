import { Request, Response } from "express";
import { statusCodes } from "../../../../utils/http-status";
import { SuccessResponse } from "../../../../utils/response";

const GET_Hello = async (req: Request, res: Response) => {
  res.status(statusCodes.success).json(new SuccessResponse());
};

export default GET_Hello;
