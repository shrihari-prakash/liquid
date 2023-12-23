import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "user-validator" });

import { query, body } from "express-validator";

import { Configuration } from "../singleton/configuration";
import { Language } from "../enum/language";
import { countryISOCodes } from "../utils/country-codes";

class UserValidator {
  nameValidationRegex = new RegExp(Configuration.get("user.profile.name-validation-regex"), "u");
  passwordRegex = Configuration.get("user.profile.password-validation-regex");
  alphaRegex = /^(__unset__|[A-Za-z ]+)$/;
  fn: typeof query | typeof body;

  urlValidator = (value: string) => {
    if (value === "__unset__") {
      return true;
    }
    try {
      new URL(value);
      return true;
    } catch (_) {
      return false;
    }
  };

  constructor(fn: typeof query | typeof body) {
    this.fn = fn;
    if (this.passwordRegex) {
      log.debug("Using custom regex (%s) for password validations.", this.passwordRegex);
    }
  }

  makeFieldName(field: string, nested: boolean) {
    return `${nested ? "*." : ""}${field}`;
  }

  username(required = false, nested = false) {
    const field = this.makeFieldName("username", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)
      [requiredFn]()
      .isString()
      .isLength({ min: 8, max: 30 })
      .matches(new RegExp(Configuration.get("user.profile.username-validation-regex"), "i"));
  }

  email(required = false, nested = false) {
    const field = this.makeFieldName("email", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isEmail();
  }

  emailVerified(required = false, nested = false) {
    const field = this.makeFieldName("emailVerified", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isBoolean();
  }

  secondaryEmail(required = false, nested = false) {
    const field = this.makeFieldName("email", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isEmail();
  }

  secondaryEmailVerified(required = false, nested = false) {
    const field = this.makeFieldName("emailVerified", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isBoolean();
  }

  firstName(required = false, nested = false) {
    const field = this.makeFieldName("firstName", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().matches(this.nameValidationRegex).isLength({ min: 1, max: 32 });
  }

  middleName(required = false, nested = false) {
    const field = this.makeFieldName("middleName", nested);
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
    return this.fn(field)[requiredFn]().isString().matches(combinedRegex).isLength({ min: 1, max: 32 });
  }

  lastName(required = false, nested = false) {
    const field = this.makeFieldName("lastName", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().matches(this.nameValidationRegex).isLength({ min: 1, max: 32 });
  }

  password(required = false, nested = false) {
    const field = this.makeFieldName("password", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)
      [requiredFn]()
      .isString()
      .isLength({ min: 8, max: 128 })
      .if(() => !!this.passwordRegex)
      .matches(new RegExp(this.passwordRegex));
  }

  phone(required = false, nested = false) {
    const field = this.makeFieldName("phone", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().isLength({ min: 10, max: 12 });
  }

  phoneCountryCode(required = false, nested = false) {
    const field = this.makeFieldName("phoneCountryCode", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)
      [requiredFn]()
      .isString()
      .isLength({ min: 2, max: 6 })
      .matches(/^(\+?\d{1,3}|\d{1,4})$/gm);
  }

  phoneVerified(required = false, nested = false) {
    const field = this.makeFieldName("phoneVerified", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isBoolean();
  }

  gender(required = false, nested = false) {
    const field = this.makeFieldName("gender", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().matches(this.alphaRegex).isLength({ min: 2, max: 128 });
  }

  preferredLanguage(required = false, nested = false) {
    const field = this.makeFieldName("preferredLanguage", nested);
    const requiredFn = required ? "exists" : "optional";
    const languages = Language.map((l) => l.code);
    return this.fn(field)[requiredFn]().isString().isAlpha().isIn(languages).isLength({ min: 2, max: 2 });
  }

  bio(required = false, nested = false) {
    const field = this.makeFieldName("bio", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().isLength({ min: 3, max: 256 });
  }

  customLink(required = false, nested = false) {
    const field = this.makeFieldName("customLink", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().custom(this.urlValidator).isLength({ max: 256 });
  }

  pronouns(required = false, nested = false) {
    const field = this.makeFieldName("pronouns", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().isLength({ min: 3, max: 24 });
  }

  organization(required = false, nested = false) {
    const field = this.makeFieldName("organization", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().matches(this.alphaRegex).isLength({ min: 3, max: 128 });
  }

  country(required = false, nested = false) {
    const field = this.makeFieldName("country", nested);
    const requiredFn = required ? "exists" : "optional";
    return this.fn(field)[requiredFn]().isString().isIn(countryISOCodes);
  }
}

export default UserValidator;
