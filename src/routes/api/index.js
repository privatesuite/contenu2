const fs = require("fs");
const db = require("../../db");
const path = require("path");
const clone = require("../../utils/clone");
const express = require("express");
const session = require("../../utils/session");

const router = express.Router();

router.use(require("cors")());

router.post("/login", (req, res) => {

	const respondWith = req.query.respond_with || "json";
	const user = db.users.authenticate(req.body.username, req.body.password);

	if (respondWith === "cookies") {
		
		if (user) {

			res.cookie("token", session.create({

				username: user.username

			}), {

				path: req.query.path
				
			});

		}

		res.redirect(req.query.redirect || "/");

	} else if (respondWith === "json") res.json({

		token: user ? session.create({

			username: user.username

		}) : undefined,

		message: !user ? "invalid_credentials" : undefined

	})

});

router.get("/elements", (req, res) => {

	res.json(db.elements.elements());
	// res.json(db.elements.elements().map(_ => {const t = db.templates.findTemplate(__ => __.id === _.template); if (t) _.template_name = t.name; else _.template_name = "Unknown"; return _;}));

});

router.get("/templates", (req, res) => {

	res.json(db.templates.templates());

});

router.get("/element/:id", (req, res, next) => {

	const element = db.elements.findElement(_ => _.id === req.params.id);

	if (element) res.json(element);
	else next();

});

router.post("/element/:id/edit", async (req, res, next) => {

	const element = db.elements.findElement(_ => _.id === req.params.id);

	if (typeof req.body.fields === "object" && element) {

		await db.elements.editElement(element._id, {

			...element,
			fields: req.body.fields,
			template: req.body.template

		});

		res.json({

			message: "success"

		});

	} else next();

});

router.get("/template/:id", (req, res, next) => {

	const template = db.templates.findTemplate(_ => _.id === req.params.id);

	if (template) res.json(template);
	else next();

});

router.post("/clone", async (req, res) => {

	if (req.body.url) {

		await clone(req.body.url, req.body.branch || "master");

		if (req.query.redirect) {

			res.redirect(req.query.redirect);
			return;

		}

		res.json({

			message: "success"

		});

	} else res.json({

		message: "invalid_body"

	});

});

router.get("/file/:file", (req, res) => {

	if (fs.existsSync(path.join(__dirname, "..", "..", "..", "files", req.params.file))) {

		res.writeHead(200, {
			
			"Content-Type": "application/octet-stream"

		});

		fs.createReadStream(path.join(__dirname, "..", "..", "..", "files", req.params.file)).pipe(res);

	} else {

		res.end(JSON.stringify({
		
			message: "invalid_file"
		
		}));

	}

});

router.post("/files/rename", (req, res) => {

	const token = session.extract((req.headers.authorization || "").replace(/bearer/i, "").trim());
	if (!token) res.json({

		message: "invalid_credentials"

	});

	const user = db.users.findUser(_ => _.username === token.username);
	
	if (user && user.perm_type === "admin") {

		if (typeof req.body.from === "string" && fs.existsSync(path.join(__dirname, "..", "..", "..", "files", req.body.from)) && typeof req.body.to === "string") {

			fs.renameSync(path.join(__dirname, "..", "..", "..", "files", req.body.from), path.join(__dirname, "..", "..", "..", "files", req.body.to));

			res.json({

				message: "success"

			});

		} else {
			
			res.json({

				message: "invalid_body"

			});

		}

	} else {

		res.json({

			message: "insufficient_permissions"

		});

	}

});

module.exports = router;
