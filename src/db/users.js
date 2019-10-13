// const jwt = require("jsonwebtoken");
// const config = require("../utils/config");
const sha512 = require("js-sha512");
const Streamlet = require("streamlet");

module.exports =

/**
 * 
 * @param {Streamlet} db 
 */
function (db) {

	return {

		findUser (_) {

			return db.findOne(__ => __.type === "user" && _(__));

		},

		findUsers (_) {

			return db.find(__ => __.type === "user" && _(__));

		},

		users () {

			return this.findUsers(_ => true);

		},

		authenticate (username, password) {

			const user = this.findUser(_ => _.username === username && _.password === sha512.sha512(password));

			return user;

		},

		editUser (id, data) {

			return db.edit(id, data);

		},

		insertUser (data) {

			return db.insert({
			
				type: "user",
				...data
				
			});

		},

		deleteUser (id) {

			return db.delete(id);

		}

	}

}
