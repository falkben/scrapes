const rp = require("request-promise-native");
const fs = require("fs");
var async = require("async");

// load the ids JSON data

const ids = JSON.parse(fs.readFileSync("cocktaildb_IDs.json"));

var headersOpt = {
  "content-type": "application/json"
};

// for each ID, get the data as JSON
async.mapLimit(
  ids,
  20,
  async function(id) {
    const response = await rp.get({
      uri: "https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=" + id,
      resolveWithFullResponse: true,
      headers: headersOpt,
      json: true
    });
    if (response.statusCode == 200) {
      return response.body;
    } else {
      return "";
    }
  },
  (err, results) => {
    if (err) console.log(err);
    var data = [];
    Promise.all(results)
      .then(results => {
        for (let i = 0; i < results.length; i++) {
          let drink = results[i].drinks[0];
          let id = drink.idDrink;
          let name = drink.strDrink;
          let ingredients = [];
          let measures = [];
          for (let ii = 1; ii <= 15; ii++) {
            let ingred = eval("drink.strIngredient" + ii.toString());
            if (ingred != "") {
              ingredients.push(ingred);
              let meas = eval("drink.strMeasure" + ii.toString());
              measures.push(meas);
            } else {
              break;
            }
          }
          let alcoholic = drink.strAlcoholic;
          let glass = drink.strGlass;
          data.push({
            id: id,
            name: name,
            ingredients: ingredients,
            measures: measures,
            alcoholic: alcoholic,
            glass: glass
          });
        }
      })
      .then(() => {
        fs.writeFile("cocktaildb.json", JSON.stringify(data), "utf8", err => {
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

// save them all to a single JSON file
