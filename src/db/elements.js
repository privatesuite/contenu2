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

		findElement (_) {

			return db.findOne(__ => __.type === "element" && _(__));

		},

		findElements (_) {

			return db.find(__ => __.type === "element" && _(__));

		},

		elements () {

			return this.findElements(_ => true);

		},

		accessible () {

			return this.findElements(_ => _.fields.api_access);

		},
		
		editElement (id, data) {

			return db.edit(id, data);

		},

		insertElement (data) {

			return db.insert({
			
				type: "element",
				...data
				
			});

		},

		deleteElement (id) {

			return db.delete(id);

		}

	}

}
