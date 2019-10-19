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

	function templateNameFromId (id) {

		return (db.findOne(_ => _.type === "template" && _.id === id) || {name: ""}).name;
	
	}

	return {

		findElement (_) {

			const element = db.findOne(__ => __.type === "element" && _({
				
				...__,
				templateName: templateNameFromId(__.template)
				
			}));

			return {

				...element,
				templateName: templateNameFromId(element.template)

			}

		},

		findElements (_) {

			return db.find(__ => __.type === "element" && _({
				
				...__,
				templateName: templateNameFromId(__.template)
				
			})).map(__ => ({

				...__,
				templateName: templateNameFromId(__.template)

			}));

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
