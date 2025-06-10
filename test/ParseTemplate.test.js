import { expect } from "chai";
import { errorMessages, extractTemplate } from "../parser.js";

describe("extractTemplate", () => {
  describe("basic functionality", () => {
    it("should be defined", () => {
      expect(extractTemplate).to.be.a("function");
    });
    it("should take two parameters", () => {
      expect(extractTemplate.length).to.equal(2);
    });
    it("should return a template object and a number", () => {
      const result = extractTemplate("{{Template1}}", 0);
      expect(result).to.be.an("array");
      expect(result.length).to.equal(2);
      expect(result[0]).to.be.an("object");
      expect(result[1]).to.be.a("number");
    });
    it("should return a template object with a name, parameters, anonParameters, and fulltext", () => {
      const result = extractTemplate("{{Template1}}", 0);
      expect(result[0]).to.have.property("name");
      expect(result[0]).to.have.property("parameters");
      expect(result[0]).to.have.property("anonParameters");
      expect(result[0]).to.have.property("fullText");
    });
  });
  describe("should throw for invalid template text", () => {
    it("should throw for not existing position", () => {
      expect(() => extractTemplate("{{Template1}}", 100)).to.throw(
        errorMessages.notExistingPosition
      );
    });
    it("should throw for no opening braces", () => {
      expect(() => extractTemplate("Template1}}", 0)).to.throw(
        errorMessages.invalidTemplateStart
      );
    });
    it("should throw for no closing braces", () => {
      expect(() => extractTemplate("{{Template1", 0)).to.throw(
        errorMessages.unclosedTemplate
      );
    });
    it("should throw for only one closing braces", () => {
      expect(() => extractTemplate("{{Template1}", 0)).to.throw(
        errorMessages.unclosedTemplate
      );
    });
    it("should throw for only one closing braces also in the middle of the text", () => {
      expect(() => extractTemplate("{{Template1} more text", 0)).to.throw(
        errorMessages.unclosedTemplate
      );
    });
    it("should throw for no template name", () => {
      expect(() => extractTemplate("{{}}", 0)).to.throw(
        errorMessages.noTemplateName
      );
    });
    it("should throw for no template name with white space", () => {
      expect(() => extractTemplate("{{  }}", 0)).to.throw(
        errorMessages.noTemplateName
      );
    });
  });
  describe("template name handling", () => {
    it("should return the right name for the template name", () => {
      const result = extractTemplate("{{Template1}}", 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is a newline", () => {
      const template = `{{Template1
    }}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is a |", () => {
      const template = `{{Template1|}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is a | and a newline", () => {
      const template = `{{Template1
    |}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is a | and a newline and a parameter", () => {
      const template = `{{Template1
    |param1=value1}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is a | and a newline and a parameter and a |", () => {
      const template = `{{Template1
    |param1=value1|}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
    it("should return the right name for the template name when there is white space", () => {
      const template = `{{  Template1  }}`;
      const result = extractTemplate(template, 0);
      expect(result[0].name).to.equal("Template1");
    });
  });
  describe("fullText handling", () => {
    it("should return the full text of the template", () => {
      const template = `{{Template1}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].fullText).to.equal(template);
    });
    it("should return the full text of the template also when there is nested templates", () => {
      const template = `{{Template1|{{Template2}}}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].fullText).to.equal(template);
    });
    it("should return the full text of the template also when there is nested templates and parameters", () => {
      const template = `{{Template1|{{Template2}}|param1=value1}}`;
      const result = extractTemplate(template, 0);
      expect(result[0].fullText).to.equal(template);
    });
    it("should return the text of the template only also when there is more text", () => {
      const template = `{{Template1}} more text`;
      const result = extractTemplate(template, 0);
      expect(result[0].fullText).to.equal("{{Template1}}");
    });
  });

  describe("parameter handling", () => {
    describe("extracting templates with named parameters", () => {
      it("extracts a simple template with named parameters", () => {
        const text =
          "Some text before {{Template1|param1=value1|param2=value2}} some text after";
        const position = text.indexOf("{"); // Start of the template

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template).to.have.property("fullText");
        expect(template.parameters).to.deep.equal({
          param1: "value1",
          param2: "value2",
        });
        expect(template.fullText).to.equal(
          "{{Template1|param1=value1|param2=value2}}"
        );
        expect(endPosition).to.equal(text.indexOf("}}") + 2);
      });

      it("extracts a template with mixed named and anonymous parameters", () => {
        const text = "{{Template1|value1|param2=value2|value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template).to.have.property("fullText");
        expect(template).to.have.property("anonParameters");
        expect(template.parameters).to.deep.equal({
          param2: "value2",
        });
        expect(template.anonParameters).to.deep.equal(["value1", "value3"]);
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("extracts a template with special characters in parameter values", () => {
        const text =
          "{{Template1|param1=value_with_special_chars@#&*!|param2=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "value_with_special_chars@#&*!",
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("extracts a template with empty named parameters", () => {
        const text = "{{Template1|param1=|param2=}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "",
          param2: "",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("extracts templates with nested braces inside parameters", () => {
        const text = "{{Template1|param1=Some {{Nested}} text|param2=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "Some {{Nested}} text",
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handling templates with no parameters", () => {
      it("handles templates with no parameters", () => {
        const text = "{{Template1}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({});
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal([]);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handling nested templates", () => {
      it("extracts nested templates correctly", () => {
        const text =
          "{{OuterTemplate|param1={{InnerTemplate|key=value}}|param2=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "{{InnerTemplate|key=value}}",
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("extracts nested templates with parameters", () => {
        const text =
          "{{Template1|param1={{Template2|key=value}}|param2=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "{{Template2|key=value}}",
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("handles parameters that include nested templates together with more text correctly", () => {
        const text =
          "{{Template1|param1=Some {{Nested|key=value}} content|param2=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "Some {{Nested|key=value}} content",
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handling anonymous parameters", () => {
      it("extracts a template with only anonymous parameters", () => {
        const text = "{{Template1|value1|value2|value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({});
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal([
          "value1",
          "value2",
          "value3",
        ]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("handles empty anon parameters", () => {
        const text = "{{Template1|value1||value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({});
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal(["value1", "", "value3"]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("should handle correct the order of anon parameters also when mixed with named parameters", () => {
        const text = "{{Template1|value1|param1=value2|value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "value2",
        });
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal(["value1", "value3"]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("should handle correct the order of anon parameters also when they are mixed with named parameters and empty anon parameters", () => {
        const text = "{{Template1|value1|param1=value2||value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "value2",
        });
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal(["value1", "", "value3"]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("should handle correct the order of anon parameters also when they are mixed with named parameters and empty anon parameters and whitespace", () => {
        const text = "{{Template1|value1|param1=value2| |value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "value2",
        });
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal(["value1", "", "value3"]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("should handle correct anon parameters and named parameters also when there is empty named parameters", () => {
        const text = "{{Template1|value1||param1=|value3}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "",
        });
        expect(template).to.have.property("anonParameters");
        expect(template.anonParameters).to.deep.equal(["value1", "", "value3"]);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handling special cases", () => {
      it("extracts templates with special unicode characters", () => {
        const text = "{{Template1|param1=値|param2=✓}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "値",
          param2: "✓",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });

      it("process ending with 3 braces correctly", () => {
        const text = "{{Template1|param1=value1}}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal("{{Template1|param1=value1}}");
        expect(endPosition).to.equal(text.indexOf("}}") + 2);
      });

      it("should handle correct named parameters with only white space", () => {
        const text = "{{Template1|param1= |param2=  }}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: "",
          param2: "",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    // Add missing tests
    describe("handling whitespace and line breaks in parameter values", () => {
      it("handles whitespace and line breaks in parameter values", () => {
        const text = `{{Template1|param1=value1 
        continues|param2=value2}}`;
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: `value1 
        continues`,
          param2: "value2",
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handling occurrence of the same parameter twice", () => {
      it("should handle correct occurrence of the same parameter twice", () => {
        const text = "{{Template1|param1=value1|param1=value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: ["value1", "value2"],
        });
        expect(endPosition).to.equal(text.length);
      });

      it("should handle correct occurrence of the same parameter twice with different whitespace around the parameter name", () => {
        const text = "{{Template1|param1=value1| param1 =value2}}";
        const position = 0;

        const [template, endPosition] = extractTemplate(text, position);
        expect(template).to.have.property("parameters");
        expect(template.parameters).to.deep.equal({
          param1: ["value1", "value2"],
        });
        expect(template).to.have.property("fullText");
        expect(template.fullText).to.equal(text);
        expect(endPosition).to.equal(text.length);
      });
    });

    describe("handeling real world cases", () => {
      it("should parse template 1", () => {
        const text = `{{מיון
|שם=תנין הים
|תמונה=[[קובץ:SaltwaterCrocodile('Maximo').jpg|250px]]
|ממלכה=[[בעלי חיים]]
|מערכה=[[מיתרניים]]
|קבוצה_5=[[בעלי חוליות]]
|קבוצה_6=[[ארכוזאוריה]]
|סדרה=[[תנינאים]]
|משפחה=[[תניניים]]
|סוג=[[תנין (סוג)|תנין]]
|מין='''תנין הים'''
|שם מדעי=Crocodylus porosus
|טקסונום=[[יוהאן גוטלוב שניידר|שניידר]], 1801
|תפוצה=[[קובץ:Crocodylus_porosus_range.png|220px]]}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "מיון",
          parameters: {
            שם: "תנין הים",
            תמונה: "[[קובץ:SaltwaterCrocodile('Maximo').jpg|250px]]",
            ממלכה: "[[בעלי חיים]]",
            מערכה: "[[מיתרניים]]",
            קבוצה_5: "[[בעלי חוליות]]",
            קבוצה_6: "[[ארכוזאוריה]]",
            סדרה: "[[תנינאים]]",
            משפחה: "[[תניניים]]",
            סוג: "[[תנין (סוג)|תנין]]",
            מין: "'''תנין הים'''",
            "שם מדעי": "Crocodylus porosus",
            טקסונום: "[[יוהאן גוטלוב שניידר|שניידר]], 1801",
            תפוצה: "[[קובץ:Crocodylus_porosus_range.png|220px]]",
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
      it("should parse template 2", () => {
        const text = `{{שדה תעופה
|שם=נמל התעופה חברובסק-נובי
|סמל=
|תמונה=[[קובץ:Wiki airport Khabarovsk big.jpg|250px]]
|IATA=KHV
|ICAO=UHHH
|סוג השדה=ציבורי
|מפעיל=
|עיר סמוכה=[[חברובסק]]
|גובה רגל=244
|גובה מטר=74
|מסלול 1: כיוון מגנטי=05R/23L
|מסלול 1: אורך רגל=13,124
|מסלול 1: אורך מטר=4,000
|מסלול 1: סוג מסלול=[[בטון]]
|מסלול 2: כיוון מגנטי=05L/23R
|מסלול 2: אורך רגל=11,483
|מסלול 2: אורך מטר=3,500
|מסלול 2: סוג מסלול=[[אספלט]]
|מסלול 3: כיוון מגנטי=
|מסלול 3: אורך רגל=
|מסלול 3: אורך מטר=
|מסלול 3: סוג מסלול=
|מסלול 4: כיוון מגנטי=
|מסלול 4: אורך רגל=
|מסלול 4: אורך מטר=
|מסלול 4: סוג מסלול=
|מסלול 5: כיוון מגנטי=
|מסלול 5: אורך רגל=
|מסלול 5: אורך מטר=
|מסלול 5: סוג מסלול=
|מסלול 6: כיוון מגנטי=
|מסלול 6: אורך רגל=
|מסלול 6: אורך מטר=
|מסלול 6: סוג מסלול=
|אתר אינטרנט={{אתר רשמי|airkhv.ru|נמל התעופה}}
|מספר הנוסעים=1,821,000
|מספר המראות/נחיתות=
|מטען=24,900 טון
|נכון לשנת=2015
|מפה={{מממו|רוסיה|מחוז חברובסק|סטייה אנכית=4|סטייה אנכית נוספת=-10|סטייה אופקית נוספת=-20|שם=KHV|סוג=שדה תעופה}}
|מפה מפורטת=
|קואורדינטות={{coord|48|31|41|N|135|11|18|E|type:airport|display=inline,title}}
|שם בשפת המקור=Аэропорт Хабаровск-Новый
}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "שדה תעופה",
          parameters: {
            שם: "נמל התעופה חברובסק-נובי",
            סמל: "",
            תמונה: "[[קובץ:Wiki airport Khabarovsk big.jpg|250px]]",
            IATA: "KHV",
            ICAO: "UHHH",
            "סוג השדה": "ציבורי",
            מפעיל: "",
            "עיר סמוכה": "[[חברובסק]]",
            "גובה רגל": "244",
            "גובה מטר": "74",
            "מסלול 1: כיוון מגנטי": "05R/23L",
            "מסלול 1: אורך רגל": "13,124",
            "מסלול 1: אורך מטר": "4,000",
            "מסלול 1: סוג מסלול": "[[בטון]]",
            "מסלול 2: כיוון מגנטי": "05L/23R",
            "מסלול 2: אורך רגל": "11,483",
            "מסלול 2: אורך מטר": "3,500",
            "מסלול 2: סוג מסלול": "[[אספלט]]",
            "מסלול 3: כיוון מגנטי": "",
            "מסלול 3: אורך רגל": "",
            "מסלול 3: אורך מטר": "",
            "מסלול 3: סוג מסלול": "",
            "מסלול 4: כיוון מגנטי": "",
            "מסלול 4: אורך רגל": "",
            "מסלול 4: אורך מטר": "",
            "מסלול 4: סוג מסלול": "",
            "מסלול 5: כיוון מגנטי": "",
            "מסלול 5: אורך רגל": "",
            "מסלול 5: אורך מטר": "",
            "מסלול 5: סוג מסלול": "",
            "מסלול 6: כיוון מגנטי": "",
            "מסלול 6: אורך רגל": "",
            "מסלול 6: אורך מטר": "",
            "מסלול 6: סוג מסלול": "",
            "אתר אינטרנט": "{{אתר רשמי|airkhv.ru|נמל התעופה}}",
            "מספר הנוסעים": "1,821,000",
            "מספר המראות/נחיתות": "",
            מטען: "24,900 טון",
            "נכון לשנת": "2015",
            מפה: "{{מממו|רוסיה|מחוז חברובסק|סטייה אנכית=4|סטייה אנכית נוספת=-10|סטייה אופקית נוספת=-20|שם=KHV|סוג=שדה תעופה}}",
            "מפה מפורטת": "",
            קואורדינטות:
              "{{coord|48|31|41|N|135|11|18|E|type:airport|display=inline,title}}",
            "שם בשפת המקור": "Аэропорт Хабаровск-Новый",
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
      it("should parse template 3", () => {
        const text = `{{אישיות
|שם=מרב אלאשווילי
|שם בשפת המקור=მერაბ ელაშვილი
|מדינה=[[רוסיה]], [[גיאורגיה]]
|תאריך לידה=[[9 ביוני]] [[1974]]
|תאריך לידה עברי=
|תאריך פטירה=
|תאריך פטירה עברי=
|סיבת המוות=
|תמונה=
|כיתוב=
|מקום לידה=[[קולאשי]], [[אימרתי]], [[גאורגיה הסובייטית]]
|מקום פטירה=
|מקום קבורה=
|מקום מגורים=
|כינויים נוספים=
|פעילות בולטת=
|ידוע בשל=
|ידועה בשל=
|השכלה=

|עיסוק=
|מקצוע=
|תפקיד=
|תואר=
|תקופת כהונה=
|מפלגה=
|השקפה דתית=
|בן זוג=
|בת זוג=
|צאצאים=
|חתימה=
|אתר אינטרנט=
|הערות שוליים=
}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "אישיות",
          parameters: {
            שם: "מרב אלאשווילי",
            "שם בשפת המקור": "მერაბ ელაშვილი",
            מדינה: "[[רוסיה]], [[גיאורגיה]]",
            "תאריך לידה": "[[9 ביוני]] [[1974]]",
            "תאריך לידה עברי": "",
            "תאריך פטירה": "",
            "תאריך פטירה עברי": "",
            "סיבת המוות": "",
            תמונה: "",
            כיתוב: "",
            "מקום לידה": "[[קולאשי]], [[אימרתי]], [[גאורגיה הסובייטית]]",
            "מקום פטירה": "",
            "מקום קבורה": "",
            "מקום מגורים": "",
            "כינויים נוספים": "",
            "פעילות בולטת": "",
            "ידוע בשל": "",
            "ידועה בשל": "",
            השכלה: "",
            עיסוק: "",
            מקצוע: "",
            תפקיד: "",
            תואר: "",
            "תקופת כהונה": "",
            מפלגה: "",
            "השקפה דתית": "",
            "בן זוג": "",
            "בת זוג": "",
            צאצאים: "",
            חתימה: "",
            "אתר אינטרנט": "",
            "הערות שוליים": "",
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
      it("should parse template 4", () => {
        const text = `{{מנהיג
| שם = ג'ון גורטון
| תמונה = [[קובץ:JohnGorton.jpg|250px|מרכז|גורטון, 1967]]
| כיתוב = גורטון בתמונה משנת 1967
| שם בשפת המקור = John Gorton
| שם מלא = ג'ון גריי גורטון
| מדינה = {{דגל|אוסטרליה||+}}
| מקום קבורה =
| תאריך לידה = [[9 בספטמבר]] [[1911]]
| מקום לידה = [[מלבורן]], [[ויקטוריה (אוסטרליה)|ויקטוריה]], [[אוסטרליה]]
| תאריך פטירה = [[19 במאי]] [[2002]]
| מקום פטירה = [[סידני]], [[ניו סאות' ויילס]]
| מפלגה = [[המפלגה הליברלית של אוסטרליה|המפלגה הליברלית]]
| בת זוג = בטינה גורטון (1983-1935) {{ש}} ננסי הורן (2002-1993)
| בן זוג =
| אתר אינטרנט =
| תפקיד1 = {{תפקיד מנהיג
| שם התפקיד = [[ראש ממשלת אוסטרליה]]
| למניין = 19
| התחלת כהונה = [[10 בינואר]] [[1968]]
| סיום כהונה = [[10 במרץ]] [[1971]]
| הקודם בתפקיד = [[ג'ון מק'איוון]]
| הבא בתפקיד = [[ויליאם מקמהון]]
}}
| תפקיד2 = {{תפקיד מנהיג
 |שם התפקיד=שירות צבאי
}}
{{אישיות ביטחונית
| סיווג = חייל
| שם = -
| תמונה = -
| השתייכות = [[קובץ:Air Force Ensign of Australia.svg|22px]] [[חיל האוויר המלכותי האוסטרלי]]
| התחלת פעילות = 1944 
| סיום פעילות = 1940
| דרגה = [[קובץ:RAAF O3 rank.png|18px]] לוטננט טיסה
| תפקידים בשירות = טייס קרב
| פעולות ומבצעים = [[מלחמת העולם השנייה]]
}}
}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "מנהיג",
          parameters: {
            שם: "ג'ון גורטון",
            תמונה: "[[קובץ:JohnGorton.jpg|250px|מרכז|גורטון, 1967]]",
            כיתוב: "גורטון בתמונה משנת 1967",
            "שם בשפת המקור": "John Gorton",
            "שם מלא": "ג'ון גריי גורטון",
            מדינה: "{{דגל|אוסטרליה||+}}",
            "מקום קבורה": "",
            "תאריך לידה": "[[9 בספטמבר]] [[1911]]",
            "מקום לידה":
              "[[מלבורן]], [[ויקטוריה (אוסטרליה)|ויקטוריה]], [[אוסטרליה]]",
            "תאריך פטירה": "[[19 במאי]] [[2002]]",
            "מקום פטירה": "[[סידני]], [[ניו סאות' ויילס]]",
            מפלגה: "[[המפלגה הליברלית של אוסטרליה|המפלגה הליברלית]]",
            "בת זוג": "בטינה גורטון (1983-1935) {{ש}} ננסי הורן (2002-1993)",
            "בן זוג": "",
            "אתר אינטרנט": "",
            תפקיד1:
              "{{תפקיד מנהיג\n| שם התפקיד = [[ראש ממשלת אוסטרליה]]\n| למניין = 19\n| התחלת כהונה = [[10 בינואר]] [[1968]]\n| סיום כהונה = [[10 במרץ]] [[1971]]\n| הקודם בתפקיד = [[ג'ון מק'איוון]]\n| הבא בתפקיד = [[ויליאם מקמהון]]\n}}",
            תפקיד2: `{{תפקיד מנהיג
 |שם התפקיד=שירות צבאי
}}
{{אישיות ביטחונית
| סיווג = חייל
| שם = -
| תמונה = -
| השתייכות = [[קובץ:Air Force Ensign of Australia.svg|22px]] [[חיל האוויר המלכותי האוסטרלי]]
| התחלת פעילות = 1944 
| סיום פעילות = 1940
| דרגה = [[קובץ:RAAF O3 rank.png|18px]] לוטננט טיסה
| תפקידים בשירות = טייס קרב
| פעולות ומבצעים = [[מלחמת העולם השנייה]]
}}`,
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
      it("should parse template 5", () => {
        const text = `{{מפלגה
| צבע כותרת = 009EE0
| שם בשפת המקור = Alternative für Deutschland
| סמל = [[קובץ:AfD Logo 2021.svg|[[מרכז]]|250px]]
| אידאולוגיות = [[פופוליזם ימני]]{{ש}}[[אירוסקפטיות]]{{ש}}[[שמרנות]]{{ש}}[[אסלאמופוביה]]{{ש}}[[ליברליזם כלכלי]]{{ש}}[[לאומנות]]
| מנהיגים = [[אליס ויידל]], [[טינו כרופאלה]]
| מייסד = ברנד לוק
| מדינה = {{דגל|[[גרמניה]]}} [[גרמניה]]
| תאריך ייסוד = [[2013]]
| מיקום במפה הפוליטית = [[שמאל וימין בפוליטיקה|ימין רדיקלי]]
| שם נציגות1 = [[בונדסטאג]]
| מספר חברי הנציגות1 = 80
| מספר מושבים1 = 736
| שם נציגות2 = [[לנדטאג]]ים של [[מדינות גרמניה]]
| מספר חברי הנציגות2 = 228
| מספר מושבים2 = 1884
| שם נציגות3 = [[הפרלמנט האירופי]], נציגי [[גרמניה|{{הערה|אני{{עודתוכן|עוד [[תוכן]]}}}}]]
| מספר חברי הנציגות3 = 9
| מספר מושבים3 = 96
| אתר אינטרנט = https://www.alternativefuer.de/ www.alternativefuer.de
}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "מפלגה",
          parameters: {
            "צבע כותרת": "009EE0",
            "שם בשפת המקור": "Alternative für Deutschland",
            סמל: "[[קובץ:AfD Logo 2021.svg|[[מרכז]]|250px]]",
            אידאולוגיות:
              "[[פופוליזם ימני]]{{ש}}[[אירוסקפטיות]]{{ש}}[[שמרנות]]{{ש}}[[אסלאמופוביה]]{{ש}}[[ליברליזם כלכלי]]{{ש}}[[לאומנות]]",
            מנהיגים: "[[אליס ויידל]], [[טינו כרופאלה]]",
            מייסד: "ברנד לוק",
            מדינה: "{{דגל|[[גרמניה]]}} [[גרמניה]]",
            "תאריך ייסוד": "[[2013]]",
            "מיקום במפה הפוליטית": "[[שמאל וימין בפוליטיקה|ימין רדיקלי]]",
            "שם נציגות1": "[[בונדסטאג]]",
            "מספר חברי הנציגות1": "80",
            "מספר מושבים1": "736",
            "שם נציגות2": "[[לנדטאג]]ים של [[מדינות גרמניה]]",
            "מספר חברי הנציגות2": "228",
            "מספר מושבים2": "1884",
            "שם נציגות3":
              "[[הפרלמנט האירופי]], נציגי [[גרמניה|{{הערה|אני{{עודתוכן|עוד [[תוכן]]}}}}]]",
            "מספר חברי הנציגות3": "9",

            "מספר מושבים3": "96",
            "אתר אינטרנט":
              "https://www.alternativefuer.de/ www.alternativefuer.de",
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
      it("should parse template 6", () => {
        const text = `{{אישיות
| שם = פרדי אוברסטייחן
| שם בשפת המקור = Freddie Nanda Dekker-Oversteegen
| תאריך לידה = 6 בספטמבר 1925
| תאריך פטירה = 5 בספטמבר 2018
| ידועה בשל = חברה במחתרת ההולנדית במהלך מלחמת העולם השנייה
| בן זוג = יאן דקר
| צאצאים = 3
}}`;
        const [template, position] = extractTemplate(text, 0);
        expect(template).to.deep.equal({
          name: "אישיות",
          parameters: {
            שם: "פרדי אוברסטייחן",
            "שם בשפת המקור": "Freddie Nanda Dekker-Oversteegen",
            "תאריך לידה": "6 בספטמבר 1925",
            "תאריך פטירה": "5 בספטמבר 2018",
            "ידועה בשל": "חברה במחתרת ההולנדית במהלך מלחמת העולם השנייה",
            "בן זוג": "יאן דקר",
            צאצאים: "3",
          },
          anonParameters: [],
          fullText: text,
        });
        expect(position).to.equal(text.length);
      });
    });
  });
});
