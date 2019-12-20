declare module "contenu" {

	const database = (await import("../src/db")).default;

	namespace routes {

		const www = (await import("../src/routes/www")).default;
		const api = (await import("../src/routes/api")).default;
		const admin = (await import("../src/routes/admin")).default;

	}

	namespace utils {

		const clone = (await import("../src/utils/clone")).default;
		const config = (await import("../src/utils/config")).default;
		const permissions = (await import("../src/utils/permissions")).default;
		const parseReqPath = (await import("../src/utils/req_path")).default;
		const security = (await import("../src/utils/security")).default;
		const session = (await import("../src/utils/session")).default;

	}

}
