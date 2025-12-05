import { Logger } from "../../singleton/logger.js";
import { Configuration } from "../../singleton/configuration.js";
import { isValidObjectId } from "mongoose";

const log = Logger.getLogger().child({ from: "service/query-parser" });

export class QueryParser {
  public static buildFreeTextQuery(text: string) {
    const queryRegex = new RegExp(text, "i");
    const strictFields = new Set(Configuration.get("user.search.strict-match-fields"));
    const $or: any[] = Configuration.get("user.search.search-fields").map((field: string) => ({
      [field]: strictFields.has(field) ? text : queryRegex,
    }));
    if (Configuration.get("privilege.user.search.can-use-id") && isValidObjectId(text)) {
      log.debug("Search by ID is enabled.");
      $or.push({ _id: text });
    }
    if (Configuration.get("privilege.user.search.can-use-fullname")) {
      log.debug("Search by Full Name is enabled.");
      $or.push({
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: text,
            options: "i",
          },
        },
      });
    }
    return $or;
  }

  public static validate(query: any, allowedFields: Set<string>, depth = 0): boolean {
    if (typeof query !== "object" || query === null) return true;

    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) {
      log.warn("Query exceeds maximum depth of " + MAX_DEPTH);
      return false;
    }

    const allowedOperators = new Set([
      "$eq",
      "$gt",
      "$gte",
      "$lt",
      "$lte",
      "$ne",
      "$in",
      "$nin",
      "$regex",
      "$options",
      "$or",
      "$and",
      "$not",
      "$exists",
    ]);

    for (const key in query) {
      if (key.startsWith("$")) {
        if (!allowedOperators.has(key)) {
          log.warn("Invalid operator found in query: " + key);
          return false;
        }
        if (key === "$regex") {
          const MAX_REGEX_LENGTH = 100;
          if (typeof query[key] === "string" && query[key].length > MAX_REGEX_LENGTH) {
            log.warn("Regex length exceeds maximum allowed length of " + MAX_REGEX_LENGTH);
            return false;
          }
        }
        if (key === "$or" || key === "$and") {
          if (!Array.isArray(query[key])) return false;
          for (const subQuery of query[key]) {
            if (!this.validate(subQuery, allowedFields, depth + 1)) return false;
          }
        } else {
          // For other operators like $eq, $gt, $in, etc., the value is the leaf value (or array of values).
          // We don't need to validate the structure of the value itself against allowedFields/Operators,
          // but we might want to check if it contains nested operators if that's possible (e.g. $not).
          // However, for simple comparison/array operators, we should NOT recurse with the same validate function
          // because the value (e.g. [1, 2] for $in) is not a query object.

          // If the value is an object and not an array, it might contain nested operators (e.g. $not).
          if (typeof query[key] === "object" && query[key] !== null && !Array.isArray(query[key])) {
            // Only recurse if it looks like a query object (keys starting with $)
            // But actually, for standard operators, the value is just data.
            // The only exception is $not which takes a query expression.
            if (key === "$not") {
              if (!this.validate(query[key], allowedFields, depth + 1)) return false;
            }
            // For others ($gt, $regex, etc), we stop recursion.
          }
        }
      } else {
        if (!allowedFields.has(key)) {
          log.warn("Invalid field found in query: " + key);
          return false;
        }
        // Recurse for the value of the field (e.g. { age: { $gt: 20 } })
        if (!this.validate(query[key], allowedFields, depth + 1)) return false;
      }
    }
    return true;
  }
}

