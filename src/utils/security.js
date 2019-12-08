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

			secure: true,
			auth: {

				user: config().security.email.username,
				pass: config().security.email.password

			},

		});

	},

	async sendEmail (view, subject, options) {

		options.ip = processIP(options.ip);

		// console.log(`${config().security.email.from} -> ${to}`)

		ejs.renderFile(path.join(__dirname, "..", "..", "views", "emails", view), {

			username: options.username,
			ip: options.ip,
			host: config().server.host,
			location: await this.locate(options.ip)

		}, async (err, html) => {

			if (err) throw err;

			await this.createTransport().sendMail({

				from: config().security.email.from,
				to: options.to,

				subject: `[${config().server.host}] ${subject}`,
				html,
				text: "Please open this email in order to view its content"
				
			});

		});

	},

	sendLoginAttemptEmail (username, to, ip) {

		this.sendEmail("login_attempt.ejs", "Login Attempt", {
			
			username,
			to,
			ip
			
		});

	},

	sendPasswordChangeEmail (username, to, ip) {

		this.sendEmail("password_change.ejs", "Password Change", {
			
			username,
			to,
			ip
			
		});

	}

}
