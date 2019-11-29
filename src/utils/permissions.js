const db = require("../db");
const session = require("./session");

module.exports = {

	tokenFromBearer (bearer) {

		return bearer.replace(/bearer/i, "").trim();

	},

	tokenFromRequest (req) {

		return req.cookies.token || req.body.token || req.query.token || this.tokenFromBearer(req.headers.authorization || "");

	},

	getUserFromToken (token) {

		const data = session.extract(token);
		const user = db.users.findUser(_ => _.username === data.username);

		return user;

	},

	isTokenAdmin (token) {

		const user = this.getUserFromToken(token);
		return user && user.perm_type === "admin";

	}

}