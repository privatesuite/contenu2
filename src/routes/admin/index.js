const fs = require("fs");
const db = require("../../db");
const path = require("path");
const express = require("express");
const session = require("../../utils/session");

const router = express.Router();

router.use((req, res, next) => {

	req.session = session.extract(req.cookies.token);

	if (!req.session.username) {

		res.render("admin/login", {

			baseUrl: req.baseUrl

		});
		return;

	}

	next();

});

router.get("/", (req, res) => {

	res.render("admin/dashboard", {

		baseUrl: req.baseUrl

	});

});

router.get("/elements", (req, res) => {

	res.render("admin/elements", {

		baseUrl: req.baseUrl,
		
		db

	});

});

router.get("/element/:id", (req, res, next) => {

	const element = db.elements.findElement(_ => _.id === req.params.id);

	if (!element) {

		next();
		return;

	}

	res.render("admin/element", {

		baseUrl: req.baseUrl,
		
		db,
		element

	});

});

const wwwPath = path.join(__dirname, "..", "..", "..", "www");

router.get("/files", (req, res) => {

	res.render("admin/files", {

		baseUrl: req.baseUrl,

		wwwFiles: fs.existsSync(wwwPath) ? fs.readdirSync(wwwPath) : false

	});

});

module.exports = router;
