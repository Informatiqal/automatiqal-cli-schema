import Ajv from "ajv";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import {
  automatiqalSaaSSchema,
  automatiqalWindowsSchema,
} from "../dist/index.js";
import ajvErrors from "ajv-errors";

let ajv;
let errors = [];
let warnings = [];
let validate;
let validate1;

describe("Automatiqal Schema Tests", function () {
  beforeAll(async () => {
    ajv = new Ajv({
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
    // require("ajv-errors")(ajv /*, {singleError: true} */);
    ajvErrors(ajv);

    validate = ajv.compile(automatiqalWindowsSchema);
    // validate1 = ajv.compile(automatiqalSaaSSchema);
  });

  it("Test", async () => {
    const baseRunbook = {
      name: "Test",
      description: "Testing runbook",
      edition: "windows",
      trace: "debug",
      constants: {
        appName: "Big app",
        appNames: {
          "Big app": 1,
          "Another big app": 1,
        },
        another: "asd123",
        "yet another": true,
        weighted: {
          "SENSE-APR-2019": 1,
        },
      },
      environment: [
        {
          host: "aaa",
          name: "sense19",
          default: true,
          port: 4242,
          authentication: {
            user_dir: "SENSE-APR-2019",
            user_name: "vagrant",
            cert: "",
            key: "",
          },
        },
        {
          host: "aaa",
          name: "sense19-1",
          port: 4242,
          authentication: {
            user_dir: "SENSE-APR-2019",
            user_name: "vagrant",
            cert: "",
            key: "",
          },
        },
      ],
      tasks: [
        {
          name: "whatever",
          operation: "app.get",
          filter: "name eq '${appNames}'",
          options: {
            multiple: true,
            allowZero: true,
          },
        },
      ],
    };

    const validFilterRunbook = JSON.parse(JSON.stringify(baseRunbook));
    const inValidResult1: boolean = validate(validFilterRunbook);

    const a = validate.errors;

    expect(validate.errors.length).to.be.equal(
      0,
      `ERRORS: \n\n ${validate.errors.join("\n")}`
    );
    expect(validate.warnings.length).to.be.equal(
      0,
      `WARNINGS: \n\n${validate.warnings.join("\n")}`
    );
  });

  it("No schema errors or warnings", async () => {
    expect(errors.length).to.be.equal(0, `ERRORS: \n\n ${errors.join("\n")}`);
    expect(warnings.length).to.be.equal(
      0,
      `WARNINGS: \n\n${warnings.join("\n")}`
    );
  });

  // TODO: split into multiple tests
  it("OneOf test", async () => {
    const baseRunbook = {
      name: "Test",
      description: "Testing runbook",
      edition: "windows",
      trace: "debug",
      environment: {
        host: `some-host`,
        port: 4242,
        authentication: {
          user_dir: `SOME_DIRECTORY`,
          user_name: `SOME_USER`,
          cert: "",
          key: "",
        },
      },
      tasks: [],
    };

    // task containing only filter
    const validFilterRunbook = JSON.parse(JSON.stringify(baseRunbook));
    (validFilterRunbook.tasks as any).push({
      name: "Test multiple",
      operation: "app.remove",
      filter: "name sw '_temp('",
      options: {
        multiple: false,
      },
    });

    const validResult1: boolean = validate(validFilterRunbook);

    // task containing only source
    const validSourceRunbook = JSON.parse(JSON.stringify(baseRunbook));
    (validSourceRunbook.tasks as any).push({
      name: "Test multiple",
      operation: "app.remove",
      filter: "name sw '_temp('",
      options: {
        multiple: false,
      },
    });

    const validResult2: boolean = validate(validFilterRunbook);

    // task containing only source
    const inValidBothRunbook1 = JSON.parse(JSON.stringify(baseRunbook));
    (inValidBothRunbook1.tasks as any).push({
      name: "Test multiple",
      operation: "app.remove",
      filter: "name sw '_temp('",
      source: "Some other task",
      options: {
        multiple: false,
      },
    });

    const inValidResult1: boolean = validate(inValidBothRunbook1);

    // task without filter and source
    const inValidBothRunbook2 = JSON.parse(JSON.stringify(baseRunbook));
    (inValidBothRunbook2.tasks as any).push({
      name: "Test multiple",
      operation: "app.remove",
      filter: "name sw '_temp('",
      source: "Some other task",
      options: {
        multiple: false,
      },
    });

    const inValidResult2: boolean = validate(inValidBothRunbook2);

    // task without filter and source - VALID
    const validNoSourceRunbook = JSON.parse(JSON.stringify(baseRunbook));
    (validNoSourceRunbook.tasks as any).push({
      name: "Test multiple",
      operation: "app.switch",
      details: {
        targetAppId: "some-app-id",
      },
    });

    const validResult3: boolean = validate(validNoSourceRunbook);

    expect(validResult1).to.be.true;
    expect(validResult2).to.be.true;
    expect(validResult3).to.be.true;
    expect(inValidResult1).to.be.false;
    expect(inValidResult2).to.be.false;
  });
});
