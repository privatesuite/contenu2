const Streamlet = require("streamlet");

module.exports =

/**
 * 
 * @param {Streamlet} db 
 */
function (db) {

	return {

		templateNameFromId (id) {

			return (this.findTemplate(_ => _.id === id) || {name: ""}).name;
		
		},

		findTemplate (_) {

			return db.findOne(__ => __.type === "template" && _(__));

		},

		findTemplates (_) {

			return db.find(__ => __.type === "template" && _(__));

		},

		templates () {

			return this.findTemplates(_ => true);

		},
		
		editTemplate (id, data) {

			return db.edit(id, data);

		},

		insertTemplate (data) {

			return db.insert({
			
				type: "template",
				...data
				
			});

		},

		deleteTemplate (id) {

			return db.delete(id);

		}

	}

}
