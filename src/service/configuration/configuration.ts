import Options from "./options.json";

interface Option {
  name: string;
  envName: string;
  default: string | number | boolean | undefined;
  type: "number" | "boolean" | "string" | "stringArray" | "booleanArray" | "numberArray";
  description: string;
}

export class Configuration {
  options: any;

  constructor() {
    this.options = Options.reduce((obj, item) => Object.assign(obj, { [item.name]: item }), {});
  }

  public get(name: string, defaultValue?: any, delim = ",") {
    const option: Option = this.options[name];
    if (!option) return defaultValue || undefined;
    const value = process.env[option.envName] || defaultValue || option.default;
    switch (option.type) {
      case "boolean":
        return value === "true" || value === true;
      case "number":
        return typeof value === "string" ? parseInt(value, 10) : value;
      case "numberArray":
        return value.split(delim).map((elem: string) => parseInt(elem));
      case "stringArray":
        const parsed = value.split(delim);
        return parsed[0] !== "" ? parsed : [];
      case "booleanArray":
        return value.split(delim).map((elem: string) => elem === "true");
      default:
        return value;
    }
  }

  public set(name: string, value: any) {
    const option: Option = this.options[name];
    process.env[option.envName] = value + "";
  }
}
