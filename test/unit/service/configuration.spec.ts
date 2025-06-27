import { expect } from "chai";
import sinon from "sinon";

import * as configurationModule from "../../../src/service/configuration/configuration.js";

describe("Configuration Service", () => {
  let sandbox: sinon.SinonSandbox;
  let fsStub: sinon.SinonStub;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Stub fs module
    fsStub = sandbox.stub();
    consoleLogStub = sandbox.stub(console, "log");
    consoleErrorStub = sandbox.stub(console, "error");
  });

  afterEach(() => {
    sandbox.restore();
    // Clean up environment variables
    delete process.env.LIQUID_SERVICE_APP_CONFIG_FILE_PATH;
    delete process.env.TEST_OPTION;
    delete process.env.TEST_BOOL;
    delete process.env.TEST_NUMBER;
    delete process.env.TEST_ARRAY;
    delete process.env.TEST_EMPTY_ARRAY;
    delete process.env.TEST_NUMBER_ARRAY;
    delete process.env.TEST_BOOLEAN_ARRAY;
    delete process.env.TEST_CUSTOM_DELIM;
  });

  describe("Configuration class methods", () => {
    it("should handle boolean conversion correctly", () => {
      // Create a mock configuration instance
      const config = new configurationModule.Configuration();

      // Mock the options
      config.options = {
        "test.bool": {
          name: "test.bool",
          envName: "TEST_BOOL",
          default: false,
          type: "boolean",
        },
      };

      // Test true values
      process.env.TEST_BOOL = "true";
      expect(config.get("test.bool")).to.be.true;

      process.env.TEST_BOOL = "false";
      expect(config.get("test.bool")).to.be.false;

      // Test with actual boolean
      config.configurations = { "test.bool": true };
      expect(config.get("test.bool")).to.be.true;
    });

    it("should handle number conversion correctly", () => {
      const config = new configurationModule.Configuration();

      config.options = {
        "test.number": {
          name: "test.number",
          envName: "TEST_NUMBER",
          default: 0,
          type: "number",
        },
      };

      process.env.TEST_NUMBER = "123";
      expect(config.get("test.number")).to.equal(123);

      process.env.TEST_NUMBER = "0";
      expect(config.get("test.number")).to.equal(0);

      // Test with actual number
      config.configurations = { "test.number": 456 };
      expect(config.get("test.number")).to.equal(456);
    });

    it("should handle string array conversion correctly", () => {
      const config = new configurationModule.Configuration();

      config.options = {
        "test.array": {
          name: "test.array",
          envName: "TEST_ARRAY",
          default: [],
          type: "stringArray",
        },
      };

      process.env.TEST_ARRAY = "value1,value2,value3";
      expect(config.get("test.array")).to.deep.equal(["value1", "value2", "value3"]);

      process.env.TEST_ARRAY = "";
      expect(config.get("test.array")).to.deep.equal([]);

      // Test with actual array
      config.configurations = { "test.array": ["item1", "item2"] };
      expect(config.get("test.array")).to.deep.equal(["item1", "item2"]);
    });

    it("should handle custom delimiters", () => {
      const config = new configurationModule.Configuration();

      config.options = {
        "test.custom": {
          name: "test.custom",
          envName: "TEST_CUSTOM",
          default: [],
          type: "stringArray",
        },
      };

      process.env.TEST_CUSTOM = "a|b|c";
      expect(config.get("test.custom", undefined, "|")).to.deep.equal(["a", "b", "c"]);
    });

    it("should handle unknown options", () => {
      const config = new configurationModule.Configuration();
      config.options = {};

      expect(config.get("unknown.option")).to.be.undefined;
      expect(config.get("unknown.option", "default")).to.equal("default");
    });

    it("should set environment variables correctly", () => {
      const config = new configurationModule.Configuration();

      config.options = {
        "test.set": {
          name: "test.set",
          envName: "TEST_SET",
          default: "default",
          type: "string",
        },
      };

      config.set("test.set", "newvalue");
      expect(process.env.TEST_SET).to.equal("newvalue");

      config.set("test.set", 123);
      expect(process.env.TEST_SET).to.equal("123");
    });

    it("should prioritize configuration file over environment variables", () => {
      const config = new configurationModule.Configuration();

      config.options = {
        "test.priority": {
          name: "test.priority",
          envName: "TEST_PRIORITY",
          default: "default",
          type: "string",
        },
      };

      process.env.TEST_PRIORITY = "env-value";
      config.configurations = { "test.priority": "config-value" };

      expect(config.get("test.priority")).to.equal("config-value");
    });
  });
});

