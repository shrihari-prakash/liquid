import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "user-validator" });

import { query, body } from "express-validator";

import { Configuration } from "../../singleton/configuration";

export const nameValidationRegex = new RegExp(Configuration.get("user.profile.name-validation-regex"), "u");

export const getUsernameValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}username`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)
    [requiredFn]()
    .isString()
    .isLength({ min: 8, max: 30 })
    .matches(new RegExp(Configuration.get("user.profile.username-validation-regex"), "i"));
};

export const getEmailValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}email`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)[requiredFn]().isEmail();
};

export const getFirstNameValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}firstName`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)[requiredFn]().isString().matches(nameValidationRegex).isLength({ min: 3, max: 32 });
};

export const getMiddleNameValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}middleName`;
  const requiredFn = required ? "exists" : "optional";
  let nameValidationRawRegex = Configuration.get("user.profile.name-validation-regex");
  if (nameValidationRawRegex.startsWith("^")) {
    nameValidationRawRegex = nameValidationRawRegex.substring(1);
  }
  if (nameValidationRawRegex.endsWith("$")) {
    nameValidationRawRegex = nameValidationRawRegex.substring(0, nameValidationRawRegex.length - 1);
  }
  let combinedRegex: string | RegExp = `^(__unset__|${nameValidationRawRegex})$`;
  log.debug("Middle name validation Regex: %s", combinedRegex);
  combinedRegex = new RegExp(combinedRegex, "u");
  return fn(field)[requiredFn]().isString().matches(combinedRegex).isLength({ min: 3, max: 32 });
};

export const getLastNameValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}lastName`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)[requiredFn]().isString().matches(nameValidationRegex).isLength({ min: 3, max: 32 });
};

const passwordRegex = Configuration.get("user.profile.password-validation-regex");
if (passwordRegex) {
  log.debug("Using custom regex (%s) for password validations.", passwordRegex);
}
export const getPasswordValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}password`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)
    [requiredFn]()
    .isString()
    .isLength({ min: 8, max: 128 })
    .if(() => !!passwordRegex)
    .matches(new RegExp(passwordRegex));
};

export const getPhoneValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}phone`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)[requiredFn]().isString().isLength({ min: 10, max: 12 });
};

export const getPhoneCountryCodeValidator = (fn: typeof query | typeof body, required = false, nested = false) => {
  const field = `${nested ? "*." : ""}phoneCountryCode`;
  const requiredFn = required ? "exists" : "optional";
  return fn(field)
    [requiredFn]()
    .isString()
    .isLength({ min: 2, max: 6 })
    .matches(/^(\+?\d{1,3}|\d{1,4})$/gm);
};
