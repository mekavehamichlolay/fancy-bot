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
    const result = getTemplates(wikitext, { name: "Template1" });
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

  it("extracts nested templates as part of the parent template when nested is not specified", () => {
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
      const result = getTemplates(articleText, { name: "אישיות רבנית" });
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
  describe("handle nested templates when thay are asked", () => {
    const article = `{{מבנה
|סוג=[[מוזיאון ילדים]]
|כתובת=דוד הראובני 25, באר-שבע
|מייסדים=ג'ק, ג'וזף ומורטון מנדל
|מפה={{מממו|באר שבע}}
|כיתוב מפה=
|תאריך סיום=2015}}
'''לונדע''' הוא [[מוזיאון ילדים]] בשכונת [[נחל עשן]] שב[[באר שבע]], סמוך לבית הספר התיכון "טוביהו", במבנה גדול בו שכן בעבר סניף של "[[חווידע]]". המוזיאון נבנה בשנת [[2015]] ונקרא על שם ג'ק, ג'וזף ו[[מורטון מנדל]]. מטרתו לעודד בילוי משפחתי רב-גילאי על ידי למידה באמצעות משחק.

המוזיאון מיועד לילדים מגיל שנה וחצי עד גיל שתים עשרה, והוריהם. זהו המוזיאון הראשון בארץ, בו המתחמים הם רב-גילאיים ותוכננו במטרה לספק עניין משותף למשפחות שלמות יחד, על מנעד הגילאים הרחב של ילדיהן. המוזיאון עוסק בנושאים מחיי היומיום וכולל מתחמי למידה כגון מתחמים העובדים על [[מוטוריקה]] גסה, מתחמי רגשות, מתחמי אומנות וכו'. המוזיאון מתאפיין בכך שהכניסה אליו היא ללא נעליים, על מנת להשרות רוגע ותחושה ביתית על המבקרים בו. מפתיחת המקום ועד [[נובמבר]] [[2019]] הלונדע נוהל על ידי אלעד אזולאי, לשעבר מנהל מרכז מצוינות במנהיגות ומעורבות חברתית בבאר-שבע, וכמנהל החינוכי של עמותת "ידידים" לקידום [[נוער בסיכון]]. לאחר מכן, ניהול המוזיאון הועבר לידי אורטל מיכאל-חדד שמשמשת כמנהלת עד היום.

למרגלות ה"לונדע" מתוכנן [[פארק הילדים (באר שבע)|פארק הילדים]] המשתרע על 54 דונם.

בכניסה למוזיאון נמצא פסל ארוך המורכב מגלילים הקצרים בעוביים ומסודרים לפי צבעי הקשת.

== היסטוריית המבנה == 
המוזיאון נקרא על שם האחים ג'ק, ג'וזף ו[[מורטון מנדל]] אשר תרמו לעיריית באר שבע תרומה על סך חמישה מיליון דולר, לצורך הקמת המוזיאון. את המרכז ותכניו יזמה, יצרה ופיתחה חברת "Playpus" בראשותן של תמר הדר ואפרת אדיב, ועיצובו ותכנון המתקנים בו, נעשה על ידי יעַל טבת ורואי רוט, מחברת "רוט-טבת Experience Design". 

דבריו של מורטון ל. מנדל, יו"ר ונשיא קרן מנדל:
{{ציטוט|תוכן="... אנו מברכים את ההזדמנות לתמוך בעיר באר שבע בהקמת מוזיאון ייחודי לילדים אשר יתרום להעשרת המשפחות בעיר. קרן מנדל פועלת לחיזוק מדינת ישראל בתחומים שונים לרבות חינוך, חברה יזמות ותרבות, ורואה בתרומה זו המשך תמיכה בחינוך, באמצעות למידה ויצירה."}}

בחנוכת המוזיאון וביקורו של נשיא המדינה [[ראובן ריבלין]], נאמר: {{ציטוט|תוכן="אסור לנו, להפקיר את הזירה התרבותית ולהותיר אותה רק ב[[תל אביב]] [[חיפה]] ו[[ירושלים]]. אסור שהנגב יישאר מאחור. לאורך השנים, רבות מההחלטות שקבלה [[מדינת ישראל]] בנוגע לבאר שבע ולמרחב [[הנגב]], נותרו החלטות 'על הנייר'. בבחינת 'מס שפתים'. הגיע הזמן לעשות השקעה בנגב, היא משימה מאתגרת. המבחן איננו בהבטחה אלא בישום. עלינו להפך את הנגב לחלק מישראל אמתית. מישראל של מרכז הארץ ישראל שהיא קרובה אל העין, וגם קרובה אל הלב. אסור שהמרחק הפיזי ישפיע על שוויון ההזדמנויות של חלק נכבד מהחברה הישראלית, שקבע את מקום מושבו בנגב."}}{{הערה|[http://www.beershevacity.com/beershevacity-art/לונדע-נחנך-מוזיאון-הילדים-בבאר-שבע לונדע: נחנך מוזיאון הילדים בבאר שבע], אתר "באר שבע סיטי, 25 במרץ 2015}}

במוזיאון ישנן 3 קומות, על שטח כולל של 4,000 מ"ר המעוצב בצבעוניות שמזמינה את הילדים להתנסות בפעילויות השונות. בקומות נמצאים שמונה מתחמים שונים המחולקים לפי נושאים ויותר מ-50 פעילויות.

== בקומה האמצעית (קומת הכניסה) ==
=== רואים עולם === 
[[קובץ:Lunada Children Museum06.png|200px|ממוזער|שמאל|מתקן התאמת בעלי חיים במתחם רואים עולם]]
מתחם שבו הילד לומד להתמצא ב[[כדור הארץ]] וב[[חלל]]. התחנה כוללת [[מבוך]], [[מגדל פיקוח]], הכרת חיות העולם, הכרת [[מערכת השמש]] ו[[כח המשיכה]]. המתחם כולל פעילויות והדגמות כגון גלובוס שעליו יש להצמיד מגנטי בעלי חיים בהתאם למקום בו חי בעל החיים. [[קיר טיפוס]] המציג שמות של הרים ברחבי העולם וגובהם. קיר עם מפת העולם עם שמות מדינות וסימני ההיכר שלהן, מבוך בנושא החלל ובו סממנים זוהרים בצורות המאפיינות אסוציאות הקשורות לחלל, למשל, חייזרים, חלליות וכוכבים. בנוסף, המתחם מציג מידע על כוכבים שונים ברחבי הגלקסיה ומסכי טלוויזיות המציגים סרטוני [[בריינפופ]] בנושא החלל.

=== מתחמי "זזים" === 
מתחם העוסק בפעילות אקטיבית בצורה מיוחדת, ומטרתו לפתח מוטוריקה גסה. לדוגמה, פעילות הכוללת חדר חושך שעוברות בו קרני לייזרים כשהמשימה היא לעבור דרכן מבלי "להיפגע מהן" ומשחק [[קליעה למטרה]] עם תותחי כדורים ענקיים 
שניתן לשאוב באמצעות שואבי ענק או לזרוק למטרות המצוירות. בנוסף, קיים '''מתחם זזים קטנים''' לפעוטות, ובו פעילויות המתאימות לגיל הרך, כגון קרוסלות וקיר מגנטי, מסלולי ריצה וקלידים ענקיים שמופעלים על ידי הליכה עליהם.

== הקומה העליונה ==
=== מתחם אמנות ומוזיקה === 
בו הילד לומד אמנות ממוחשבת, צלילים מיוחדים, קיר אורות וצביעת פורטרטים. המתחם כולל קיר מיוחד, שניתן לצבוע עליו תמונות של ציורים מפורסמים בשחור ולבן, המשמשים כדפי צביעה ענקיים שניתן לצבוע על פי רצון באמצעות גירים וספוג מחיקה המחובר גם הוא לקיר. פעילות נוספת כוללת לוח שחור
בעל פתחים עגולים ומקלות סיליקון צבעוניים. כאשר מכניסים מקל צבעוני לאחד החורים נדלק [[אור]] הגורם למקל הצבעוני להאיר בצבע שלו וכך ניתן לשחק עם הצבעים המאירים וליצור דוגמאות וציורים שלמים. בנוסף, המתחם מכיל קיר גדול ועליו תמונות של כלי נגינה שונים, כאשר המשימה היא ללחוץ על הכפתורים וכך ליצור צלילים ושירים בהתאם לדפי ה[[תווים]] 
המונחים לצד הקיר.

=== מתחם שפות ===
במתחם ישנה עמדת שידור, הקראה ו[[צילום]] התהליך שבו הילד קורא קטעים מ[[מגילת העצמאות]], משולבת מילים בשפות שונות ומשחקי [[ארץ עיר]] ובהם תמונות של דברים שונים כגון חיות, בתים, מכוניות וחפצים ומתחתיהן כיתוב בשפה כלשהי :[[עברית]], [[רוסית]], [[אנגלית]], [[ערבית]], [[אמהרית]] ועוד.

=== מתחם רגשות וביטוי עצמי === 
במתחם מוצג באמצעים ויזואליים טווח הרגשות, באופן המסייע לילד להתמודד, להכיל ולהביע את עצמו אל מול הסביבה. במתחם נמצאות פעילויות הכוללות חדר ישיבה מיוחד ובו מסכים של סיטואציות שונות בטבע עליהם אמור להביע הילד את הרגשתו, מצלמות רגשות, המצלמות הבעות פנים של אנשים החווים רגש מסוים, וכדומה.

=== מתחם משאבים ===
[[קובץ:Lunada Children Museum17.jpg|200px|ממוזער|שמאל|מתקן במתחם משאבים]]
במתחם זה הילד לומד איך לנהל משאבי זמן, כסף ו[[תזונה]], בהיבטים האישיים, החברתיים והמשפחתיים: איך לנהל תקציב, איך בונים לוח זמנים וכו'. הפעילויות המוצגות במתחם כוללות משחקים שמלמדים כיצד לקנות נכון, כיצד לחסוך כסף, כיצד לנהל כסף וזמן, כיצד להרוויח כסף וכו'.

== בקומה התחתונה (הנמצאת מתחת לקומת הכניסה) ==
=== מתחם תיאטרון === 
[[קובץ:Lunada Children Museum11.png|250px|ממוזער|שמאל|הבמה במתחם התיאטרון]]
במתחם ישנה במה עם תאורה מתחלפת ושלל תלבושות, עמדת צילום התהליך של משחק הילד, בימוי והפקה של סצנות משחק שונות. המשתתפים יכולים לבחור תלבושות תפאורה וסיפור ולשחק כל דבר העולה בדעתם. ניתן לשחק קטע מתוך סדרות בערוץ "[[לוגי]]".הקטעים מוצגים על גבי מוניטור וברגע שמתחילים את ההצגה הקטע מצולם וניתן לראות אותו בסיום המשחק.

בנוסף, קיימים שני מתחמי חוץ הכוללים משחק [[סולמות ונחשים]] תלת ממדי.
המתחם כולל אזורי התארגנות ומזנון. לכל אורך המוזיאון בכל המתחמים והקומות והאזורים מפוזרים על גבי הקירות "בועות הידעת" עם עובדות מעניינות שונות על מבנה המוזיאון ועובדות הקשורות למתחם בו נמצאים.

== קישורים חיצוניים ==
{{ויקישיתוף בשורה|שם=Category:Lunada Children Museum|תצוגה=הלונדע}}
* {{אתר רשמי|http://lunada.co.il}}
* [https://www.facebook.com/7lunada עמוד הפייסבוק של לונדע] 
* [http://doula.co.il/355612 כתבה על המוזיאון] באתר "דולה"- פורטל למשפחה ולהורים שבדרך
* {{mynet|ליאור לרנר|למה הורה צריך לשלם על תינוק שנכנס למוזיאון?|4617029|12 במרץ 2015}}
* {{ynet|עינת שגיא אלפסה|בילוי לכל המשפחה: לונדע - מוזיאון הילדים של באר שבע|4619187|28 בינואר 2015}}
* [http://www.beershevacity.com/beer-sheva/לונדע-תרומה-של-5-מילין-דולר-תסייע-להקמת-מוזיאון-עולם-הילד-בבאר-שבע לונדע, תרומה של 5 מילין דולר תסייע להקמת מוזיאון עולם הילד בבאר שבע] באתר "באר שבע סיטי"
* [https://www.facebook.com/7lunada דף הפייסבוק של המוזיאון]
* [http://kinderland.xnet.co.il/arows%20presentation/c493/208624.php מידע על המוזיאון] באתר "קינדרלנד"
* [https://web.archive.org/web/20150525165730/http://www.local.co.il/beer-sheva/123170/article.htm כתבה על מינויו של אלעד אזולאי למנהל ה"לונדע"] באתר באר שבע לוקאל
* [http://www.beershevacity.com/beershevacity-art/לונדע-נחנך-מוזיאון-הילדים-בבאר-שבע לונדע : נחנך מוזיאון הילדים בבאר שבע] באתר "באר שבע סיטי"
* {{ynet|אילנה קוריאל|לונדע: מוזיאון הילדים החדש של הנגב|4640521|24 במרץ 2015}}
* [http://www.haaretz.co.il/CM.show_item_place,772,201,6575,.aspx מוזיאון לונדע באתר "עכבר העיר"]

==הערות שוליים==
{{הערות שוליים|יישור=ימין}}

[[קטגוריה:מוזיאוני ילדים]]
[[קטגוריה:באר שבע: מוזיאונים]]
[[קטגוריה:באר שבע: חינוך]]
{{וח}}
{{מיון ויקיפדיה|דף=לונדע|גרסה=28965358}}
`;
    it("should parse one nested templates correctly", () => {
      const result = getTemplates(article, { name: "מממו", nested: true });
      expect(result).to.deep.equal([
        {
          name: "מממו",
          parameters: {},
          anonParameters: ["באר שבע"],
          fullText: "{{מממו|באר שבע}}",
          nested: [],
        },
      ]);
    });
    it("should return multiple of the same template when asked", () => {
      const result = getTemplates(article, {
        name: "ynet",
        multi: true,
        nested: true,
      });
      expect(result).to.deep.equal([
        {
          name: "ynet",
          parameters: {},
          anonParameters: [
            "עינת שגיא אלפסה",
            "בילוי לכל המשפחה: לונדע - מוזיאון הילדים של באר שבע",
            "4619187",
            "28 בינואר 2015",
          ],
          fullText:
            "{{ynet|עינת שגיא אלפסה|בילוי לכל המשפחה: לונדע - מוזיאון הילדים של באר שבע|4619187|28 בינואר 2015}}",
          nested: [],
        },
        {
          name: "ynet",
          parameters: {},
          anonParameters: [
            "אילנה קוריאל",
            "לונדע: מוזיאון הילדים החדש של הנגב",
            "4640521",
            "24 במרץ 2015",
          ],
          fullText:
            "{{ynet|אילנה קוריאל|לונדע: מוזיאון הילדים החדש של הנגב|4640521|24 במרץ 2015}}",
          nested: [],
        },
      ]);
    });
  });
  describe("handle multiple named templates correctly", () => {
    it("should return multiple templates with the same name", () => {
      const wikitext = `
    {{Template1|param1=value1}}
    Some text in between.
    {{Template1|param1=value2|param2=value3}}
  `;
      const result = getTemplates(wikitext, {
        name: "Template1",
        multi: true,
        nested: true,
      });

      expect(result).to.deep.equal([
        {
          name: "Template1",
          parameters: {
            param1: "value1",
          },
          anonParameters: [],
          nested: [],
          fullText: "{{Template1|param1=value1}}",
        },
        {
          name: "Template1",
          parameters: {
            param1: "value2",
            param2: "value3",
          },
          nested: [],
          anonParameters: [],
          fullText: "{{Template1|param1=value2|param2=value3}}",
        },
      ]);
    });
    it("should return multiple templates with the same name also when nested", () => {
      const wikitext = `
    {{Template1|param1=value1|nested={{Template2|param2=value2}}}}
    Some text in between.
    {{Template1|param1=value2|param2=value3|nested={{Template2|param3=value3}}}}
    `;
      const result = getTemplates(wikitext, {
        name: "Template2",
        multi: true,
        nested: true,
      });
      expect(result).to.deep.equal([
        {
          name: "Template2",
          parameters: {
            param2: "value2",
          },
          anonParameters: [],
          fullText: "{{Template2|param2=value2}}",
          nested: [],
        },
        {
          name: "Template2",
          parameters: {
            param3: "value3",
          },
          anonParameters: [],
          fullText: "{{Template2|param3=value3}}",
          nested: [],
        },
      ]);
    });
    it("should return multiple templates with the same name and nested", () => {
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
      const result = getTemplates(text, {
        name: "תפקיד מנהיג",
        multi: true,
        nested: true,
      });
      expect(result).to.deep.equal([
        {
          name: "תפקיד מנהיג",
          parameters: {
            "שם התפקיד": "[[ראש ממשלת אוסטרליה]]",
            למניין: "19",
            "התחלת כהונה": "[[10 בינואר]] [[1968]]",
            "סיום כהונה": "[[10 במרץ]] [[1971]]",
            "הקודם בתפקיד": "[[ג'ון מק'איוון]]",
            "הבא בתפקיד": "[[ויליאם מקמהון]]",
          },
          anonParameters: [],
          fullText: `{{תפקיד מנהיג
| שם התפקיד = [[ראש ממשלת אוסטרליה]]
| למניין = 19
| התחלת כהונה = [[10 בינואר]] [[1968]]
| סיום כהונה = [[10 במרץ]] [[1971]]
| הקודם בתפקיד = [[ג'ון מק'איוון]]
| הבא בתפקיד = [[ויליאם מקמהון]]
}}`,
          nested: [],
        },
        {
          name: "תפקיד מנהיג",
          parameters: {
            "שם התפקיד": "שירות צבאי",
          },
          anonParameters: [],
          fullText: `{{תפקיד מנהיג
 |שם התפקיד=שירות צבאי
}}`,
          nested: [],
        },
      ]);
    });
    it("should ignore text within <!-- --> comments", () => {
      const wikitext = `
        {{מדען
| תאריך לידה = 1962
| מקום לידה = פרהאם, המפשייר
}}

'''סוזאן אליזבת בלאק''' (ידועה גם בשם סו בלאק, ילידת 1962) היא [[תכנות|מתכנתת]], חוקרת ו[[יזמת חברתית]] בריטית.<ref>{{cite web|url=http://www.sueblack.co.uk|title= Dr Sue Black official webpage|publisher=sueblack.co.uk}}</ref><!--<ref name=dblp>{{DBLP|name=Sue Black}}</ref> !--><!--<ref name=googlescholar>{{Google scholar id}}</ref> !--> בלאק יצרה את קמפיין "[[להציל את פארק בלצ'לי]]" להצלת האתר ששימש מרכז העצבים של פיצוח ההצפנות בבריטניה ב[[מלחמת העולם השנייה]].<ref name="saving">{{cite web|url=http://www.savingbletchleypark.org |archive-url=https://web.archive.org/web/20081109070803/http://savingbletchleypark.org/ |url-status=dead |archive-date=2008-11-09 |publisher=savingbletchleypark.org |title=Saving Bletchley Park }}</ref><ref>{{YouTube|id=fKQYECYJEH0|title=Interview with Sue Black by Robert Llewellyn about Bletchley Park}}</ref> מאז 2018 היא פרופסור למדעי המחשב ומקדמת טכנולוגיה ב[[אוניברסיטת דרהאם]], בעבר עבדה ב[[אוניברסיטת ווסטמינסטר]] וב[[יוניברסיטי קולג' לונדון]].

== ילדות ולימודים ==
בלאק עזבה את בית הספר ואת הבית בגיל 16, המינימלי המותר בחוק. היא נישאה בגיל 20 וילדה שלושה ילדים.<ref>{{cite web|last1=Black|first1=Sue|title=Bio + Contact|url=https://blackse.wordpress.com/contact/|website=blackse|accessdate=21 May 2016}}</ref> בגיל 25, לאחר שבעלה גירש אותה ואת ילדיה מהבית באיומים על חייהם, הפכה לאם חד הורית וחיה ב[[מקלט לנשים מוכות]].

בחיפוש אחר הזדמנויות פרנסה, היא השתתפה בקורס ערב במתמטיקה, בעקבותיו נרשמה לאוניברסיטה.<ref name="The Guardian">{{cite web|last1=Fleming|first1=Amy|title=#techmums: why can't geeks be mothers too?| url=https://www.theguardian.com/lifeandstyle/2013/nov/11/techmums-geeks-mothers-technology | accessdate=21 May 2016 | publisher=[[The Guardian]] | date=11 November 2013 |website=theguardian.com}}</ref> היא קיבלה תואר במדעי המחשב ב־1993 מ[[אוניברסיטת לונדון סאות' באנק]],<ref>{{cite web| url=http://www.lsbu.ac.uk/about-us/news/sue-black-becomes-obe | title=LSBU alumna Sue Black becomes an OBE in New Year Honours List 2016 | date=5 January 2016 | publisher=[[London South Bank University]] | location=UK | accessdate=7 January 2016 }}</ref> וב-2001 השלימה דוקטורט<ref name=phd>{{cite thesis |degree=PhD |first=Susan Elizabeth|last=Black |title=Computation of Ripple Effect Measures for Software  |publisher=London Southbank University  |year=2001 |url=
https://copac.jisc.ac.uk/id/48571357?style=html|website=jisc.ac.uk|oclc=1063678609 }}</ref> על חקר [[אפקט הפרפר]] בטכנולוגיות מידע.<!--<ref name=mathgene>{{MathGenealogy}}</ref> !--><ref name="Black2001">{{cite journal|last1=Black|first1=Sue|title=Computing ripple effect for software maintena.nce|journal=Journal of Software Maintenance and Evolution: Research and Practice|volume=13|issue=4|year=2001|pages=263–279|issn=1532-060X|doi=10.1002/smr.233}}</ref>.

== קריירה ומחקר ==
בלאק שימשה חוקרת בכירה ב[[יוניברסיטי קולג' לונדון]].<ref>{{cite web|url=http://www.cs.ucl.ac.uk/people/S.Black.html |title=Sue Black profile |publisher=[[University College London]] |location=UK |access-date=7 January 2016 |url-status=dead |archive-url=https://web.archive.org/web/20160303202754/http://www0.cs.ucl.ac.uk/people/S.Black.html |archive-date= 3 March 2016 |df= }}</ref>
לפני כן הייתה ראש החוג למדעי המחשב באוניברסיטת ווסטמינסטר. מאז 2018 היא משמשת פרופסור למדעי המחשב ומקדמת טכנולוגיה באוניברסיטת דרהאם, ופרופסור של כבוד ב[[יוניברסיטי קולג' לונדון]]. בלאק הקימה את קבוצת BCSWomen, קבוצת התמחות של אגודת המחשבים הבריטית,<ref>[http://www.bcs.org/server.php?show=ConWebDoc.8353 Dr Sue Black|Committee|BCSWomen], [[British Computer Society]].</ref> ועמדה בראשה מ-2001 עד 2008. היא פעילה למען נוכחות נשית בתחום [[מדעי המחשב]].<ref>[http://skirtsandladders.com/?tag=sue-black Sue Black profile],[http://skirtsandladders.com/ Skirts and Ladders].</ref>

=== אקטיביזם ===
==== להציל את פארק בלצ'לי ====
[[קובץ:Bletchley Park Mansion.jpg|ממוזער|אחוזת פארק בלצ'לי]]
למשך מספר שנים עמדה בלאק בראש קמפיין למימון השחזור של פארק בלצ'לי, המרכז הבריטי שבו החוקרים במלחמת העולם השנייה פיענחו את ידיעות האויב.<ref name="bbc">Cellan-Jones, Rory, ''[http://www.bbc.co.uk/blogs/technology/2009/03/bletchley_parks_social_media_w.html Bletchley Park's social media war]'', [[BBC News]], 18 March 2009.</ref> בשנת 2003 יצרה [[בלוג]] המספר על המקום לאחר שנחשפה למצבו הרעוע בעת ביקור, לאחר שראתה את שיחזור מכונת ה[[בומב]] ולאחר שדיברה עם מעל לעשרת אלפים איש שעבדו במקום בזמן המלחמה.<ref>Brain, Jon, ''[http://news.bbc.co.uk/2/hi/uk_news/7523743.stm Neglect of Bletchley condemned]'', [[BBC News]], 24 July 2008.</ref> באמצעות תמונה של אחד הבניינים במקום עם כיסוי [[ברזנט]] שנועד להגן על המבנה המתפורר, הצליחו לפתח שיח בנושא ולאחד מדעני מחשב בקריאה לשימור. תוך זמן קצר התווספה לבלוג פעילות משמעותית מצד בלאק וחברי הצוות של היוזמה<!-- <ref>{{article|langue=en|nom=Thomson|prénom=Rebecca|url=http://www.computerweekly.com/Articles/2009/03/19/235325/bletchley-park-wins-crucial-funding-using-facebook-and.htm|titre=Bletchley Park wins crucial funding using Facebook and Twitter|journal=[[Computer Weekly]]|date=19 mars 2009}}</ref>{{,}}.<ref>{{article|langue=en|auteur=[http://www.archimuse.com/mw2010/bios/au_370013252.html Sue Black], [http://www.archimuse.com/mw2010/bios/au_3817.html Jonathan P. Bowen], and [http://www.archimuse.com/mw2010/bios/au_445017569.html Kelsey Griffin]|url=http://www.archimuse.com/mw2010/papers/black/black.html|titre=Can Twitter Save Bletchley Park?|editor=David Bearman and Jennifer Trant|périodique=Museums and the Web 2010|lieu=[[Denver]], United States|date=13–17 April 2010|éditeur=[[Archives & Museum Informatics]]}}</ref> !--> ברשתות החברתיות, ובפרט ב[[טוויטר]]. <!-- <ref>{{lien web|langue=en|nom1=Cellan-Jones|prénom1=Rory|titre=OBE for Bletchley campaigner Sue Black|url=https://www.bbc.co.uk/news/technology-35202667|website=BBC News Technology|éditeur=BBC|consulté le=21 mai 2016|date=30 Dec 2015}}</ref><ref>{{lien web|langue=en|nom=Cellan-Jones|prénom=Rory|url=http://www.bbc.co.uk/blogs/technology/2009/03/bletchley_parks_social_media_w.html|website=dot.life A blog about technology from [[BBC News]]|éditeur=[[BBC]]|consulté le=21 mai 2016|date=18 mars 2009|titre=Bletchley Park's social media war}}</ref> !-->

בסוף 2015 פרסמה בלאק ספר על הקמפיין, בשם "Saving Bletchley Park". הספר פורסם דרך הוצאת Unbound המתמחה בפרסום על בסיס מימון המונים<!-- <ref>{{lien web|langue=en|titre=Saving Bletchley Park|url=https://unbound.co.uk/books/saving-bletchley-park|website=Unbound|consulté le=2015-12-30}}</ref> !-->, והיה הספר המהיר ביותר אי פעם בצבירת הכסף הנדרש לפרסומו במסגרת [[מימון המונים]].<!-- .<ref>{{lien web|url=http://www.womanthology.co.uk/celebrating-the-incredible-codebreakers-of-bletchley-park-dr-sue-black-computer-scientist-writer-and-speaker/|titre=Celebrating the incredible codebreakers of Bletchley Park - Dr. Sue Black OBE, Computer Scientist, Writer and Speaker - Womanthology|website=Womanthology|langue=en-US|consulté le=2016-04-07}}</ref> !-->

על פי ארגון Everywomen לקידום נשים בעסקים, בלאק "מפגינה תכונות של מנהיגה מודרנית", במיוחד בהקשר של שימוש ברשתות חברתיות.<ref>{{cite web|title=#techmums Founder Dr Sue Black's rules for elevating your personal social media presence |url=https://www.everywoman.com/personal-development/personal-branding/techmums-founder-dr-sue-blacks-rules-elevating-your-personal |website=Everywoman |access-date=21 May 2016 |url-status=dead |archive-url=https://web.archive.org/web/20160611102646/https://www.everywoman.com/personal-development/personal-branding/techmums-founder-dr-sue-blacks-rules-elevating-your-personal |archive-date=11 June 2016 |df= }}</ref> גם ב־BBC זיהו כי היא עושה שימוש מתוחכם בטוויטר ובפלטפורמות אחרות בקמפיינים שלה.<ref>{{cite web| last=Cellan-Jones | first=Rory | url=https://www.bbc.co.uk/blogs/technology/2009/03/bletchley_parks_social_media_w.html | website=dot.life A blog about technology from [[BBC News]] | publisher=[[BBC]] | accessdate=21 May 2016 | date=18 March 2009  | title=Bletchley Park's social media war}}</ref><ref>{{cite web|last1=Cellan-Jones|first1=Rory|title=OBE for Bletchley campaigner Sue Black|url=https://www.bbc.co.uk/news/technology-35202667|website=BBC News Technology|publisher=BBC|accessdate=21 May 2016|date=30 December 2015}}</ref>

בלאק הקימה את ארגון Techmums לאמהות שמעוניינות להבין את הפעילות של ילדיהן באינטרנט. Techmums מציע ללא תשלום קורסים באבטחת מידע, בשימוש ברשתות חברתיות, ב[[פייתון]] ובתחומים נוספים. מטרת הארגון היא לתת לנשים הללו ביטחון על ידי הגבלת [[הפער הדיגיטלי]], כמו גם לעזור להן לצאת ממצבי עוני<!-- <ref>{{lien web|langue=en|website=techmums.co|titre=About|url=http://techmums.co/about/|consulté le=21 mai 2016 !-->. הארגון מגדיר את עצמו "תוכנית מוכרת של סדנאות מעשיות וקצרות להקניית כישורים דיגיטליים" ויש לו קהילה וירטואלית תומכת.<ref>{{cite web|website=techmums.co|title=About|url=http://techmums.co/about/|accessdate=21 May 2016}}</ref>

בלאק הופיעה בשידורי הטלוויזיה, ברדיו ובכתבות של ה־BBC.<ref name="bbc" /><ref>{{cite web | url=http://www.sueblack.co.uk/press.html | title=Dr Sue Black: Press | url-status=dead | archive-url=https://web.archive.org/web/20090411121257/http://www.sueblack.co.uk/press.html | archive-date=11 April 2009}}</ref><ref>{{cite news| last=Smyth | first=Chris | url=http://www.timesonline.co.uk/tol/news/politics/article4387286.ece | title=Scientists send clear message: save Bletchley Park | newspaper=[[The Times]] | date=24 July 2008 }}</ref><ref>{{cite news| last=Arthur | first=Charles | url=https://www.theguardian.com/technology/2009/sep/29/bletchley-park-lottery-grant | title=Bletchley Park's codebreakers get glimpse of lottery funding | newspaper=[[The Guardian]] | date=29 September 2009 }}</ref>

=== פוליטיקה ===
במרץ 2019 מפלגת השוויון לנשים הודיעה כי בלאק היא המועמדת שלה בבחירות 2021 לראשות עיריית לונדון.<ref>{{Cite web|url=https://www.womensequality.org.uk/new_interim_leader_mayoral_candidate|title=Women's Equality Party announces Interim Leader and London Mayoral Candidate|website=Women's Equality Party|language=en-GB|access-date=2019-10-04}}</ref> בפברואר 2020 יצאה הודעה כי בלאק פרשה ממועמדותה משיקולי בריאות, והוחלפה ב[[מאנדו רייד]]<ref>{{cite news|url=https://www.theguardian.com/politics/2020/feb/16/womens-equality-party-candidate-pulls-out-of-london-mayoral-race|title=Women's Equality party candidate pulls out of London mayoral race|first=Kate|last=Proctor|work=The Guardian|date=16 February 2020|accessdate=16 February 2020}}</ref>

=== פרסים והצטינויות ===
ב-2009 הייתה בלאק הזוכה הראשונה בפרס ג'ון איבינסון<ref>{{cite web|url=http://www.bcs.org/content/conWebDoc/32424|title=First BCS John Ivinson Award Goes to Dr Sue Black|publisher=[[British Computer Society]]|accessdate=16 July 2014}}</ref> של אגודת המחשבים הבריטית ב[[חברה המלכותית]] בלונדון. ב־2011 היא זכתה בפרס ההשראה הנשית של [[פפסיקו]].<ref>{{Cite web |url=http://pepsicowin.com/2011/08/23/if-i-can-do-it-so-can-you…/ |title=PepsiCo Women's Inspiration Award Winner – If I can do it, so can you… |last=Black |first=Sue |date=23 August 2011 |publisher=PepsiCo WIN |archive-url=https://web.archive.org/web/20120605031541/http://pepsicowin.com/2011/08/23/if-i-can-do-it-so-can-you…/ |archive-date=5 June 2012 |access-date=7 January 2016}}</ref>

בלאק גם הייתה אחת מ־30 נשים שהופיעו בקמפיין "נשים ב־IT" של אגודת המחשבים הבריטית ב־2014, ושסיפורן הופיע בספר האלקטרוני "נשים ב־IT: השראה לדור הבא" שהוציאה האגודה.<ref>{{cite book|title=Women in IT: Inspiring the next generation|date=1 October 2014|publisher=British Computer Society|isbn=978-1-78017-287-3|page=57|url=http://www.bcs.org/upload/pdf/women-it.pdf|accessdate=14 October 2014}}</ref>

ב-2015 הופיעה במקום השביעי ברשימת הנשים המשפיעות ביותר בתחום ה־IT בבריטניה של המגזין Computer Weekly.<ref>{{cite web|url = http://www.computerweekly.com/photostory/4500249403/Top-50-Most-Influential-Women-in-UK-IT-2015/7/7-Sue-Black-Founder-Techmums-Bletchley-Park-campaigner|website = Computer Weekly|accessdate = 11 July 2015|title = The 50 most influential women in UK IT 2015}}</ref>

ב-2016 הפכה לקצינה ב[[מסדר האימפריה הבריטית]] (OBE) על תרומתה בתחום הטכנולוגי.<!-- <ref>{{London Gazette|issue=61450|supp=y|page=N11|date=30 December 2015}}</ref> !--><ref name="Cellan-Jones">{{cite web|url=https://www.bbc.co.uk/news/technology-35202667|title=OBE for Bletchley campaigner Sue Black|last=Cellan-Jones|first=Rory|date=30 December 2015|publisher=[[BBC]]|accessdate=30 December 2015}}</ref><ref>{{Cite web|title = New Year's Honours 2016: CSV|url = https://www.gov.uk/government/uploads/system/uploads/attachment_data/file/489050/NewYearHonoursList2016.csv/preview|publisher = Government of the United Kingdom|accessdate = 30 December 2015|date = 30 December 2015|series = New Year's Honours 2016}}</ref>

ב-2017 זכתה בפרס על אימפקט חברתי מהמוסד האמריקאי AnitaB.org לקידום נשים בטכנולוגיה.<ref>{{cite web|url=https://anitab.org/profiles/abie-award-winners/social-impact/sue-black/|title=Dr. Sue Black OBE - AnitaB.org|date=1 August 2017|publisher=anitab.org|accessdate=14 November 2017}}</ref><ref>{{cite web|url=https://anitab.org/awards-grants/abie-awards/|title=ABIE Awards - AnitaB.org|publisher=anitab.org|accessdate=14 November 2017}}</ref>

==קישורים חיצוניים==
* {{אתר רשמי|https://www.sueblack.co.uk/}}
{{ויקישיתוף בשורה|Category:Sue Black (computer scientist)}}
{{פרופילי מדענים|פרויקט הגנאלוגיה במתמטיקה=103014|dblp=91/3071|גוגל סקולר=wpkjKkgAAAAJ}}

==הערות שוליים==
{{הערות שוליים}}

{{בקרת זהויות}}
{{ערך יתום}}
{{מיון רגיל:בלק, סו}}

[[קטגוריה:קצינים במסדר האימפריה הבריטית]]
[[קטגוריה:בוגרות אוניברסיטאות ומכללות בממלכה המאוחדת]]
[[קטגוריה:בוגרי אוניברסיטאות ומכללות בממלכה המאוחדת]]
[[קטגוריה:בריטיות שנולדו ב-1962]]
[[קטגוריה:בריטים שנולדו ב-1962]]
{{וח}}
{{מיון ויקיפדיה|דף=סו בלאק (מדענית מחשב)|גרסה=39204017|פריט=Q11470|תאריך=יולי 2025}}

      `;
      expect(()=>getTemplates(wikitext)).to.not.throw();
    });
    it("not throw on single curly braces",()=>{
      const text = `{{אין לבלבל עם|יעילות קוונטית}}

'''ה[[נצילות]] הקוונטית''' (מסמנים <math>\Phi</math> או <math>QY</math>) של תהליך שנוצר על ידי [[קרינה]] היא מספר הפעמים שמתרחש אירוע ספציפי לכל [[פוטון]] שנספג על ידי המערכת. "האירוע", הוא בדרך כלל סוג של [[תגובה כימית]].

== יישומים ==
הנצילות הקוונטית של התפרקות [[מולקולה|מולקולת]] [[מגיב]] ב[[תגובה כימית]] מוגדרת באופן הבא:
<center>
::<math> \Phi = \frac{\rm \#\ molecules \ decomposed} {\rm \#\ photons \ absorbed} </math>
</center>

כלומר, היחס בין מספר המולקולות שהתפרקו לבין מספר ה[[פוטונים]] ש[[בליעה (קרינה אלקטרומגנטית)|נבלעו]].

הנצילות הקוונטית באירוע אחר, [[פלואורסצנציה]], מוגדרת באופן הבא:{{הערה|שם=הערה מספר 20180103071249:0| Lakowicz, Joseph R. ''Principles of Fluorescence Spectroscopy'' (Kluwer Academic / Plenum Publishers 1999) p.10. {{ISBN|978-0-387-31278-1}}}}

<center>

::<math> \Phi = \frac {\rm \#\ photons \ emitted} {\rm \#\ photons \ absorbed} </math>
</center>

כלומר, היחס בין מספר ה[[פוטונים]] ש[[פליטה ספונטנית|נפלטו]] לבין מספר ה[[פוטונים]] ש[[בליעה (קרינה אלקטרומגנטית)|נבלעו]].

==דוגמאות ==
נצילות קוונטית משמשת במידול [[פוטוסינתזה]]:{{הערה|Skillman JB (2008). "Quantum yield variation across the three pathways of photosynthesis: not yet out of the dark". ''J. Exp. Bot.'' '''59''' (7): 1647–61. doi:[https://doi.org/10.1093%2Fjxb%2Fern029 10.1093/jxb/ern029]. PMID [https://www.ncbi.nlm.nih.gov/pubmed/18359752 18359752].}}

<center>

::<math> \Phi = \frac {\rm \mu mol\ CO_2 \ fixed} {\rm \mu mol\ photons \ absorbed} </math>
</center>

בתהליך פירוק [[פוטוכימיה|פוטוכימי]], כאשר מולקולה [[דיסוציאציה (כימיה)|מתפרדת]] לאחר [[בליעה (קרינה אלקטרומגנטית)|בליעת אור]], הנצילות הקוונטית היא היחס בין מספר המולקולות המפורקות לבין מספר הפוטונים שנבלעים על ידי המערכת. מאחר שלא כל הפוטונים נספגים באופן פרודוקטיבי, הנצילות הקוונטית האופיינית תהיה קטנה מ -1.

נצילויות קוונטיות גדולות מ-1 אפשריות עבור [[תגובת שרשרת גרעינית|תגובת שרשרת]] מבוססת [[קרינה]] או [[פוטוניקה]], כאשר פוטון בודד מעורר שרשרת של טרנספורמציות. דוגמה אחת היא תגובה של [[מימן]] עם [[כלור]] שבה ניתן לייצר <math>10^6</math> מולקולות של [[מימן כלורי]] פר מנה של אור [[כחול]] שנבלע.{{הערה| Laidler K.J., ''Chemical Kinetics'' (3rd ed., Harper & Row 1987) p.289 {{ISBN|0-06-043862-2}}}}

ב[[ספקטרוסקופיה]] אופטית, נצילות קוונטית היא ההסתברות שמצב קוונטי מסוים ייווצר ממצב קוונטי התחלתי נתון. לדוגמה, במעבר ממצב [[סינגלט]] למצב [[טריפלט]], הנצילות נקבעת על פי מספר המולקלות שעברו על ידי [[עירור|עירור אופטי]] ממצב אחד למשנהו.

באופן אמפירי, ניתן למדוד נצילות קוונטית פלאורסצנטית יחסית (לדוגמה מסוימת) בהשוואה לנצילות קוונטית ידועה (למשטח ייחוס):{{הערה|שם=הערה מספר 20180103071249:0}}

<center>

<math>\Phi = \Phi_\mathrm{R}\times\frac{\mathit{Int}}{\mathit{Int}_\mathrm{R}}\frac{1-10^{-A_\mathrm{R}}}{1-10^{-A}}\frac{{n}^2}{{n_\mathrm{R}}^2}</math>

</center>

כאשר R מציין ערכי ייחוס, ''Int'' הוא [[אינטגרל]] המהווה את השטח תחת "פיק" ה[[פליטה ספונטנית|פליטה]], ''A'' היא ה[[צפיפות אופטית|צפיפות האופטית]] ב[[אורך גל]] ה[[בליעה (קרינה אלקטרומגנטית)|בליעה]] ו-''n'' הוא [[מקדם שבירה|מקדם השבירה]] של ה[[תמיסה]].{{הערה|Albert M. Brouwer, [http://www.iupac.org/publications/pac/83/12/2213/ Standards for photoluminescence quantum yield measurements in solution] (IUPAC Technical Report), Pure Appl. Chem., Vol. 83, No. 12, pp. 2213–2228, 2011. doi:10.1351/PAC-REP-10-09-31.}}

== ראו גם ==
* [[יעילות קוונטית]]

== הערות שוליים ==
{{הערות שוליים|יישור=שמאל}}

[[קטגוריה:ערכים שבהם תבנית בריטניקה אינה מתאימה]]
[[קטגוריה:קרינה]]
[[קטגוריה:ספקטרוסקופיה]]
[[קטגוריה:פוטוכימיה]]
{{וח}}
{{מיון ויקיפדיה|דף=נצילות קוונטית|גרסה=40610385|פריט=Q2856048|תאריך=יולי 2025}}
      `;
      expect(()=>getTemplates(text)).to.not.throw();
    })
  });
});
