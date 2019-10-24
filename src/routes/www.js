const db = require("../db");
const fs = require("fs");
const ms = require("ms");
const vm2 = require("vm2");
const path = require("path");
const http = require("http");
const express = require("express");

const reqPath = require("../utils/req_path");

let vm;
let wwwSrc;
let timeFrames = [];
const wwwFolder = path.join(__dirname, "..", "..", "www");

let routes = {};

function wwwRun (req, res, other) {
	
	const render = (view, opts) => new Promise((resolve, reject) => {
		
		res.render(view, {
			
			async: true,
			...opts
			
		}, (err, html) => {
			
			if (err) {

				if (routes["__error__"]) routes["__error__"](req, res, html);
				return;

			}

			html.then(_ => resolve(html));
			html.catch(_ => {

				if (routes["__error__"]) routes["__error__"](req, res, html);

			});
			
		});
		
	});

	res.file = (file, status) => other.file(path.join(wwwFolder, file), status);
	res.ejs = async (file, params, contentType) => {
	
		res.set("Content-Type", contentType || "text/html");
		res.send(await render(path.join(wwwFolder, file), { db, ...params }));

	}

	for (const route of Object.keys(routes).filter(_ => !_.startsWith("__") && routes[_].method === req.method.toLowerCase())) {

		let match = reqPath(route, req.path);

		if (match) {

			if (routes[route].handler) {
				
				req.params = match;
				routes[route].handler(req, res);
				return {};

			} else if (routes[route].auto) return {auto: true};

		}

	}

	if (routes["__notFound__"]) routes["__notFound__"](req, res);
	else res.end();
	return {};

}

function initRoutes (code = wwwSrc) {

	let methods = {};

	return new Promise((resolve, reject) => {
		
		for (const method of http.METHODS.map(_ => _.toLowerCase())) {
			
			methods[method] = (route, handler) => {
				
				routes[route] = {

					method,
					handler

				}
				
			}
			
		}
		
		vm = new vm2.NodeVM({

			sandbox: {
				
				db,

				schedule (cb) {

					return {

						in (time) {

							if (typeof time === "string") time = ms(time);

							console.log(`[www] Task scheduled to occur in ${ms(time, {long: true})}.`);
							timeFrames.push(setTimeout(cb, time));

						},

						every (time) {

							if (typeof time === "string") time = ms(time);

							console.log(`[www] Task scheduled to occur every ${ms(time, {long: true})}.`);
							timeFrames.push(setInterval(cb, time));

						}

					}

				},

				auto (_routes) {
					
					if (typeof _routes === "string") _routes = [_routes];
					
					for (const route of _routes) {
						
						routes[route] = {

							method: "get",
							auto: true
		
						}
						
					}
					
				},
				
				error (callback) {
					
					routes["__error__"] = callback;
					
				},
				
				notFound (callback) {
					
					routes["__notFound__"] = callback;
					
				},
				
				...methods				
				
			},

			require: {

				builtin: ["*"],
				external: ["*"]

			}
			
		});
		
		vm.run(code, path.join(wwwFolder, "www.js"));

	});

}

const router = express.Router();

router.all("*", async (req, res, next) => {
	
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	
	let file = path.join(wwwFolder, req.url === "/" ? "index.html" : req.url);
	
	if (wwwSrc || fs.existsSync(file)) {
		
		function _ (_file = file) {

			res.sendFile(_file);
			
		}
		
		if (!wwwSrc) _(); else {
			
			const out = wwwRun(req, res, {
				
				file: _
				
			});

			if (out.auto) {
				
				if (fs.existsSync(file) && !fs.statSync(file).isDirectory()) _();
				else {
					
					next();
					return;
					
				}
				
			} else if (out.ignore) {
				
				next();
				return;
				
			}
			
		}
		
	} else {
		
		next();
		
	}
	
});

module.exports = router;
module.exports.sync = () => {

	routes = {};
	wwwSrc = (fs.existsSync(path.join(wwwFolder, "www.js")) ? fs.readFileSync(path.join(wwwFolder, "www.js")).toString() : undefined);
	
	timeFrames.map(_ => {

		clearTimeout(_);
		clearInterval(_);

	});
	timeFrames = [];

	setTimeout(() => {

		initRoutes(wwwSrc);

	}, 10);

}
