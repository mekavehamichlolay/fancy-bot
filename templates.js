import { Claims, Template } from "./getWikidataData.js";

class Templates {
  list = [
    {
      name: `ויקישיתוף בשורה`,
      regExp: /\{\{ויקישיתוף\sבשורה\s?\|?\s?\}\}/,
      parameters: [{ claim: "P373", param: "", text: "Category:" }],
    },
    {
      name: "מיזמים",
      regExp: /\{\{מיזמים\|?\}\}/,
      parameters: [{ claim: "P373", param: "ויקישיתוף", text: "Category:" }],
    },
    {
      name: `מידע טקסונומי`,
      regExp: /\{\{מידע\sטקסונומי\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P815", param: "ITIS", text: "" },
        { claim: "P685", param: "NCBI", text: "" },
        { claim: "P4024", param: "Animal Diversity Web", text: "" },
        { claim: "P2833", param: "ARKive", text: "" },
        { claim: "P830", param: "האנציקלופדיה של החיים", text: "" },
        { claim: "P938", param: "FishBase", text: "" },
        { claim: "P3099", param: "Internet Bird Collection", text: "" },
        { claim: "P3746", param: "צמח השדה", text: "" },
        { claim: "P3795", param: "צמחיית ישראל ברשת", text: "" },
        { claim: "P960", param: "Tropicos", text: "" },
        { claim: "P846", param: "GBIF", text: "" },
        { claim: "P1070", param: "TPList", text: "" },
        { claim: "P961", param: "IPNI", text: "" },
      ],
    },
    {
      name: `בריטניקה`,
      regExp: /\{\{בריטניקה\s?\|?\s?\}\}/,
      parameters: [{ claim: "P1417", param: "", text: "" }],
    },
    {
      name: `Find a Grave`,
      regExp: /\{\{(Find\sa\sGrave|Findagrave|מצא\sקבר)\s?\|?\}\}/,
      parameters: [{ claim: "P535", param: "", text: "" }],
    },
    {
      name: `אתר רשמי`,
      regExp: /\{\{אתר\sרשמי\s?\|?\s?\}\}/,
      parameters: [{ claim: "P856", param: "", text: "" }],
    },
    {
      name: `רשתות חברתיות`,
      regExp: /\{\{רשתות\sחברתיות\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P2013", param: "פייסבוק", text: "" },
        { claim: "P2002", param: "טוויטר", text: "" },
        { claim: "P2003", param: "אינסטגרם", text: "" },
        { claim: "P7085", param: "טיקטוק", text: "" },
        { claim: "P3185", param: "VK", text: "" },
        { claim: "P3789", param: "טלגרם", text: "" },
        { claim: "P6634", param: "לינקדין1", text: "" },
        { claim: "P4264", param: "לינקדין2", text: "" },
        { claim: "P2397", param: "יוטיוב", text: "" },
        { claim: "P5797", param: "טוויצ'", text: "" },
        { claim: "P4015", param: "וימאו", text: "" },
        { claim: "P1581", param: "בלוג", text: "" },
      ],
    },
    {
      name: `פרופילי מדענים`,
      regExp: /\{\{פרופילי\sמדענים\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P8024", param: "פרס נובל", text: "" },
        { claim: "P549", param: "פרויקט הגנאלוגיה במתמטיקה", text: "" },
        { claim: "P1563", param: "MacTutor", text: "" },
        { claim: "P2030", param: `נאס"א`, text: "" },
        { claim: "P2456", param: "dblp", text: "" },
        { claim: "P2038", param: "ResearchGate", text: "" },
        { claim: "P1960", param: "גוגל סקולר", text: "" },
        { claim: "P5715", param: "Academia", text: "" },
        { claim: "P6479", param: "IEEE", text: "" },
        { claim: "P3747", param: "SSRN", text: "" },
        { claim: "P3874", param: "Justia", text: "" },
      ],
    },
    {
      name: `פרופילי מוזיקאים`,
      regExp: /\{\{פרופילי\sמוזיקאים\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P4071", param: "זמרשת", text: "" },
        { claim: "P4034", param: "שירונט", text: "" },
        { claim: "P2850", param: "iTunes", text: "" },
        { claim: "P1902", param: "Spotify", text: "" },
        { claim: "P3040", param: "SoundCloud", text: "" },
        { claim: "P3192", param: "Last", text: "" },
        { claim: "P1287", param: "Komponisten", text: "" },
        { claim: "P1728", param: "AllMusic", text: "" },
        { claim: "P434", param: "MusicBrainz", text: "" },
        { claim: "P1989", param: "MetallumA", text: "" },
        { claim: "P1952", param: "MetallumB", text: "" },
        { claim: "P2164", param: "SIGIC", text: "" },
        { claim: "P2514", param: "Jamendo", text: "" },
        { claim: "P2722", param: "דיזר", text: "" },
        { claim: "P1553", param: "יאנדקס", text: "" },
        { claim: "P3674", param: "מוטופיה", text: "" },
        { claim: "P1953", param: "Discogs", text: "" },
        { claim: "P3478", param: "Songkick", text: "" },
        { claim: "P3839", param: "Tab4u", text: "" },
        { claim: "P2373", param: "Genius", text: "" },
        { claim: "P3952", param: "סטריאו ומונו", text: "" },
        { claim: "P3997", param: "בית לזמר", text: "" },
        { claim: "P2909", param: "SecondHandSongs", text: "" },
        { claim: "P2510", param: "DNCI", text: "" },
        { claim: "P3283", param: "בנדקמפ", text: "" },
        { claim: "P4208", param: "בילבורד", text: "" },
      ],
    },
    {
      name: `פרופילי אנציקלופדיות`,
      regExp: /\{\{פרופילי\sאנציקלופדיות\s?\|?\}\}/,
      parameters: [
        { claim: "P8590", param: "האנציקלופדיה היהודית", text: "" },
        { claim: "P12134", param: "מסע אל העבר", text: "" },
        { claim: "P3710", param: "דעת", text: "" },
        { claim: "P10717", param: "אנציקלופדיה של הרעיונות", text: "" },
        { claim: "P1296", param: "האנציקלופדיה הקטלאנית", text: "" },
        { claim: "P6337", param: "Half-Life 2", text: "" },
        { claim: "P2812", param: "MathWorld", text: "" },
        { claim: "P3012", param: "אנציקלופדיה איראניקה", text: "" },
        {
          claim: "P5088",
          param: "אנציקלופדיה אינטרנטית לפסיכולוגיה",
          text: "",
        },
        { claim: "P1417", param: "בריטניקה", text: "" },
      ],
    },
    {
      name: `פרופילי חברות`,
      regExp: /\{\{פרופילי\sחברות\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P2088", param: "Crunchbase", text: "" },
        { claim: "P5531", param: "EDGAR", text: "" },
      ],
    },
    {
      name: `מידע בורסאי`,
      regExp: /\{\{מידע\sבורסאי\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P2088", param: "Crunchbase", text: "" },
        { claim: "P3377", param: "בלומברג", text: "" },
      ],
    },
    {
      name: `מידע בורסאי (לונדון)`,
      regExp: /\{\{מידע\sבורסאי\s(לונדון)\s?\|?\s?\}\}/,
      parameters: [{ claim: "P2088", param: "Crunchbase", text: "" }],
      parametersText: [],
    },
    {
      name: `ביו-קונגרס`,
      regExp: /\{\{ביו\-קונגרס\s?\|?\s?\}\}/,
      parameters: [{ claim: "P1157", param: "", text: "" }],
    },
    {
      name: `ביו-נובל`,
      regExp: /\{\{ביו\-נובל\s?\|?\s?\}\}/,
      parameters: [{ claim: "P8024", param: "", text: "" }],
    },
    {
      name: `ביו-נאס"א`,
      regExp: /\{\{ביו\-נאס\"א\s?\|?\s?\}\}/,
      parameters: [{ claim: "P2030", param: "", text: "" }],
    },
    {
      name: `MathWorld`,
      regExp: /\{\{MathWorld\s?\|?\s?\}\}/,
      parameters: [{ claim: "P2812", param: "", text: "" }],
    },
    {
      name: `גיידסטאר`,
      regExp: /\{\{גיידסטאר\s?\|?\s?\}\}/,
      parameters: [{ claim: "P3914", param: "", text: "" }],
    },
    {
      name: `SIMBAD`,
      regExp: /\{\{SIMBAD\s?\|?\s?\}\}/,
      parameters: [{ claim: "P3083", param: "", text: "" }],
    },
    {
      name: `אתר החכם היומי`,
      regExp: /\{\{אתר\sהחכם\sהיומי\s?\|?\s?\}\}/,
      parameters: [{ claim: "P10776", param: "", text: "" }],
    },
    {
      name: `CIA factbook`,
      regExp: /\{\{CIA factbook\s?\|?\s?\}\}/,
      parameters: [{ claim: "P9948", param: "", text: "" }],
    },
    {
      name: `אנציקלופדיית ההיסטוריה העולמית`,
      regExp: /\{\{אנציקלופדיית ההיסטוריה העולמית\}\}/,
      parameters: [{ claim: "P9000", param: "", text: "" }],
    },
    {
      name: `שם בשפת המקור`,
      regExp: /\{\{שם\sבשפת\sהמקור\s?\|?\s?\}\}/,
      parameters: [
        { claim: "P1559", param: "שם", text: "" },
        { claim: "P1559", param: "שפה", text: "" },
        { claim: "P443", param: "קובץ", text: "" },
      ],
    },
    {
      name: `דף שער בספרייה הלאומית`,
      regExp: /\{\{דף שער בספרייה הלאומית\}\}/,
      parameters: [{ claim: "P3997", param: "", text: "" }],
    },
    {
      name: `אנצ יהודית`,
      regExp: /\{\{אנצ יהודית\}\}/,
      parameters: [{ claim: "P8590", param: "", text: "" }],
    },
  ];
  /**
   * @type {Template[]}
   */
  templateList = [];

  constructor() {
    this.templateList = this.list.map(
      (template) =>
        new Template(template.name, template.regExp, template.parameters)
    );
  }
  check(text) {
    for (let i = 0; i < this.templateList.length; i++) {
      if (this.templateList[i].regex.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 
   * @param {String} text 
   * @param {Claims[]} claims 
   * @returns {String}
   */
  updateText(text, claims) {
    for (let i = 0; i < this.templateList.length; i++) {
      text = this.templateList[i].changeText(text, claims);
    }
    return text;
  }
}

export default Templates;