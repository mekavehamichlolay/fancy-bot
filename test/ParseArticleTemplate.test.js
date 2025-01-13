import { expect } from "chai";
import { errorMessages, getTemplates } from "../parser.js";

describe("getTemplates", () => {
  it("should be defined", () => {
    expect(getTemplates).to.be.a("function");
  });

  it("should take two parameters", () => {
    expect(getTemplates.length).to.equal(2);
  });

  it("should return an empty array when an empty string is passed", () => {
    expect(getTemplates("")).to.be.an("array").that.is.empty;
  });

  it("should return an empty array when nothing is passed", () => {
    expect(getTemplates()).to.be.an("array").that.is.empty;
  });

  it("should return an empty array when text without a template is passed", () => {
    const text = "This is a text without template.";
    const result = getTemplates(text);
    expect(result).to.be.an("array").that.is.empty;
  });

  it("extracts a single template with named parameters", () => {
    const wikitext = `
      Some introductory text.
      {{Template1|param1=value1|param2=value2}}
      Some concluding text.
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param1: "value1",
          param2: "value2",
        },
        anonParameters: [],
        fullText: "{{Template1|param1=value1|param2=value2}}",
      },
    ]);
  });

  it("extracts multiple templates with mixed named and anonymous parameters", () => {
    const wikitext = `
      {{Template1|value1|param2=value2|value3}}
      {{Template2|paramA=dataA|dataB}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param2: "value2",
        },
        anonParameters: ["value1", "value3"],
        fullText: "{{Template1|value1|param2=value2|value3}}",
      },
      {
        name: "Template2",
        parameters: {
          paramA: "dataA",
        },
        anonParameters: ["dataB"],
        fullText: "{{Template2|paramA=dataA|dataB}}",
      },
    ]);
  });

  it("ignores text outside of templates", () => {
    const wikitext = `
      This is some text outside of templates.
      {{Template1|param1=value1}}
      More text outside.
      {{Template2|paramA=dataA}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param1: "value1",
        },
        anonParameters: [],
        fullText: "{{Template1|param1=value1}}",
      },
      {
        name: "Template2",
        parameters: {
          paramA: "dataA",
        },
        anonParameters: [],
        fullText: "{{Template2|paramA=dataA}}",
      },
    ]);
  });

  it("handles templates with no parameters gracefully", () => {
    const wikitext = `
      {{Template1}}
      {{Template2|}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {},
        anonParameters: [],
        fullText: "{{Template1}}",
      },
      {
        name: "Template2",
        parameters: {},
        anonParameters: [""],
        fullText: "{{Template2|}}",
      },
    ]);
  });

  it("returns only the template whose name was passed as the second parameter", () => {
    const wikitext = `
      {{Template1|param1=value1}}
      {{Template2|paramA=dataA}}
    `;
    const result = getTemplates(wikitext, "Template1");
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param1: "value1",
        },
        anonParameters: [],
        fullText: "{{Template1|param1=value1}}",
      },
    ]);
  });

  it("handles two templates with no space between them", () => {
    const wikitext = `
      {{Template1|param1=value1}}{{Template2|paramA=dataA}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param1: "value1",
        },
        anonParameters: [],
        fullText: "{{Template1|param1=value1}}",
      },
      {
        name: "Template2",
        parameters: {
          paramA: "dataA",
        },
        anonParameters: [],
        fullText: "{{Template2|paramA=dataA}}",
      },
    ]);
  });

  it("extracts nested templates correctly", () => {
    const wikitext = `
      {{OuterTemplate|param1=value1|nested={{InnerTemplate|paramA=dataA}}}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "OuterTemplate",
        parameters: {
          param1: "value1",
          nested: "{{InnerTemplate|paramA=dataA}}",
        },
        anonParameters: [],
        fullText:
          "{{OuterTemplate|param1=value1|nested={{InnerTemplate|paramA=dataA}}}}",
      },
    ]);
  });

  it("handles malformed templates gracefully", () => {
    const wikitext = `
      {{Template1|param1=value1
      {{Template2|paramA=dataA}} 
    `;
    expect(() => getTemplates(wikitext)).to.throw(
      errorMessages.unclosedTemplate
    );
  });

  it("handles templates with duplicate named parameters", () => {
    const wikitext = `
      {{Template1|param1=value1|param1=value2}}
    `;
    const result = getTemplates(wikitext);
    expect(result).to.deep.equal([
      {
        name: "Template1",
        parameters: {
          param1: ["value1", "value2"],
        },
        anonParameters: [],
        fullText: "{{Template1|param1=value1|param1=value2}}",
      },
    ]);
  });
});
