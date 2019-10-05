const pathToRegexp = require("path-to-regexp");

function decodeParam (val) {
	
	if (typeof val !== "string" || val.length === 0) {
		
		return val;
		
	}
	
	try {
		
		return decodeURIComponent(val);		
		
	} catch (err) {
		
		if (err instanceof URIError) {
			
			err.message = `Failed to decode param "${val}"`;
			
		}
		
		throw err;
		
	}
	
}

module.exports = (path, requested_path) => {

	let keys = [];
	const regexp = pathToRegexp(path, keys);

	let match = regexp.exec(requested_path);
	let params = {};

	if (!match) return false;

	for (var i = 1; i < match.length; i++) {
	
		var key = keys[i - 1];
		var prop = key.name;
		var val = decodeParam(match[i])
		
		if (val !== undefined || !(hasOwnProperty.call(params, prop))) {

			params[prop] = val;

		}
	
	}
	
	return params;
	
}
