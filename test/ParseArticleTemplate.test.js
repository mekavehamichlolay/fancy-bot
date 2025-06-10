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
  describe("should parse the article correct", () => {
    const articleText = `{{אישיות רבנית
| שם = רבי דן אשכנזי
| שם בשפת המקור = 
| תמונה = 
| כיתוב = 
| כינוי = 
| תאריך לידה = 
| מקום לידה = 
| תאריך פטירה = 
| מקום פטירה = 
| סיבת המוות = 
| מקום קבורה =  
| תאריך לידה עברי = 
| תאריך פטירה עברי = 
| מקום פעילות = 
| השתייכות = רבני [[אשכנז]], רבני [[ספרד]], [[ראשונים]]
| תחומי עיסוק = הלכה, פרשנות המקרא 
| תפקידים נוספים = 
| רבותיו = [[מהר"ם מרוטנבורג]]
| תלמידיו = 
| בני דורו = 
| בן זוג = 
| בת זוג = 
| צאצאים = 
| חתימה = 
}}

רבי '''דן בן יוסף אשכנזי''' (את הכינוי אשכנזי קיבל ב[[ספרד]] בעקבות מוצאו) חי ופעל ב[[אשכנז]] במחצית השנייה של [[המאה ה-13]], ובהמשך היגר לספרד שם פעל עד לפטירתו.

על קורותיו ב[[אשכנז]] ידוע מעט מאוד מלבד העובדה שהשתייך לחוגו הפנימי של רבו [[מהר"ם מרוטנבורג]] והתערב בשאלות ציבוריות שונות.

עם עלייתו של המלך [[רודולף הראשון, מלך גרמניה|רודולף הראשון]] בשנת [[1286]] וההרעה שחלה בעקבות כך במצבם של יהודי אשכנז, עזב רבנו דן את אשכנז בסביבות שנת 1287/8 ועבר להתגורר בספרד בעיר [[סרגוסה]] ולאחר מכן הקים ישיבה ב[[טולדו]].

בספרד היה מעורב רבנו דן בפולמוסים הלכתיים חריפים כשבחלקם הביע דעה הלכתית עצמאית וחריגה מאוד (כגון הכשר שחיטת נכרי), מה שגרם לוויכוחים סוערים עם בני תקופתו ובמיוחד עם ה[[רשב"א]].{{הערה|במקור מפוקפק ([[שאול ברלין|שו"ת בשמים ראש]] סי' כד) מסופרת גם אגדה מוזרה על כך שרבנו דן כתב לעצמו תפילין בתרגום לארמית והניחן.}}

פרשה נוספת ששמו של רבנו דן נקשר בה היא זו של הנביא נסים בן אברהם מ[[אווילה]] שהסעירה את קהילות ספרד בשנת [[1295]] בערך, כאשר תוך כדי מאבקו של הרשב"א להוקעתו של הנביא כתב רבנו דן מכתב התומך בו ובנבואתו, דבר שהביך מאוד את הרשב"א שכתב על כך את הדברים הבאים:

{{ציטוט| תוכן=זה כששה חדשים עבר בכאן נער חסר לב, ובידו איגרת חתומה מיד הרב רבי דן, וכראותיה היה הדבר קשה בעיני, יען חשבו רבים את זה לקלות הדעת, כי מה שיצריך חקירה רבה, וכמעט לא יספיקו בו כל החקירות, יכתוב איש שנקרא חכם, כמעיד: 'זאת אמת'. ואין אלו דברי חכם ולא יאות כזה לנקיי הדעת רק לנמהרי הלב ולאשר לא תעשינה ידיהם תושיה.|מקור=תשובות הרשב"א חלק א סימן תקמח}}

למרות הוויכוחים הרבים שעברו בין הרשב"א לרבנו דן נשמר ביניהם יחס של כבוד הדדי והרשב"א אף כותב ש"כדאי הוא לסמוך עליו". וגם רבינו [[בחיי בן אשר]] שהיה תלמידו של הרשב"א מביא בשמו כמה פעמים בספרו "רבינו בחיי" על התורה.{{הערה|לפי הפירוש בפ' שמות ב, כא, שם כתב, "כך שמעתי מפי הרב רבי דן ז"ל". ובפ' משפטים כד, יא.}}

חוץ מעיסוקו ההלכתי, היה פעיל רבות גם בפרשנות המקרא ומלבד המובאות משמו בחיבורים שונים כתב כנראה גם פירוש שלם על התורה שאבד. פירושיו שנשתמרו מתאפיינים במקוריות, חדשנות ונועזות.

==לקריאה נוספת==
* [[ישראל מ' תא-שמע]], '''רבנו דן מגלות אשכנז אשר בספרד''', כנסת מחקרים - עיונים בספרות הרבנית בימי הביניים, כרך ב עמ' 149–166
== קישורים חיצוניים ==
* {{אוצר הגדולים|ג|145|עמודים=קמד-קמה}}, אות קצא

==הערות שוליים==
{{הערות שוליים|יישור=ימין}}
{{מיון רגיל: דן, בן יוסף
[[קטגוריה:רבנים: ראשונים]]
[[קטגוריה:ראשוני ספרד]]
[[קטגוריה:תלמידי המהר"ם מרוטנבורג]]
[[קטגוריה:רבנים משנות ה' אלפים - ה'ק']]
{{וח|דן בן יוסף אשכנזי}}
{{מיון ויקיפדיה|דף=דן בן יוסף אשכנזי|גרסה=34658851|פריט=Q6812206}}
`;
    it("should throw unclosed template error when parsing all the templates", () => {
      expect(() => getTemplates(articleText)).to.throw(
        errorMessages.unclosedTemplate
      );
    });
    it("should parse and find the right text when parsing the certain template before the curopted template", () => {
      const result = getTemplates(articleText, "אישיות רבנית");
      expect(result).to.deep.equal([
        {
          name: "אישיות רבנית",
          parameters: {
            שם: "רבי דן אשכנזי",
            "שם בשפת המקור": "",
            תמונה: "",
            כיתוב: "",
            כינוי: "",
            "תאריך לידה": "",
            "מקום לידה": "",
            "תאריך פטירה": "",
            "מקום פטירה": "",
            "סיבת המוות": "",
            "מקום קבורה": "",
            "תאריך לידה עברי": "",
            "תאריך פטירה עברי": "",
            "מקום פעילות": "",
            השתייכות: "רבני [[אשכנז]], רבני [[ספרד]], [[ראשונים]]",
            "תחומי עיסוק": "הלכה, פרשנות המקרא",
            "תפקידים נוספים": "",
            רבותיו: '[[מהר"ם מרוטנבורג]]',
            תלמידיו: "",
            "בני דורו": "",
            "בן זוג": "",
            "בת זוג": "",
            צאצאים: "",
            חתימה: "",
          },
          anonParameters: [],
          fullText: `{{אישיות רבנית
| שם = רבי דן אשכנזי
| שם בשפת המקור = 
| תמונה = 
| כיתוב = 
| כינוי = 
| תאריך לידה = 
| מקום לידה = 
| תאריך פטירה = 
| מקום פטירה = 
| סיבת המוות = 
| מקום קבורה =  
| תאריך לידה עברי = 
| תאריך פטירה עברי = 
| מקום פעילות = 
| השתייכות = רבני [[אשכנז]], רבני [[ספרד]], [[ראשונים]]
| תחומי עיסוק = הלכה, פרשנות המקרא 
| תפקידים נוספים = 
| רבותיו = [[מהר"ם מרוטנבורג]]
| תלמידיו = 
| בני דורו = 
| בן זוג = 
| בת זוג = 
| צאצאים = 
| חתימה = 
}}`,
        },
      ]);
    });
  });
});
