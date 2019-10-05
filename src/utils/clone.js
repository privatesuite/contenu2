const fs = require("fs");
const path = require("path");
const clone = require("git-clone");
const rimraf = require("rimraf");

const www = path.join(__dirname, "..", "..", "www");
const wwwRoute = require("../routes/www");

module.exports = async (url, branch, to = www) => {

	if (fs.existsSync(to)) rimraf.sync(to);
	else fs.mkdirSync(to);

	await (new Promise(resolve => {
		
		clone(url, to, {

			checkout: branch

		}, () => {

			resolve();

			wwwRoute.sync();

		});

	}));

}
