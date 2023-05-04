import Ajv from "ajv";
import { describe, it, expect } from "vitest";
import { automatiqalSchema } from "../dist/index.js";

describe("Automatiqal Schema Tests", function () {
  it("No schema errors or warnings", async () => {
    const warnings = [];
    const errors = [];

    const ajv = new Ajv({
      allErrors: true,
      strict: "log",
      // until https://github.com/ajv-validator/ajv/issues/1571 is resolved
      allowUnionTypes: true,
      strictRequired: "log",
      logger: {
        log: console.log.bind(console),
        warn: (a: never) => {
          warnings.push(a);
        },
        error: (a: never) => {
          errors.push(a);
        },
      },
    });

    const validate = ajv.compile(automatiqalSchema);

    expect(errors.length).to.be.equal(0, `ERRORS: \n\n ${errors.join("\n")}`) &&
      expect(warnings.length).to.be.equal(
        0,
        `WARNINGS: \n\n${warnings.join("\n")}`
      );
  });
});
