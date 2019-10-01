const jwt = require("jsonwebtoken");
const config = require("../utils/config");

module.exports = {

	create (data) {

		return jwt.sign(data, config().admin.secret);

	},

	extract (token) {

		try {

			return jwt.verify(token, config().admin.secret);

		} catch (e) {

			return {};

		}

	}

}
