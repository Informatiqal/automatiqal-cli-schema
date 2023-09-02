# Automatiqal CLI (JSON schema)

## UNDER DEVELOPMENT

This repository contains JSON schema that can be used when writing [Automatiqal CLI](https://github.com/Informatiqal/automatiqal-cli) runbooks.

## Installation

```shell
npm install --save @informatiqal/automatiqal-schema
```

### Exports

The package exports three constants:

- `automatiqalWindowsSchema` - valid [JSON schema (Draft-07)](https://json-schema.org/) for interacting with QSEoW
- `automatiqalSaaSSchema` - valid [JSON schema (Draft-07)](https://json-schema.org/) for interacting with Qlik Cloud/SaaS
- `automatiqalUISchema` - pseudo schema that can be used in UI projects. **This is not a valid JSON schema** and its under development so please do not use

## VSCode

First make sure you have [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension installed. This extension will give YAML language support in VSCode

After that there are two ways to use the schema: inline (local) and as user setting (global).

### **Inline**

Inline method is applied to each individual yaml runbook file.

Add the following line to the top of the runbook yaml file:

- for QSEoW
    `# yaml-language-server: $schema=https://github.com/Informatiqal/automatiqal-cli-schema/blob/main/schemas/runbook.json?raw=true`

- for SaaS
    `# yaml-language-server: $schema=https://github.com/Informatiqal/automatiqal-cli-schema/blob/main/schemas/runbook_saas.json?raw=true`

Or if the schema is downloaded locally:

`# yaml-language-server: $schema=c:\path\to\runbook.json`

### **User settings**

- `Ctrl + Shift + p`
- search for `Preferences: Open User Settings`
- search for `schema`
- click on `JSON`
- click on `Edit in settings.json` (`JSON: Schemas` section)
- add new entry

  ```json
  {
    "fileMatch": ["/*.something.yaml"],
    "url": "https://github.com/Informatiqal/automatiqal-cli-schema/blob/main/schemas/runbook.json?raw=true"
  }
  ```

  `*.something.yaml` - the schema in this case will be applied to all files that have `something.yaml` in their name. Replace `something` with whatever you want.
