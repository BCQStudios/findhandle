export const PLATFORMS = ['youtube', 'tiktok', 'x', 'facebook', 'instagram'] as const;
export const TLDS = ['com', 'net', 'org', 'io', 'ai'] as const;

export type Platform = (typeof PLATFORMS)[number];
export type Tld = (typeof TLDS)[number];
type Status = 'available' | 'taken' | 'invalid' | 'unknown';
type Result = { status: Status; url: string };

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const IG_UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const RULES: Record<Platform, RegExp> = {
	youtube: /^[a-z0-9._-]{3,30}$/,
	tiktok: /^[a-z0-9._]{2,24}$/,
	x: /^[a-z0-9_]{1,15}$/,
	facebook: /^[a-z0-9.]{5,50}$/,
	instagram: /^(?!.*\.\.)(?!\.)[a-z0-9._]{1,30}(?<!\.)$/,
};

const PROFILES: Record<Platform, (handle: string) => string> = {
	youtube: (handle) => `https://www.youtube.com/@${handle}`,
	tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
	x: (handle) => `https://x.com/${handle}`,
	facebook: (handle) => `https://www.facebook.com/${handle}`,
	instagram: (handle) => `https://www.instagram.com/${handle}/`,
};

const DOMAIN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const RDAP: Record<Tld, string> = {
	com: 'https://rdap.verisign.com/com/v1/domain',
	net: 'https://rdap.verisign.com/net/v1/domain',
	org: 'https://rdap.publicinterestregistry.org/rdap/domain',
	io: 'https://rdap.identitydigital.services/rdap/domain',
	ai: 'https://rdap.identitydigital.services/rdap/domain',
};

export async function checkTld(handle: string, tld: Tld): Promise<Result> {
	const url = `https://${handle}.${tld}`;
	if (!DOMAIN.test(handle)) return { status: 'invalid', url };

	try {
		const res = await load(`${RDAP[tld]}/${handle}.${tld}`, {
			Accept: 'application/rdap+json, application/json',
		});
		if (res.status === 404) return { status: 'available', url };
		if (res.status === 200) return { status: 'taken', url };
		return { status: 'unknown', url };
	} catch {
		return { status: 'unknown', url };
	}
}

export async function checkPlatform(handle: string, platform: Platform): Promise<Result> {
	const url = PROFILES[platform](handle);
	if (!RULES[platform].test(handle)) return { status: 'invalid', url };

	try {
		return { status: await CHECKERS[platform](handle), url };
	} catch {
		return { status: 'unknown', url };
	}
}

async function load(url: string, headers: Record<string, string> = {}) {
	return fetch(url, {
		headers: {
			'User-Agent': UA,
			'Accept-Language': 'en-US,en;q=0.9',
			Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
			...headers,
		},
		signal: AbortSignal.timeout(8000),
	});
}

const CHECKERS: Record<Platform, (handle: string) => Promise<Status>> = {
	async youtube(handle) {
		const res = await load(PROFILES.youtube(handle), {
			Cookie: 'CONSENT=YES+; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjUwOTEyLjA4X3AxGgJlbiACGgYIgPz8mgY',
		});
		const text = await res.text();
		if (res.status === 404 || text.includes("This page isn't available")) return 'available';
		if (text.includes('channelMetadataRenderer')) return 'taken';
		return 'unknown';
	},

	async tiktok(handle) {
		const embed = await load(`https://www.tiktok.com/oembed?url=${PROFILES.tiktok(handle)}`);
		if (embed.status === 200) return 'taken';
		if (embed.status === 400 || embed.status === 404) return 'available';

		const text = await (await load(PROFILES.tiktok(handle))).text();
		if (text.includes(`"uniqueId":"${handle}"`)) return 'taken';
		if (text.includes('"statusCode":10221') || text.includes("Couldn't find this account")) return 'available';
		return 'unknown';
	},

	async x(handle) {
		const embed = await load(`https://publish.twitter.com/oembed?url=https://twitter.com/${handle}`);
		if (embed.status === 200) return 'taken';
		if (embed.status === 404) return 'available';
		return 'unknown';
	},

	async facebook(handle) {
		const page = await load(
			`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(PROFILES.facebook(handle))}&tabs&width=340&height=130`,
		);
		const text = await page.text();
		if (text.includes('Follow') || text.includes('Verified Page') || text.length > 35000) return 'taken';
		if (page.status === 200) return 'available';
		return 'unknown';
	},

	async instagram(handle) {
		const res = await load(PROFILES.instagram(handle), { 'User-Agent': IG_UA });
		const text = await res.text();
		if (res.status === 404 || text.includes("Sorry, this page isn't available")) return 'available';
		if (text.includes('profilePage_')) return 'taken';
		return 'unknown';
	},
};
