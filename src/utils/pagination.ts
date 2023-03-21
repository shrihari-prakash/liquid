import { Configuration } from "../singleton/configuration";

export const getPaginationLimit = (requestLimit: string | number) => {
  let limit: any = parseInt(requestLimit as string);
  if (!limit) {
    limit = Configuration.get("pagination.default-limit");
  }
  if (limit > Configuration.get("pagination.max-limit")) {
    limit = Configuration.get("pagination.max-limit");
  }
  return limit;
};
