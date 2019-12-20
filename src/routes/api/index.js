const fs = require("fs");
const db = require("../../db");
const path = require("path");
const clone = require("../../utils/clone");
const sha512 = require("js-sha512");
const multer = require("multer");
const express = require("express");

const storage = multer.diskStorage({

	destination (req, file, cb) {

		cb(null, path.join(__dirname, "..", "..", "..", "files"));

	},

	filename (req, file, cb) {

		cb(null, file.originalname);

	}

});

const upload = multer({

	storage

});

const session = require("../../utils/session");
const security = require("../../utils/security");
const permissions = require("../../utils/permissions");

const router = express.Router();

router.use(require("cors")());

const loginAttempts = new Map();

router.post("/login", (req, res) => {
	
	const respondWith = req.query.respond_with || "json";
	const user = db.users.authenticate(req.body.username, req.body.password);
	
	if (user) {
		
		console.log(`(security) ${user.username} successfully logged in from IP ${req.connection.remoteAddress}.!`);
		loginAttempts.set(user.username, 0);
		
	} else {

		console.log(`(security) ${req.body.username} has attempted to log in ${(loginAttempts.get(req.body.username) || 0) + 1} time(s) from IP ${req.connection.remoteAddress}.`);
		loginAttempts.set(req.body.username, (loginAttempts.get(req.body.username) || 0) + 1);

	}

	if (loginAttempts.get(req.body.username) >= 3) {

		const user1 = db.users.findUser(_ => _.username === req.body.username);

		if (user1) {

			const email = user1.email;
			console.log(`(security) Sending email to ${email}.`)

			security.sendLoginAttemptEmail(req.body.username, email, req.connection.remoteAddress);
			loginAttempts.set(req.body.username, 0);

		}

	}

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

// Public API

router.get("/users", (req, res) => {
	
	res.json(db.users.users().map(_ => ({

		..._,
		email: "",
		password: ""

	})));
	
});

router.get("/elements", (req, res) => {
	
	if (permissions.isTokenAdmin(permissions.tokenFromRequest(req))) res.json(db.elements.elements());
	else res.json(db.elements.accessible());
	// res.json(db.elements.elements().map(_ => {const t = db.templates.findTemplate(__ => __.id === _.template); if (t) _.template_name = t.name; else _.template_name = "Unknown"; return _;}));
	
});

router.get("/templates", (req, res) => {
	
	res.json(db.templates.templates());
	
});

router.get("/element/:id", (req, res, next) => {
	
	const element = db.elements.findElement(_ => _.id === req.params.id);
	
	if (element && (element.fields.api_access || permissions.isTokenAdmin(permissions.tokenFromRequest(req)))) res.json(element);
	else next();
	
});


router.get("/template/:id", (req, res, next) => {
	
	const template = db.templates.findTemplate(_ => _.id === req.params.id);
	
	if (template) res.json(template);
	else next();
	
});

router.get("/user/:id", (req, res, next) => {

	const user = db.users.findUser(_ => _.id === req.params.id);
	
	if (user) res.json({
		
		...user,
		email: "",
		password: ""

	});
	else next();

});

router.get("/user/byUsername/:username", (req, res, next) => {

	const user = db.users.findUser(_ => _.username === req.params.username);
	
	if (user) res.json({
		
		...user,
		email: "",
		password: ""

	});
	else next();

});

router.get("/file/:file", (req, res) => {
	
	const file = path.join(__dirname, "..", "..", "..", "files", req.params.file);

	if (fs.existsSync(file) && !fs.statSync(file).isDirectory()) {
		
		// res.writeHead(200, {
			
		// 	"Content-Type": "application/octet-stream"
			
		// });
		
		// fs.createReadStream(file).pipe(res);

		res.sendFile(file);
		
	} else {
		
		res.end(JSON.stringify({
			
			message: "invalid_file"
			
		}));
		
	}
	
});

// Private API

router.use((req, res, next) => {

	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	} else next();

});

router.post("/element/:id/edit", async (req, res, next) => {

	const element = db.elements.findElement(_ => _.id === req.params.id);
	
	if (typeof req.body.template === "string" && typeof req.body.fields === "object" && (element || req.params.id === "new")) {
		
		if (req.params.id === "new") {
			
			const id = Math.random().toString(36).replace("0.", "");
			
			await db.elements.insertElement({
				
				id,
				fields: req.body.fields,
				template: req.body.template
				
			});
			
			res.json({
				
				id,
				message: "success"
				
			});
			
		} else {
			
			await db.elements.editElement(element._id, {
				
				...element,
				fields: req.body.fields,
				template: req.body.template
				
			});
			
			res.json({
				
				message: "success"
				
			});
			
		}
		
	} else next();
	
});

router.post("/element/:id/delete", async (req, res, next) => {

	const element = db.elements.findElement(_ => _.id === req.params.id);
	
	if (element) {
		
		await db.elements.deleteElement(element._id);
		
		res.json({
			
			message: "success"
			
		});
		
	} else next();
	
});

router.post("/user/:id/edit", async (req, res, next) => {
	
	const _user = db.users.findUser(_ => _.id === req.params.id);

	if (typeof req.body.username === "string" && typeof req.body.perm_type === "string" && (_user || req.params.id === "new")) {
		
		if (req.params.id === "new") {
			
			const id = Math.random().toString(36).replace("0.", "");
			
			await db.users.insertUser({
				
				id,
				perm_type: req.body.perm_type,
				username: req.body.username,
				email: req.body.email,
				password: req.body.password ? sha512.sha512(req.body.password) : _user.password,
				fields: req.body.fields || {}
				
			});
			
			res.json({
				
				id,
				message: "success"
				
			});
			
		} else {
			
			if (req.body.password) {

				security.sendPasswordChangeEmail(req.body.username, _user.email, req.connection.remoteAddress);

			}

			await db.users.editUser(_user._id, {
				
				..._user,
				perm_type: req.body.perm_type,
				username: req.body.username,
				email: req.body.email,
				password: req.body.password ? sha512.sha512(req.body.password) : _user.password,
				fields: req.body.fields ? req.body.fields : _user.fields
				
			});
			
			res.json({
				
				message: "success"
				
			});
			
		}
		
	} else next();
	
});

router.post("/user/:id/delete", async (req, res, next) => {

	const _user = db.users.findUser(_ => _.id === req.params.id);
	
	if (_user) {
		
		await db.users.deleteUser(_user._id);
		
		res.json({
			
			message: "success"
			
		});
		
	} else next();
	
});

router.post("/template/:id/edit", async (req, res, next) => {

	const template = db.templates.findTemplate(_ => _.id === req.params.id);
	
	if (typeof req.body.name === "string" && typeof req.body.fields === "object" && (template || req.params.id === "new")) {
		
		if (req.params.id === "new") {
			
			const id = Math.random().toString(36).replace("0.", "");
			
			await db.templates.insertTemplate({
				
				id,
				name: req.body.name,
				fields: req.body.fields
				
			});
			
			res.json({
				
				id,
				message: "success"
				
			});
			
		} else {
			
			await db.templates.editTemplate(template._id, {
				
				...template,
				name: req.body.name,
				fields: req.body.fields
				
			});
			
			res.json({
				
				message: "success"
				
			});
			
		}
		
	} else next();
	
});

router.post("/template/:id/delete", async (req, res, next) => {

	const template = db.templates.findTemplate(_ => _.id === req.params.id);
	
	if (template) {
		
		await db.templates.deleteTemplate(template._id);
		
		res.json({
			
			message: "success"
			
		});
		
	} else next();
	
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

router.post("/files/upload", upload.array("files"), (req, res) => {

	if (req.query.redirect) {

		res.redirect(req.query.redirect);

	} else res.json({

		message: "success"

	});

});

router.post("/files/rename", (req, res) => {
	
	if (typeof req.body.from === "string" && fs.existsSync(path.join(__dirname, "..", "..", "..", "files", req.body.from)) && typeof req.body.to === "string" && req.body.from.indexOf("..") === -1 && req.body.to.indexOf("..") === -1) {

		fs.renameSync(path.join(__dirname, "..", "..", "..", "files", req.body.from), path.join(__dirname, "..", "..", "..", "files", req.body.to));
		
		res.json({
			
			message: "success"
			
		});
		
	} else {
		
		res.json({
			
			message: "invalid_body"
			
		});
		
	}
	
});

router.post("/files/delete", (req, res) => {
	
	if (typeof req.body.file === "string" && fs.existsSync(path.join(__dirname, "..", "..", "..", "files", req.body.file)) && req.body.file.indexOf("..") === -1) {
		
		fs.unlinkSync(path.join(__dirname, "..", "..", "..", "files", req.body.file));
		
		res.json({
			
			message: "success"
			
		});
		
	} else {
		
		res.json({
			
			message: "invalid_body"
			
		});
		
	}
	
});

module.exports = router;
