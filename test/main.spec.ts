import Ajv from "ajv";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { automatiqalSchema } from "../dist/index.js";

let ajv;
let errors = [];
let warnings = [];
let validate;

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

    validate = ajv.compile(automatiqalSchema);
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
