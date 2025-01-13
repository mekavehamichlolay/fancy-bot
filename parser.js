/**
 * gets all the templates in a text
 * @param {String} text
 * @param {String} [name]
 * @returns {Template[]}
 */
export function getTemplates(text, name) {
  if (!text) return [];
  const templates = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{" || text[i + 1] !== "{") {
      i++;
      continue;
    }
    const [template, newP] = extractTemplate(text, i);
    if (i >= newP) {
      i++;
    } else {
      i = newP;
    }
    if (name && template.name !== name) {
      continue;
    }
    templates.push(template);
  }
  return templates;
}

/**
 * defines a template
 * @typedef {Object} Template
 * @property {String} name
 * @property {{[String]:String}} parameters
 * @property {String[]} anonParameters
 * @property {String} fullText
 */

/**
 * tupples a template with the position after the end of the template
 * @typedef {[Template,Number]} ExtractedTemplate
 */

/**
 * extracts a template from a text given a position in the text and returns the template and the new position
 * @param {String} text
 * @param {Number} position of the first braces of the template
 * @returns {ExtractedTemplate}
 * @throws {Error} if the position does not exist
 * @throws {Error} if the template does not start with {{
 * @throws {Error} if the template has no name
 * @throws {Error} if the template is not closed
 */
export function extractTemplate(text, position) {
  if (!text[position] || !text[position + 1]) {
    throw new Error(errorMessages.notExistingPosition);
  }
  const template = {
    name: "",
    parameters: {},
    anonParameters: [],
    fullText: "",
  };
  if (text[position] !== "{" || text[position + 1] !== "{") {
    throw new Error(errorMessages.invalidTemplateStart);
  }
  position += 2;
  template.fullText += "{{";
  if (position >= text.length) {
    throw new Error(errorMessages.notExistingPosition);
  }
  for (; position < text.length; position++) {
    if (
      text[position] === "|" ||
      text[position] === "}" ||
      text[position] === "\n"
    ) {
      break;
    }
    template.name += text[position];
    template.fullText += text[position];
  }
  template.name = template.name.trim();
  if (!template.name) {
    throw new Error(errorMessages.noTemplateName);
  }
  while (text[position] !== "}" || text[position + 1] !== "}") {
    if (position >= text.length) {
      throw new Error(errorMessages.unclosedTemplate);
    }
    if (text[position] === "\n" || text[position] === " ") {
      template.fullText += text[position];
      position++;
      continue;
    }
    if (text[position] === "|") {
      let nestingLevel = 0;
      template.fullText += "|";
      position++;
      let param = "";
      while (
        (text[position] !== "=" &&
          text[position] !== "|" &&
          text[position] !== "}") ||
        nestingLevel > 0
      ) {
        if (position >= text.length) {
          throw new Error(errorMessages.unclosedTemplate);
        }
        if (
          (text[position] === "{" && text[position + 1] === "{") ||
          (text[position] === "[" && text[position + 1] === "[")
        ) {
          nestingLevel++;
          template.fullText += text[position] + text[position + 1];
          param += text[position] + text[position + 1];
          position += 2;
        } else if (
          (text[position] === "}" && text[position + 1] === "}") ||
          (text[position] === "]" && text[position + 1] === "]")
        ) {
          nestingLevel--;
          template.fullText += text[position] + text[position + 1];
          param += text[position] + text[position + 1];
          position += 2;
        } else {
          template.fullText += text[position];
          param += text[position];
          position++;
        }
      }
      if (text[position] === "=") {
        position++;
        template.fullText += "=";
        let data = "";
        while (
          (text[position] !== "|" && text[position] !== "}") ||
          nestingLevel > 0
        ) {
          if (position >= text.length) {
            throw new Error(errorMessages.unclosedTemplate);
          }
          if (
            (text[position] === "{" && text[position + 1] === "{") ||
            (text[position] === "[" && text[position + 1] === "[")
          ) {
            nestingLevel++;
            data += text[position] + text[position + 1];
            template.fullText += text[position] + text[position + 1];
            position += 2;
          } else if (
            (text[position] === "}" && text[position + 1] === "}") ||
            (text[position] === "]" && text[position + 1] === "]")
          ) {
            nestingLevel--;
            data += text[position] + text[position + 1];
            template.fullText += text[position] + text[position + 1];
            position += 2;
          } else {
            data += text[position];
            template.fullText += text[position];
            position++;
          }
        }
        if (!param.trim()) {
          template.anonParameters.push(data.trim());
        } else if (
          template.parameters[param.trim()] &&
          !Array.isArray(template.parameters[param.trim()])
        ) {
          template.parameters[param.trim()] = [
            template.parameters[param.trim()],
            data.trim(),
          ];
        } else if (
          template.parameters[param.trim()] &&
          Array.isArray(template.parameters[param.trim()])
        ) {
          template.parameters[param.trim()].push(data.trim());
        } else {
          template.parameters[param.trim()] = data.trim();
        }
      } else if (text[position] === "|" || text[position] === "}") {
        template.anonParameters.push(param.trim());
      }
      continue;
    }
    if (text[position] === "}") {
      throw new Error(errorMessages.unclosedTemplate);
    }
  }
  template.fullText += "}}";
  return [template, position + 2];
}

export const errorMessages = {
  invalidTemplateStart: "Invalid template start",
  notExistingPosition: "Position does not exist",
  unclosedTemplate: "The template is missing closing braces",
};
