import fs from "fs";

// TODO: most of it is copy/paste. generalize it please
async function generateSaaSRunbookSchema() {
  const placeholder = JSON.parse(
    fs.readFileSync("./src/runbook_placeholder_saas.json")
  );

  placeholder.properties.tasks = {
    $ref: "#/definitions/tasks",
  };
  placeholder.definitions.tasks.items["anyOf"] = [];

  const definitionFiles = fs.readdirSync("./src/SaaS/definitions");

  for (let definition of definitionFiles) {
    const definitionName = definition.replace(".json", "");
    let definitionContent = JSON.parse(
      fs.readFileSync(`./src/SaaS/definitions/${definition}`)
    );

    // some (most) of the definitions will be same as QSEoW ones
    // and instead of duplicate the QSEoW definitions
    // just put reference to the QSEoW definition and load it form there
    if (definitionContent["#reference#"])
      definitionContent = JSON.parse(
        fs.readFileSync(
          `./src/QSEoW/definitions/${definitionContent["#reference#"]}.json`
        )
      );

    definitionContent.properties["description"] = {
      type: "string",
      description: "Task description (multiline is supported)",
    };

    definitionContent.properties.onError = {
      $ref: `#/definitions/onError`,
    };

    placeholder.definitions.tasks.items.anyOf.push({
      $ref: `#/definitions/${definitionName}`,
    });

    placeholder.definitions[definitionName] = definitionContent;
  }

  // no utils for SaaS ... yet
  // const utilDefinitionFiles = fs.readdirSync("./src/QSEoW/util");

  placeholder.definitions["OneOf_1"] = {
    type: "object",
    properties: {
      filter: {
        type: "string",
      },
    },
    required: ["filter"],
    not: {
      properties: {
        source: {
          type: "string",
        },
      },
      required: ["source"],
    },
  };

  placeholder.definitions["OneOf_2"] = {
    type: "object",
    properties: {
      source: {
        type: "string",
      },
    },
    required: ["source"],
    not: {
      required: ["filter"],
    },
  };

  placeholder.definitions["onError"] = {
    // type: "object",
    oneOf: [
      {
        type: "object",
        properties: {
          tasks: {
            $ref: "#/definitions/tasks",
          },
        },
        required: ["tasks"],
      },
      {
        type: "object",
        properties: {
          exit: {
            type: "boolean",
          },
        },
        required: ["exit"],
      },
      {
        type: "object",
        properties: {
          ignore: {
            type: "boolean",
          },
        },
        required: ["ignore"],
      },
    ],
  };

  placeholder.definitions["TaskName"] = definitionTaskNameProperty();

  fs.writeFileSync(
    `./schemas/runbook_saas_expanded.json`,
    JSON.stringify(placeholder, null, 4)
  );

  fs.writeFileSync(`./schemas/runbook_saas.json`, JSON.stringify(placeholder));

  return placeholder;
}

// TODO: too much is happening here. Split it at some point
async function generateWindowsRunbookSchema() {
  const placeholder = JSON.parse(
    fs.readFileSync("./src/runbook_placeholder.json")
  );

  // const loopProperty = JSON.parse(fs.readFileSync("./src/QSEoW/util/Loop.json"));

  placeholder.properties.tasks = {
    $ref: "#/definitions/tasks",
  };
  placeholder.definitions.tasks.items["anyOf"] = [];

  const definitionFiles = fs.readdirSync("./src/QSEoW/definitions");

  for (let definition of definitionFiles) {
    const definitionName = definition.replace(".json", "");
    const definitionContent = JSON.parse(
      fs.readFileSync(`./src/QSEoW/definitions/${definition}`)
    );

    if (definitionContent.properties) {
      definitionContent.properties["description"] = {
        type: "string",
        description: "Task description (multiline is supported)",
      };

      definitionContent.properties["loop"] = { $ref: `#/definitions/Loop` }

      definitionContent.properties.onError = {
        $ref: `#/definitions/onError`,
      };
    }

    placeholder.definitions.tasks.items.anyOf.push({
      $ref: `#/definitions/${definitionName}`,
    });

    if (definitionContent.properties &&
      definitionContent.properties.options &&
      !definitionContent.properties.options.hasOwnProperty("$ref")) {
      definitionContent.properties.options.properties["loopParallel"] = { type: "boolean" }
    }

    placeholder.definitions[definitionName] = definitionContent;
  }

  const utilDefinitionFiles = fs.readdirSync("./src/QSEoW/util");

  for (let util of utilDefinitionFiles) {
    const utilDefinitionName = util.replace(".json", "");
    const utilDefinitionContent = JSON.parse(
      fs.readFileSync(`./src/QSEoW/util/${util}`)
    );

    placeholder.definitions[utilDefinitionName] = utilDefinitionContent;
  }

  placeholder.definitions["OneOf_1"] = {
    type: "object",
    properties: {
      filter: {
        type: "string",
      },
    },
    required: ["filter"],
    not: {
      properties: {
        source: {
          type: "string",
        },
      },
      required: ["source"],
    },
  };

  placeholder.definitions["OneOf_2"] = {
    type: "object",
    properties: {
      source: {
        type: "string",
      },
    },
    required: ["source"],
    not: {
      required: ["filter"],
    },
  };

  placeholder.definitions["Tasks_Without_Import"] = {
    type: "array",
    minItems: 1,
    items: {
      anyOf: placeholder.definitions.tasks.items.anyOf.filter(d => d["$ref"] !=
        "#/definitions/include",
      )
    }
  }

  placeholder.definitions["onError"] = {
    // type: "object",
    oneOf: [
      {
        type: "object",
        properties: {
          tasks: {
            $ref: "#/definitions/Tasks_Without_Import",
          },
        },
        required: ["tasks"],
      },
      {
        type: "object",
        properties: {
          exit: {
            type: "boolean",
          },
        },
        required: ["exit"],
      },
      {
        type: "object",
        properties: {
          ignore: {
            type: "boolean",
          },
        },
        required: ["ignore"],
      },
    ],
  };

  placeholder.definitions["DaysOfWeek"] = definitionDaysOfWeek();
  placeholder.definitions["DaysOfMonth"] = definitionDaysOfMonth();
  placeholder.definitions["TimeZones"] = definitionDaysTimeZones();
  placeholder.definitions["TaskName"] = definitionTaskNameProperty();

  fs.writeFileSync(
    `./schemas/runbook_expanded.json`,
    JSON.stringify(placeholder, null, 4)
  );

  fs.writeFileSync(`./schemas/runbook.json`, JSON.stringify(placeholder));

  return placeholder;
}

async function generateImportWindowsSchema(generatedSchemaQSEoW) {
  delete generatedSchemaQSEoW["additionalProperties"];
  delete generatedSchemaQSEoW["properties"];
  delete generatedSchemaQSEoW["required"];

  generatedSchemaQSEoW["title"] = "JSON Schema for Automatiqal external runbook files";
  generatedSchemaQSEoW["description"] = "Automatiqal only tasks JSON schema (@informatiqal)";
  generatedSchemaQSEoW["minItems"] = 1;
  generatedSchemaQSEoW["type"] = "array";
  generatedSchemaQSEoW["items"] = {
    anyOf: generatedSchemaQSEoW.definitions.tasks.items.anyOf
  };

  delete generatedSchemaQSEoW.definitions.tasks

  fs.writeFileSync(
    `./schemas/tasks_only_expanded.json`,
    JSON.stringify(generatedSchemaQSEoW, null, 4)
  );

  fs.writeFileSync(`./schemas/tasks_only.json`, JSON.stringify(generatedSchemaQSEoW));
}

async function generateUISchema(runbookSchema) {
  const definitions = runbookSchema.definitions;

  // delete utility/common definitions
  // these definitions are not UI elements
  const utilityDefinitions = ["AddRemoveSet"];
  utilityDefinitions.forEach((def) => {
    delete definitions[def];
  });

  const runbook = {
    general: {
      name: {
        description: "Name of the runbook",
        type: "string",
      },
      description: {
        type: "string",
        description: "Free text runbook description",
      },
      edition: {
        description:
          'Target Qlik Sense environment type - windows or saas. Default is "windows"',
        type: "string",
      },
      trace: {
        description: "Trace levels",
        type: "string",
      },
    },
    tasks: {},
  };

  let result = {};

  // TODO: capture anyOf and oneOf
  Object.entries(definitions)
    .filter((d) => d[0] != "tasks")
    .map(([name, definition]) => {
      result[name] = {
        description: definition.description,
        fields: {},
      };

      let properties = definition.properties;

      if (name == "tasks") {
        properties = runbookSchema.definitions.tasks;
      }

      Object.entries(properties)
        .filter(
          (p) =>
            p[0] != "operation" &&
            p[0] != "details" &&
            p[0] != "filter" &&
            p[0] != "source"
        )
        .map((f) => {
          result[name].fields[f[0]] = { ...f[1], title: nameToTitle(f[0]) };
        });

      if (definition.required) {
        Object.entries(result[name].fields).map(([k, v]) => {
          if (definition.required.includes(k))
            result[name].fields[k]["required"] = true;
        });

        if (definition.properties.details) {
          result[name]["details"] = {};

          if (
            definition.properties.details.type &&
            definition.properties.details.type == "array"
          ) {
            Object.entries(definition.properties.details.items).map(
              ([detailKey, detailValue]) => {
                result[name]["details"][detailKey] = {
                  ...detailValue,
                  title: nameToTitle(detailKey),
                };
              }
            );
          } else {
            Object.entries(definition.properties.details.properties).map(
              ([detailKey, detailValue]) => {
                result[name]["details"][detailKey] = {
                  ...detailValue,
                  title: nameToTitle(detailKey),
                };

                if (
                  definition.properties.details.required &&
                  definition.properties.details.required.includes(detailKey)
                ) {
                  result[name]["details"][detailKey]["required"] = true;
                }
              }
            );
          }
        }

        if (definition.properties.options) {
          if (definition.properties.options["$ref"]) {
            definition.properties.options =
              runbookSchema.definitions[
              definition.properties.options["$ref"].replace(
                "#/definitions/",
                ""
              )
              ];
          }

          result[name]["options"] = {};

          if (
            definition.properties.options.type &&
            definition.properties.options.type == "array"
          ) {
            Object.entries(definition.properties.options.items).map(
              ([detailKey, detailValue]) => {
                result[name]["options"][detailKey] = {
                  ...detailValue,
                  title: nameToTitle(detailKey),
                };
              }
            );
          } else {
            Object.entries(definition.properties.options.properties).map(
              ([detailKey, detailValue]) => {
                // TODO: not great :(
                if (
                  detailValue["$ref"] &&
                  detailValue["$ref"] == "#/definitions/AddRemoveSet"
                ) {
                  detailValue = {
                    type: "string",
                    enum: ["add", "remove", "set"],
                  };
                }

                result[name]["options"][detailKey] = {
                  ...detailValue,
                  title: nameToTitle(detailKey),
                };

                if (
                  definition.properties.options.required &&
                  definition.properties.options.required.includes(detailKey)
                ) {
                  result[name]["options"][detailKey]["required"] = true;
                }
              }
            );
          }

          delete result[name].fields.options;
        }

        if (definition.properties.filter && definition.properties.source)
          result[name]["filterAndSource"] = true;

        if (definition.properties.filter && !definition.properties.source)
          result[name]["filterOnly"] = true;

        if (!definition.properties.filter && definition.properties.source)
          result[name]["sourceOnly"] = true;
      }
    });
  runbook.tasks = { ...result };

  fs.writeFileSync(
    "./schemas/ui_schema_expanded.json",
    JSON.stringify(runbook, null, 4)
  );

  fs.writeFileSync("./schemas/ui_schema.json", JSON.stringify(runbook));

  return runbook;
}

async function appendUISchemaToModule(uiSchema) {
  fs.appendFileSync(
    "./dist/index.js",
    `\n\nexport const automatiqalUISchema=${JSON.stringify(uiSchema)}`
  );
}

async function generateModuleFile(windowsSchema, saasSchema) {
  fs.writeFileSync(
    "./dist/index.js",
    `export const automatiqalWindowsSchema=${JSON.stringify(
      windowsSchema
    )};export const automatiqalSaaSSchema=${JSON.stringify(saasSchema)};
    `
  );

  // fs.writeFileSync(
  //   "./dist/index.js",
  //   `export const automatiqalWindowsSchema=${JSON.stringify(
  //     windowsSchema
  //   )};
  //   `
  // );
}

function nameToTitle(name) {
  return name
    .split(/(?=[A-Z])/)
    .map((c) => c.charAt(0).toUpperCase() + c.substring(1))
    .join(" ");
}

function definitionDaysOfWeek() {
  return {
    type: "array",
    items: {
      type: "string",
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
  };
}

function definitionDaysOfMonth() {
  return {
    type: "array",
    items: {
      type: "integer",
      enum: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      ],
    },
  };
}

function definitionDaysTimeZones() {
  return {
    type: "string",
    enum: [
      "Pacific/Honolulu",
      "America/Anchorage",
      "America/Los_Angeles",
      "America/Denver",
      "America/Mazatlan",
      "America/Phoenix",
      "America/Belize",
      "America/Chicago",
      "America/Mexico_City",
      "America/Regina",
      "America/Bogota",
      "America/Indianapolis",
      "America/New_York",
      "America/Caracas",
      "America/Halifax",
      "America/St_Johns",
      "America/Buenos_Aires",
      "America/Godthab",
      "America/Santiago",
      "America/Sao_Paulo",
      "Atlantic/South_Georgia",
      "Atlantic/Azores",
      "Atlantic/Cape_Verde",
      "UTC",
      "Atlantic/Reykjavik",
      "Africa/Casablanca",
      "Europe/Dublin",
      "Europe/Belgrade",
      "Europe/Paris",
      "Europe/Warsaw",
      "Africa/Cairo",
      "Africa/Harare",
      "Asia/Jerusalem",
      "Europe/Athens",
      "Europe/Bucharest",
      "Europe/Helsinki",
      "Africa/Nairobi",
      "Asia/Baghdad",
      "Asia/Kuwait",
      "Europe/Minsk",
      "Europe/Moscow",
      "Asia/Tehran",
      "Asia/Baku",
      "Asia/Muscat",
      "Asia/Kabul",
      "Asia/Karachi",
      "Asia/Yekaterinburg",
      "Asia/Calcutta",
      "Asia/Colombo",
      "Asia/Katmandu",
      "Asia/Almaty",
      "Asia/Dhaka",
      "Asia/Rangoon",
      "Asia/Bangkok",
      "Asia/Krasnoyarsk",
      "Asia/Hong_Kong",
      "Asia/Irkutsk",
      "Asia/Kuala_Lumpur",
      "Asia/Taipei",
      "Australia/Perth",
      "Asia/Seoul",
      "Asia/Tokyo",
      "Asia/Yakutsk",
      "Australia/Adelaide",
      "Australia/Darwin",
      "Asia/Vladivostok",
      "Australia/Brisbane",
      "Australia/Hobart",
      "Australia/Sydney",
      "Pacific/Guam",
      "Pacific/Noumea",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Apia",
      "Pacific/Tongatapu",
    ],
  };
}

function definitionTaskNameProperty() {
  return {
    type: "string",
    description: "Unique name of the task. It should not contain #",
    pattern: "^[^#]*$",
    errorMessage: "Task name should not contain #",
  };
}

(async function () {
  const windowsSchema = await generateWindowsRunbookSchema();
  const saasSchema = await generateSaaSRunbookSchema();
  const taskOnlySchema = await generateImportWindowsSchema(windowsSchema)

  await generateModuleFile(windowsSchema, saasSchema);
  // await generateModuleFile(windowsSchema);

  // const uiPseudoSchema = await generateUISchema(runbookSchema);
  // await appendUISchemaToModule(uiPseudoSchema);

  console.log("Done");
})();
