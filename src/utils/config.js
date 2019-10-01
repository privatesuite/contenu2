const fs = require("fs");
const ini = require("ini");

let conf;

module.exports = () => conf;
module.exports.loadConfig = file => conf = ini.parse(fs.readFileSync(file).toString());
