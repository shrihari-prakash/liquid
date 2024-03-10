import fs from "fs";

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
  configurations: any = {};

  constructor() {
    this.options = Options.reduce((options, option) => Object.assign(options, { [option.name]: option }), {});
    this.loadConfigFromJSON();
  }

  private loadConfigFromJSON() {
    const path = this.get("system.service.app-config-file-path");
    console.log("Backend configuration path: " + path);
    if (path) {
      try {
        const configurations = fs.readFileSync(path, "utf8");
        this.configurations = JSON.parse(configurations);
      } catch (err) {
        console.error("Error parsing configuration overrides:", err);
      }
    }
  }

  public get(name: string, defaultValue?: any, delim = ",") {
    const option: Option = this.options[name];
    if (!option) return defaultValue || undefined;
    if (option.name in this.configurations) {
      return this.configurations[option.name];
    }
    const value = (option.envName in process.env && process.env[option.envName]) || defaultValue || option.default;
    switch (option.type) {
      case "boolean":
        return value === "true" || value === true;
      case "number":
        return typeof value === "string" ? parseInt(value, 10) : value;
      case "numberArray":
        return value.split(delim).map((elem: string) => parseInt(elem));
      case "stringArray":
        if (Array.isArray(value)) {
          return value;
        }
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
