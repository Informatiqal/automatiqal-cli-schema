import fs from "fs";

// TODO: too much is happening here. Split it at some point
async function generateRunbookSchema() {
  const placeholder = JSON.parse(
    fs.readFileSync("./src/runbook_placeholder.json")
  );

  placeholder.properties.tasks = {
    $ref: "#/definitions/tasks",
  };
  placeholder.definitions.tasks.items["anyOf"] = [];

  const definitionFiles = fs.readdirSync("./src/definitions");

  for (let definition of definitionFiles) {
    const definitionName = definition.replace(".json", "");
    const definitionContent = JSON.parse(
      fs.readFileSync(`./src/definitions/${definition}`)
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

  const utilDefinitionFiles = fs.readdirSync("./src/util");

  for (let util of utilDefinitionFiles) {
    const utilDefinitionName = util.replace(".json", "");
    const utilDefinitionContent = JSON.parse(
      fs.readFileSync(`./src/util/${util}`)
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

  fs.writeFileSync(
    `./schemas/runbook_expanded.json`,
    JSON.stringify(placeholder, null, 4)
  );

  fs.writeFileSync(`./schemas/runbook.json`, JSON.stringify(placeholder));

  return placeholder;
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

async function generateModuleFile(runbookSchema) {
  fs.writeFileSync(
    "./dist/index.js",
    `export const automatiqalSchema=${JSON.stringify(runbookSchema)}`
  );
}

async function appendUISchemaToModule(uiSchema) {
  fs.appendFileSync(
    "./dist/index.js",
    `\n\nexport const automatiqalUISchema=${JSON.stringify(uiSchema)}`
  );
}

function nameToTitle(name) {
  return name
    .split(/(?=[A-Z])/)
    .map((c) => c.charAt(0).toUpperCase() + c.substring(1))
    .join(" ");
}

(async function () {
  const runbookSchema = await generateRunbookSchema();
  await generateModuleFile(runbookSchema);

  // const uiPseudoSchema = await generateUISchema(runbookSchema);
  // await appendUISchemaToModule(uiPseudoSchema);

  console.log("Done");
})();
