const cheerio = require("cheerio");
const rp = require("request-promise-native");
const fs = require("fs");
var async = require("async");

// scrape website to get all the cocktails in the database
// for each letter get all the cocktails on the page
// https://www.thecocktaildb.com/browse.php?b=a

const letters = "abcdefghijklmnopqrstuvwxyz".split("");
// const letters = "ab".split("");

function load_cocktails(body) {
  let $ = cheerio.load(body);
  let filter = "div.row > div.col-sm-3 > a:nth-child(1)";
  let items = $(filter);
  cocktails = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].attribs.href.search("php.net") == -1) {
      cocktails.push(items[i].attribs.href.replace("/drink/", ""));
    }
  }
  return cocktails;
}

var urls = [];
for (i = 0; i < letters.length; i++) {
  let url = "https://www.thecocktaildb.com/browse.php?b=" + letters[i];
  urls.push(url);
  console.log(url);
}

async.mapLimit(
  urls,
  15,
  async function(url) {
    const response = await rp.get({
      uri: url,
      //   encoding: "latin1",
      resolveWithFullResponse: true
    });
    if (response.statusCode == 200) {
      return response.body;
    } else {
      return "";
    }
  },
  (err, results) => {
    if (err) console.log(err);
    var all_cocktails = [];
    Promise.all(results)
      .then(results => {
        for (let i = 0; i < results.length; i++) {
          all_cocktails.push(...load_cocktails(results[i]));
        }
      })
      .then(() => {
        fs.writeFileSync("cocktaildb_IDs.json", JSON.stringify(all_cocktails));
      })
      .catch(err => console.log(err));
  }
);
