const path = require("path");
const Streamlet = require("streamletdb");

const db = new Streamlet(path.join(__dirname, "..", "..", "database"));

module.exports = {

	db,
	init: () => db.init(),

	users: require("./users")(db),
	elements: require("./elements")(db),
	templates: require("./templates")(db)

}
