const db = require("../db");
const fs = require("fs");
const vm2 = require("vm2");
const path = require("path");

const api = require("../routes/api");
// const admin = ;

const clone = require("../utils/clone");
const config = require("../utils/config");
const permissions = require("../utils/permissions");
const parseReqPath = require("../utils/req_path");
const security = require("../utils/security");
const session = require("../utils/session");

let plugins = [];
const plugin_folder = path.join(__dirname, "..", "..", "plugins");

class Plugin {

	constructor (path) {

		this.path = path;
		
		this.vm = new vm2.NodeVM({

			sandbox: {
		
				process
		
			},
		
			require: {
		
				builtin: ["*"],
				external: ["*"],

				mock: {

					contenu: {

						database: db,

						routes: {

							api,
							admin: require("../routes/admin")

						},

						utils: {

							clone,
							config,
							permissions,
							parseReqPath,
							security,
							session

						}

					}

				}
		
			}
		
		});

	}

	config () {

		if (!this._config) this._config = JSON.parse(fs.readFileSync(path.join(this.path, "plugin.json")).toString());

		return this._config;

	}

	start () {

		this.vm.run(fs.readFileSync(path.join(this.path, this.config().main)).toString(), path.join(this.path, this.config().main));

	}

}

module.exports = {

	getPlugins () {return plugins},

	load () {

		plugins = fs.readdirSync(plugin_folder).map(_ => new Plugin(path.join(plugin_folder, _)));

		for (const plugin of plugins) {

			plugin.start();

		}

		return plugins;

	}

}

