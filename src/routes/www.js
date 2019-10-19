const db = require("../db");
const fs = require("fs");
const vm2 = require("vm2");
const path = require("path");
const http = require("http");
const mime = require("mime");
const express = require("express");

const reqPath = require("../utils/req_path");

let wwwSrc;
const wwwFolder = path.join(__dirname, "..", "..", "www");

async function wwwRun (req, res, code = wwwSrc, other) {
	
	res.file = (file, status) => other.file(path.join(wwwFolder, file), status);
	res.ejs = async (file, params) => res.end(await render(path.join(wwwFolder, file), { db, ...params }));

	let methods = {};
	let complete = false;
	
	let error;
	let notFound;
	
	const render = (view, opts) => new Promise((resolve, reject) => {
		
		res.render(view, {
			
			async: true,
			...opts
			
		}, (err, html) => {
			
			html.then(_ => resolve(html));
			html.catch(_ => {

				if (error) error(req, res, html);
				complete = true;

			});
			
		});
		
	});
	
	return new Promise((resolve, reject) => {
		
		for (const method of http.METHODS.map(_ => _.toLowerCase())) {
			
			methods[method] = (route, handler) => {
				
				if (req.method.toLowerCase() !== method) return;
				if (complete) return;
				
				let match = reqPath(route, req.url);
				
				if (match) {
					
					req.params = match;
					complete = true;
				
					try {
						
						handler(req, res);
						
					} catch (e) {
						
						if (error) error(req, res, e);
						complete = true;
						// throw e;
						
					}
					resolve({  });
					
				}
				
			}
			
		}
		
		new vm2.VM({
			
			sandbox: {
				
				auto (routes) {
					
					if (typeof route === "string") routes = [routes];
					
					for (const route of routes) {
						
						let match = reqPath(route, req.url);
						
						if (match) {
							
							complete = true;
							resolve({ auto: true });
							return;
							
						}
						
					}
					
				},
				
				error (callback) {
					
					error = callback;
					
				},
				
				notFound (callback) {
					
					notFound = callback;
					
				},
				
				...methods				
				
			}
			
		}).run(code);
		
		setTimeout(() => {
			
			if (!complete) {
				
				if (notFound) notFound(req, res);
				else resolve({ ignore: true });
				
			}
			
		}, 10);
		
	});
	
}

const router = express.Router();

router.all("*", async (req, res, next) => {
	
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	
	let file = path.join(wwwFolder, req.url === "/" ? "index.html" : req.url);
	
	if (wwwSrc || fs.existsSync(file)) {
		
		function _ (_file = file, status = 200) {
			
			const stat = fs.statSync(_file);
			
			res.writeHead(status, {
				
				"Content-Type": mime.getType(_file) || "application/octet-stream",
				"Content-Length": stat.size
				
			});
			
			fs.createReadStream(_file).pipe(res);
			
		}
		
		if (!wwwSrc) _(); else {
			
			const out = await wwwRun(req, res, wwwSrc, {
				
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
module.exports.sync = () => wwwSrc = (fs.existsSync(path.join(wwwFolder, "www.js")) ? fs.readFileSync(path.join(wwwFolder, "www.js")).toString() : undefined);
