const fs = require("fs");
const db = require("../../db");
const path = require("path");
const mime = require("mime");
const express = require("express");
const session = require("../../utils/session");
const plugins = require("../../plugins");
const permissions = require("../../utils/permissions");

const router = express.Router();

router.use("/static", express.static(path.join(__dirname, "..", "..", "..", "static")));

router.use((req, res, next) => {

	if (!permissions.isTokenAdmin(req.cookies.token)) {

		res.render("admin/login", {

			baseUrl: req.baseUrl

		});
		return;

	}

	next();

});

router.get("/", (req, res) => {

	res.render("admin/dashboard", {

		baseUrl: req.baseUrl,

		token: permissions.getUserFromToken(req.cookies.token)

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

	if (!element && req.params.id !== "new") {

		next();
		return;

	}

	res.render("admin/element", {

		baseUrl: req.baseUrl,
		
		db,
		element: element ? element : {

			id: "new",
			template: "",
			fields: {}

		},
		templates: db.templates.templates()

	});

});

const wwwPath = path.join(__dirname, "..", "..", "..", "www");

router.get("/files", (req, res) => {

	res.render("admin/files", {

		cookies: req.cookies,
		baseUrl: req.baseUrl,

		mime,
		files: fs.readdirSync(path.join(__dirname, "..", "..", "..", "files")),
		wwwFiles: fs.existsSync(wwwPath) ? fs.readdirSync(wwwPath) : false

	});

});

router.get("/plugins", (req, res) => {

	res.render("admin/plugins", {

		baseUrl: req.baseUrl,
		plugins: plugins.getPlugins()		

	});

});

router.get("/security", (req, res) => {

	res.render("admin/security", {

		baseUrl: req.baseUrl
			
	});

});

router.get("/users", (req, res) => {

	res.render("admin/users", {

		baseUrl: req.baseUrl,

		db

	});

});

router.get("/user/:id", (req, res) => {

	const user = db.users.findUser(_ => _.id === req.params.id);

	if (!user && req.params.id !== "new") {

		next();
		return;

	}

	res.render("admin/user", {

		baseUrl: req.baseUrl,
		
		db,
		user: user ? user : {

			id: "new",
			username: "New User",
			email: ""

		}

	});

});

router.get("/templates", (req, res) => {

	res.render("admin/templates", {

		baseUrl: req.baseUrl,

		db

	});

});

router.get("/template/:id", (req, res, next) => {

	const template = db.templates.findTemplate(_ => _.id === req.params.id);

	if (!template && req.params.id !== "new") {

		next();
		return;

	}

	res.render("admin/template", {

		baseUrl: req.baseUrl,
		
		db,
		template: template ? template : {

			id: "new",
			name: "New Template"

		}

	});

});

module.exports = router;
