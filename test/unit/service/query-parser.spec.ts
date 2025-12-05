import { expect } from "chai";
import { QueryParser } from "../../../src/service/query-parser/query-parser.js";
import { Configuration } from "../../../src/singleton/configuration.js";

describe("QueryParser", () => {
  describe("validate", () => {
    const allowedFields = new Set(["firstName", "lastName", "email", "role"]);

    it("should return true for valid simple query", () => {
      const query = { firstName: "John" };
      expect(QueryParser.validate(query, allowedFields)).to.be.true;
    });

    it("should return true for valid operator query", () => {
      const query = { firstName: { $eq: "John" } };
      expect(QueryParser.validate(query, allowedFields)).to.be.true;
    });

    it("should return false for disallowed field", () => {
      const query = { password: "123" };
      expect(QueryParser.validate(query, allowedFields)).to.be.false;
    });

    it("should return false for disallowed operator", () => {
      const query = { firstName: { $where: "this.password == '123'" } };
      expect(QueryParser.validate(query, allowedFields)).to.be.false;
    });

    it("should validate nested logical operators", () => {
      const query = {
        $or: [{ firstName: "John" }, { lastName: "Doe" }],
      };
      expect(QueryParser.validate(query, allowedFields)).to.be.true;
    });

    it("should return false for invalid nested query", () => {
      const query = {
        $or: [{ firstName: "John" }, { password: "123" }],
      };
      expect(QueryParser.validate(query, allowedFields)).to.be.false;
    });
    it("should return false for query exceeding max depth", () => {
      const deepQuery = {
        $or: [
          {
            $and: [
              {
                $or: [
                  {
                    $and: [
                      {
                        $or: [
                          {
                            $and: [
                              {
                                $or: [
                                  {
                                    $and: [
                                      {
                                        $or: [
                                          {
                                            $and: [
                                              {
                                                $or: [{ firstName: "John" }],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(QueryParser.validate(deepQuery, allowedFields)).to.be.false;
    });

    it("should return false for regex exceeding max length", () => {
      const longRegex = "a".repeat(101);
      const query = { firstName: { $regex: longRegex } };
      expect(QueryParser.validate(query, allowedFields)).to.be.false;
    });

    it("should return true for valid regex length", () => {
      const validRegex = "a".repeat(100);
      const query = { firstName: { $regex: validRegex } };
      expect(QueryParser.validate(query, allowedFields)).to.be.true;
    });
  });
});

