const cheerio = require("cheerio");
const rp = require("request-promise-native");
const fs = require("fs");
var async = require("async");

function process_results(body, id) {
  let $ = cheerio.load(body);

  let drink_elem = $("h1");
  let drink = drink_elem.text().trim();

  let ingred_section = $("ul").children();

  let ingreds = [];
  ingred_section.each(function(i, e) {
    ingreds[i] = $(this)
      .contents()
      .first()
      .next()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, "");
  });

  let alcohol = $(
    "body > table:nth-child(5) > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td > small"
  )
    .contents()
    .text();
  return { id: id, name: drink, ingredients: ingreds, alcohol: alcohol };
}

var urls = [];
const max_drinks = 20;
// const max_drinks = 6217;
for (let i = 1; i <= max_drinks; i++) {
  let URL = "https://www.webtender.com/db/drink/" + i;
  urls.push(URL);
}

async.mapLimit(
  urls,
  5,
  async function(url) {
    const response = await rp.get({ uri: url, encoding: "latin1" });
    return response;
  },
  (err, results) => {
    if (err) throw err;

    var obj = [];
    Promise.all(results)
      .then(results => {
        for (let i = 0; i < results.length; i++) {
          obj[i] = process_results(results[i], i + 1);
        }
      })
      .then(() => {
        fs.writeFile("webtender.json", JSON.stringify(obj), "utf8", err => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Success");
        });
      })
      .catch(err => console.log(err));
  }
);
