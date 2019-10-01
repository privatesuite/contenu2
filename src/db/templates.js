const Streamlet = require("streamlet");

module.exports =

/**
 * 
 * @param {Streamlet} db 
 */
function (db) {

	return {

		findTemplate (_) {

			return db.findOne(__ => __.type === "template" && _(__));

		},

		findTemplates (_) {

			return db.find(__ => __.type === "template" && _(__));

		},

		templates () {

			return this.findTemplates(_ => true);

		}

	}

}
