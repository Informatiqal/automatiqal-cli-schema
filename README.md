# Automatiqal CLI (JSON schema)

This repository contains JSON schema that can be used when writing [Automatiqal CLI](https://github.com/Informatiqal/automatiqal-cli) runbooks.

## VSCode

First make sure you have [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension installed. This extension will give YAML language support in VSCode

After that there are two ways to use the schema: inline (local) and as user setting (global).

### Inline

Inline method is applied to each yaml runbook file.

Add the following line to the top of the runbook yaml file:

`# yaml-language-server: $schema=https://github.com/Informatiqal/automatiqal-cli-schema/blob/main/runbook.json?raw=true`

### User settings

- `Ctrl + Shift + p`
- search for `Preferences: Open User Settings`
- search for `schema`
- click on `JSON`
- click on `Edit in settings.json` (`JSON: Schemas` section)
- add new entry
  ```json
  {
    "fileMatch": ["/*.something.yaml"],
    "url": "https://github.com/Informatiqal/automatiqal-cli-schema/blob/main/runbook.json?raw=true"
  }
  ```
  `*.something.yaml` - the schema in this case will be applied to all files that have `something.yaml` in their name. Replace `something` with whatever you want.
