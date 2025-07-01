export class Country {
  wikiDataParams = {
    action: "wbgetentities",
    format: "json",
    uselang: "he",
    sites: "hewiki",
    props: "sitelinks",
    languages: "he",
    formatversion: "2",
  };
  wikiDataURL = "https://www.wikidata.org/w/api.php?";
  constructor() {}
  async getName(country) {
    if (!country) {
      return "";
    }
    if (this[country] !== undefined) {
      return this[country];
    }
    const url = `${this.wikiDataURL}${new URLSearchParams({
      ...this.wikiDataParams,
      ids: country,
    })}`;
    return await fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.entities?.[country]?.sitelinks?.hewiki?.title) {
          return this.setName(
            country,
            data.entities[country].sitelinks.hewiki.title
          );
        } else {
          throw new Error(`Country ${country} not found`);
        }
      })
      .catch((error) => {
        return this.setName(country, "");
      });
  }
  setName(country, data) {
    this[country] = data;
    return data;
  }
}
