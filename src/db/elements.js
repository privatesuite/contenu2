// const jwt = require("jsonwebtoken");
// const config = require("../utils/config");
const sha512 = require("js-sha512");
const Streamlet = require("streamlet");

function templateNameFromId () {

	db.findOne(_ => _.type === "template" && _)

}

module.exports =

/**
 * 
 * @param {Streamlet} db 
 */
function (db) {

	return {

		findElement (_) {

			const element = db.findOne(__ => __.type === "element" && _(__));

			return {

				...element,
				templateName: templateNameFromId(element.template)

			}

		},

		findElements (_) {

			return db.find(__ => __.type === "element" && _(__));

		},

		elements () {

			return this.findElements(_ => true);

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
