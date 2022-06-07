const fs = require("fs");
const { definitions } = require("./schemas/runbook.json");

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
    // const realRequired = definition.required.filter(
    //   (f) => f != "operation" && f != "details"
    // );

    // realRequired.forEach((el) => {
    //   if (result[name].fields[el]) result[name].fields[el]["required"] = true;
    // });

    Object.entries(result[name].fields).map(([k, v]) => {
      if (definition.required.includes(k))
        result[name].fields[k]["required"] = true;
    });

    if (definition.properties.details) {
      result[name]["details"] = {};
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

    if (definition.properties.filter && definition.properties.source)
      result[name]["filterAndSource"] = true;

    if (definition.properties.filter && !definition.properties.source)
      result[name]["filterOnly"] = true;

    if (!definition.properties.filter && definition.properties.source)
      result[name]["sourceOnly"] = true;
  }
});
runbook.tasks = { ...result };
fs.writeFileSync("./schemas/ui_schema.json", JSON.stringify(runbook, null, 4));
