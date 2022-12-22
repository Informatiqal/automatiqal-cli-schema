const fs = require("fs");

async function generateRunbookSchema() {
  const placeholder = JSON.parse(
    fs.readFileSync("./src/runbook_placeholder.json")
  );

  placeholder.properties.tasks.items["anyOf"] = [];

  const definitionFiles = fs.readdirSync("./src/definitions");

  for (let definition of definitionFiles) {
    const definitionName = definition.replace(".json", "");
    const definitionContent = JSON.parse(
      fs.readFileSync(`./src/definitions/${definition}`)
    );

    placeholder.properties.tasks.items.anyOf.push({
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

  Object.entries(definitions).map(([name, definition]) => {
    result[name] = {
      description: definition.description,
      fields: {},
    };

    Object.entries(definition.properties)
      .filter(
        (p) =>
          p[0] != "operation" &&
          p[0] != "details" &&
          p[0] != "filter" &&
          p[0] != "source"
      )
      .map((f) => {
        result[name].fields[f[0]] = f[1];
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
              result[name]["details"][detailKey] = detailValue;
            }
          );
        } else {
          Object.entries(definition.properties.details.properties).map(
            ([detailKey, detailValue]) => {
              result[name]["details"][detailKey] = detailValue;

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
}

(async function () {
  const runbookSchema = await generateRunbookSchema();
  await generateUISchema(runbookSchema);

  console.log("Done");
})();
