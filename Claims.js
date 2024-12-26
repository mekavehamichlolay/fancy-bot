export class Claims {
    claims = {};
  
    /**
     * @param {{}} claims
     */
    constructor(claims) {
      this.reset(claims);
    }
  
    /**
     *
     * @param {{}} claims
     */
    reset(claims) {
      for (const key in this.claims) {
        if (key in claims) {
          continue;
        }
        this.claims[key] = "";
      }
      for (const key in claims) {
        if (key === "P1559") {
          this.claims[key] = {
            text: claims[key][0].mainsnak.datavalue.value.text,
            language: claims[key][0].mainsnak.datavalue.value.language,
          };
          continue;
        }
        this.claims[key] = claims[key][0].mainsnak.datavalue?.value || "";
      }
    }
  
    /**
     *
     * @param {String} property
     * @param {String} param
     * @returns {String}
     */
    getClaim(property, param) {
      if (!this.claims[property]) {
        return "";
      }
      if (property === "P1559") {
        return param === "שפה"
          ? this.claims[property].language
          : this.claims[property].text.replace(/\=/g, "{{=}}");
      }
      return this.claims[property].replace(/\=/g, "{{=}}");
    }
  }