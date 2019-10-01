const db = require("../../db");
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

		error: !user ? "invalidCredentials" : undefined

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

router.get("/template/:id", (req, res, next) => {

	const template = db.templates.findTemplate(_ => _.id === req.params.id);

	if (template) res.json(template);
	else next();

});

module.exports = router;
