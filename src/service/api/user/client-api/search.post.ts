import { Request, Response } from "express";
import { body } from "express-validator";
import { runSearch } from "../shared/search.js";

export const POST_SearchValidator = [
  body("query")
    .exists()
    .custom((value) => {
      if (typeof value === "string" || typeof value === "object") return true;
      throw new Error("Query must be a string or an object");
    }),
];

const POST_Search = async (req: Request, res: Response): Promise<void> => {
  await runSearch(req, res, {
    scope: "client:profile:search",
    baseConfigPrefix: "client-api.user",
    privilegePrefix: "client-api.privilege.user",
    filterBlocked: false,
  });
};

export default POST_Search;

