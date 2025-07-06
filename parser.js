/**
 * gets all the templates in a text
 * @param {String} text
 * @param {Object} [options]
 * @param {String} [options.name] - if set, only templates with this name
 * @param {Boolean} [options.nested=false] - if true, it will extract nested templates
 * @param {Boolean} [options.multi=false] - if true, it will return all templates with the given name, otherwise it will return only the first one
 * @returns {Template[]}
 */
export function getTemplates(text, options) {
  if (!text) return [];
  if (options && typeof options !== "object") {
    throw new Error(errorMessages.invalidParameter);
  }
  const { name, nested = false, multi = false } = options || {};
  const templates = [];
  let i = 0;
  let comment = false;
  let math = false;
  while (i < text.length) {
    if (text[i] === "<" && text[i + 1] === "!" && text[i + 2] === "-") {
      comment = true;
      i += 3;
      continue;
    } else if (
      comment &&
      text[i] === "-" &&
      text[i + 1] === "-" &&
      text[i + 2] === ">"
    ) {
      comment = false;
      i += 3;
      continue;
    } else if (
      text[i] === "<" &&
      text[i + 1] === "m" &&
      text[i + 2] === "a" &&
      text[i + 3] === "t" &&
      text[i + 4] === "h" &&
      text[i + 5] === ">"
    ) {
      math = true;
      i += 6;
      continue;
    } else if (
      math &&
      text[i] === "<" &&
      text[i + 1] === "/" &&
      text[i + 2] === "m" &&
      text[i + 3] === "a" &&
      text[i + 4] === "t" &&
      text[i + 5] === "h" &&
      text[i + 6] === ">"
    ) {
      math = false;
      i += 7;
      continue;
    }
    if (comment || math) {
      i++;
      continue;
    }
    if (text[i] !== "{" || text[i + 1] !== "{") {
      i++;
      continue;
    }
    const [template, newP] = !nested
      ? extractTemplate(text, i)
      : extractNestedtemplates(text, i);
    if (i >= newP) {
      i++;
    } else {
      i = newP;
    }
    if (
      name &&
      template.name !== name &&
      (!nested || !template.nested.length)
    ) {
      continue;
    } else if (name && (template.name === name || nested)) {
      if (template.name === name && !multi) {
        templates.push(template);
        return templates;
      }
      if (nested || multi) {
        if (!template.nested) {
          continue;
        }
        if (!multi) {
          const found = findNestedTemplate(template, name);
          if (found) {
            templates.push(found);
            return templates;
          }
          continue;
        }
        const nestedTemplates = flattenNestedTemplates(template, name);
        if (nestedTemplates.length) {
          templates.push(...nestedTemplates);
        }
        continue;
      }
    }
    templates.push(template);
  }
  return templates;
}

/**
 *
 * @param {NestedTemplate} template
 * @param {string} name
 * @returns {NestedTemplate|null}
 */
function findNestedTemplate(template, name) {
  if (template.name === name) {
    return template;
  }
  if (!template.nested?.length) {
    return null;
  }
  for (const nested of template.nested) {
    const found = findNestedTemplate(nested, name);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 *
 * @param {Template} template
 * @param {string} [name]
 * @param {NestedTemplate[]} [templates]
 * @returns {NestedTemplate[]}
 */
function flattenNestedTemplates(template, name, templates = []) {
  if (template.nested?.length) {
    for (const nested of template.nested) {
      flattenNestedTemplates(nested, name, templates);
    }
  }
  if (name && template.name !== name) {
    return templates;
  }
  templates.push(template);
  return templates;
}
/**
 * defines a template
 * @typedef {Object} Template
 * @property {String} name
 * @property {Object.<string, string>} parameters
 * @property {String[]} anonParameters
 * @property {String} fullText
 */

/**
 * defines a template with nested templates
 * @typedef {Template & {nested: Template[]}} NestedTemplate
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
          (text[position] !== "}" || text[position + 1] !== "}")) ||
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
          (text[position] !== "|" &&
            (text[position] !== "}" || text[position + 1] !== "}")) ||
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
      } else if (
        text[position] === "|" ||
        (text[position] === "}" && text[position + 1] === "}")
      ) {
        template.anonParameters.push(param.trim());
      }
      continue;
    }
    throw new Error(errorMessages.unclosedTemplate);
  }
  template.fullText += "}}";
  return [template, position + 2];
}

/**
 *
 * @param {string} text
 * @param {number} position
 * @returns {[NestedTemplate, number]}
 */
export function extractNestedtemplates(text, position) {
  if (!text[position] || !text[position + 1]) {
    throw new Error(errorMessages.notExistingPosition);
  }
  const template = {
    name: "",
    parameters: {},
    anonParameters: [],
    fullText: "",
    nested: [],
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
          (text[position] !== "}" || text[position + 1] !== "}")) ||
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
          if (text[position] === "{" && text[position + 1] === "{") {
            const [nestedTemplate, newPosition] = extractNestedtemplates(
              text,
              position
            );
            template.nested.push(nestedTemplate);
            template.fullText += nestedTemplate.fullText;
            param += nestedTemplate.fullText;
            nestingLevel--;
            if (newPosition <= position) {
              throw new Error(
                "position did not grow as expected, entering infinate loop"
              );
            }
            position = newPosition;
            continue;
          }
          template.fullText += text[position] + text[position + 1];
          param += text[position] + text[position + 1];
          position += 2;
        } else if (text[position] === "]" && text[position + 1] === "]") {
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
          (text[position] !== "|" &&
            (text[position] !== "}" || text[position + 1] !== "}")) ||
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
            if (text[position] === "{" && text[position + 1] === "{") {
              const [nestedTemplate, newPosition] = extractNestedtemplates(
                text,
                position
              );
              template.nested.push(nestedTemplate);
              template.fullText += nestedTemplate.fullText;
              data += nestedTemplate.fullText;
              nestingLevel--;
              if (newPosition <= position) {
                throw new Error(
                  "position did not grow as expected, entering infinate loop"
                );
              }
              position = newPosition;
              continue;
            }
            data += text[position] + text[position + 1];
            template.fullText += text[position] + text[position + 1];
            position += 2;
          } else if (text[position] === "]" && text[position + 1] === "]") {
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
      } else if (
        text[position] === "|" ||
        (text[position] === "}" && text[position + 1] === "}")
      ) {
        template.anonParameters.push(param.trim());
      }
      continue;
    }
    throw new Error(errorMessages.unclosedTemplate);
  }
  template.fullText += "}}";
  return [template, position + 2];
}

export const errorMessages = {
  invalidTemplateStart: "Invalid template start",
  notExistingPosition: "Position does not exist",
  unclosedTemplate: "The template is missing closing braces",
  invalidParameter: "Invalid parameter",
};
