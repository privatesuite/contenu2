const ejs = require("ejs");
const path = require("path");
const config = require("./config");
const nodemailer = require("nodemailer");
const iplocation = require("iplocation").default;

function processIP (ip) {

	return ip.replace("::ffff:", "");

}

module.exports = {

	async locate (ip) {

		if (ip === "::1") {

			return {

				city: "Unknown",
				country: "Unknown"

			}

		} else return await iplocation(ip);

	},

	createTransport () {

		return nodemailer.createTransport({
			
			host: config().security.email.host,
			port: config().security.email.port,

			auth: {

				user: config().security.email.username,
				pass: config().security.email.password

			},

		});

	},

	async sendLoginAttemptEmail (user, to, ip) {

		ip = processIP(ip);

		// console.log(`${config().security.email.from} -> ${to}`)

		ejs.renderFile(path.join(__dirname, "..", "..", "views", "emails", "login_attempt.ejs"), {

			user,
			ip,
			host: config().server.host,
			location: await this.locate(ip)

		}, async (err, html) => {

			if (err) throw err;

			await this.createTransport().sendMail({

				from: config().security.email.from,
				to,

				subject: "Login Attempt",
				html,
				text: "Please open this email in order to view its content"
				
			});

		});

	}

}
