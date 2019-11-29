const db = require("./db");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const sha512 = require("js-sha512");
const config = require("./utils/config");
const express = require("express");
const compression = require("compression");

const args = require("minimist")(process.argv.slice(2));

if (args.ignoreInvalidCertificate) {

	process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

}

(async () => {
	
	await db.init();

	if (db.users.users().length === 0) {

		console.log(`(core) New Contenu instance detected!`);

		const pass = `${Math.random().toString(36).replace("0.", "")}$${Math.random().toString(36).replace("0.", "")}`;
		console.log(`(core) Creating user "admin" with password "${pass}"`);
		
		const id = Math.random().toString(36).replace("0.", "");
			
		await db.users.insertUser({
				
			id,
			perm_type: "admin",
			username: "admin",
			email: "admin@localhost",
			password: sha512.sha512(pass),
			fields: {}
				
		});

	}

	if (!fs.existsSync(path.join(__dirname, "..", "files"))) {

		console.log(`(core) Creating "files" directory`);
		fs.mkdirSync(path.join(__dirname, "..", "files"));

	}

	if (!fs.existsSync(path.join(__dirname, "..", "www"))) {

		console.log(`(core) Creating "www" directory`);
		fs.mkdirSync(path.join(__dirname, "..", "www"));

	}

	console.log(`(core) Starting Contenu with config "${args.config || "dev"}"`);
	config.loadConfig(path.join(__dirname, "..", "config", (args.config || "dev") + ".conf"));

	const app = express();
	
	app.use(require("cookie-parser")());
	app.use(require("body-parser").json());
	app.use(require("body-parser").urlencoded({extended: true}));
	app.use(compression());

	app.use((req, res, next) => {

		if (!req.secure && config().server.secure) {

			if (req.isSocket) return res.redirect(`wss://${req.headers.host}${req.url}`);

			return res.redirect(`https://${req.headers.host}${req.url}`);

		} else {
		
			res.locals = {

				config: config()

			}
			next();

		}

	});

	app.set("view engine", "ejs");

	app.use("/api", require("./routes/api"));

	if (config().admin.enabled) app.use(config().admin.basePath || "/admin", require("./routes/admin"));

	const www = require("./routes/www");
	www.sync();
	app.use(www);

	http.createServer(app).listen(config().server.port);
	if (config().server.secure) https.createServer({

		ca: config().server.caPath ? fs.readFileSync(path.join(__dirname, "..", config().server.caPath)) : undefined,
		key: fs.readFileSync(path.join(__dirname, "..", config().server.keyPath || "server.key")),
		cert: fs.readFileSync(path.join(__dirname, "..", config().server.certPath || "server.cert"))

	}, app).listen(config().server.securePort || 443);

})();
