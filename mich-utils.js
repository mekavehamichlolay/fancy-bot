
const diffs = [
  {
    name: "רבי",
    michlol: /^רבי\s[^$]/,
    wikipedia: "",
  },
  {
    name: "הרב",
    michlol: /^הרב\s[^$]/,
    wikipedia: "",
  },
  {
    name: "הקדוש",
    michlol: /ה\"קדוש\"/g,
    wikipedia: "הקדוש",
  },
  {
    name: "הקדושה",
    michlol: /ה\"קדושה\"/g,
    wikipedia: "הקדושה",
  },
  {
    name: "הקדושים",
    michlol: /ה\"קדושים\"/g,
    wikipedia: "הקדושים",
  },
  {
    name: "אל",
    michlol: /א\-ל/g,
    wikipedia: "אל",
  },
  {
    name: "דמות מקראית",
    michlol: /אישיות_מהתנ\"ך/g,
    wikipedia: "דמות מקראית",
  },
];

export function nameToCheck(name) {
    const diffrentArray = diffs.filter((diff) => diff.michlol.test(name));
    if (!diffrentArray.length) return name;
    for (let a = 0; a < diffrentArray.length; a++) {
      name = name.replace(diffrentArray[a].michlol, diffrentArray[a].wikipedia);
    }
    return name;
  }