const fs = require("fs");
const db = require("../../db");
const path = require("path");
const clone = require("../../utils/clone");
const sha512 = require("js-sha512");
const express = require("express");
const session = require("../../utils/session");
const permissions = require("../../utils/permissions");

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

router.get("/users", (req, res) => {
	
	res.json(db.users.users().map(_ => ({

		..._,
		email: "",
		password: ""

	})));
	
});

router.get("/elements", (req, res) => {
	
	res.json(db.elements.elements().filter(_ => _.fields.api_access));
	// res.json(db.elements.elements().map(_ => {const t = db.templates.findTemplate(__ => __.id === _.template); if (t) _.template_name = t.name; else _.template_name = "Unknown"; return _;}));
	
});

router.get("/templates", (req, res) => {
	
	res.json(db.templates.templates());
	
});

router.get("/element/:id", (req, res, next) => {
	
	const element = db.elements.findElement(_ => _.id === req.params.id);
	
	if (element && element.fields.api_access) res.json(element);
	else next();
	
});

router.post("/element/:id/edit", async (req, res, next) => {
	
	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}

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
	
	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}

	const element = db.elements.findElement(_ => _.id === req.params.id);
	
	if (element) {
		
		db.elements.deleteElement(element._id);
		
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

router.post("/user/:id/edit", async (req, res, next) => {
	
	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}

	const _user = db.users.findUser(_ => _.id === req.params.id);

	if (typeof req.body.username === "string" && typeof req.body.perm_type === "string" && (_user || req.params.id === "new")) {
		
		if (req.params.id === "new") {
			
			const id = Math.random().toString(36).replace("0.", "");
			
			await db.users.insertUser({
				
				id,
				perm_type: req.body.perm_type,
				username: req.body.username,
				email: req.body.email,
				password: req.body.password ? sha512.sha512(req.body.password) : _user.password
				
			});
			
			res.json({
				
				id,
				message: "success"
				
			});
			
		} else {
			
			await db.users.editUser(_user._id, {
				
				..._user,
				perm_type: req.body.perm_type,
				username: req.body.username,
				email: req.body.email,
				password: req.body.password ? sha512.sha512(req.body.password) : _user.password
				
			});
			
			res.json({
				
				message: "success"
				
			});
			
		}
		
	} else next();
	
});

router.post("/user/:id/delete", async (req, res, next) => {
	
	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}

	const _user = db.users.findUser(_ => _.id === req.params.id);
	
	if (_user) {
		
		db.users.deleteUser(_user._id);
		
		res.json({
			
			message: "success"
			
		});
		
	} else next();
	
});

router.post("/clone", async (req, res) => {
	
	if (!permissions.isTokenAdmin(permissions.tokenFromRequest(req))) {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}
	
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
	const user = db.users.findUser(_ => _.username === token.username);
	
	if (!user || user.perm_type !== "admin") {
		
		res.json({
			
			message: "invalid_credentials"
			
		});
		
		return;
		
	}
	
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
	
});

module.exports = router;
