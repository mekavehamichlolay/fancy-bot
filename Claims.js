import { Country } from "./Country.js";

export class Claims {
  claims = {};
  /**
   * @type {Country}
   */
  countryClass = null;

  /**
   * @param {{}} claims
   * @param {Country} [countryClass]
   */
  constructor(claims, countryClass) {
    this.reset(claims);
    this.countryClass = countryClass;
  }

  /**
   *
   * @param {{}} claims
   */
  async reset(claims) {
    for (const key in this.claims) {
      if (key in claims) {
        continue;
      }
      if (key === "P1559") {
        this.claims[key] = {
          text: "",
          language: "",
        };
      }
      if (key === "P625") {
        this.claims.P625 = {
          latitude: "",
          longitude: "",
        };
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
      if (key === "P625") {
        this.claims.P625 = {
          latitude: claims[key][0].mainsnak.datavalue.value.latitude,
          longitude: claims[key][0].mainsnak.datavalue.value.longitude,
        };
        continue;
      }
      if (key === "P17" && this.countryClass) {
        if (!claims[key][0].mainsnak.datavalue?.value.id) {
          continue;
        }
        this.claims[key] = await this.countryClass.getName(
          claims[key][0].mainsnak.datavalue?.value.id
        );
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
    if (property === "P625") {
      return param === "רוחב"
        ? this.claims[property].latitude
        : this.claims[property].longitude;
    }
    return this.claims[property].replace(/\=/g, "{{=}}");
  }
}
