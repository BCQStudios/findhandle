export const PLATFORM_IDS = ['youtube', 'tiktok', 'x', 'facebook', 'instagram'] as const;
export const TLD_IDS = ['com', 'net', 'org', 'io', 'ai'] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];
export type TldId = (typeof TLD_IDS)[number];
export type CheckStatus = 'available' | 'taken' | 'invalid' | 'unknown';

export type CheckResult = {
	platform?: PlatformId;
	tld?: TldId;
	status: CheckStatus;
	url: string;
};

const UA =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const IG_UA =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const RULES: Record<PlatformId, RegExp> = {
	youtube: /^[a-z0-9._-]{3,30}$/,
	tiktok: /^[a-z0-9._]{2,24}$/,
	x: /^[a-z0-9_]{1,15}$/,
	facebook: /^[a-z0-9.]{5,50}$/,
	instagram: /^(?!.*\.\.)(?!\.)[a-z0-9._]{1,30}(?<!\.)$/,
};

export const PROFILES: Record<PlatformId, (handle: string) => string> = {
	youtube: (handle) => `https://www.youtube.com/@${handle}`,
	tiktok: (handle) => `https://www.tiktok.com/@${handle}`,
	x: (handle) => `https://x.com/${handle}`,
	facebook: (handle) => `https://www.facebook.com/${handle}`,
	instagram: (handle) => `https://www.instagram.com/${handle}/`,
};

const DOMAIN_RULE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const RDAP: Record<TldId, (name: string) => string> = {
	com: (name) => `https://rdap.verisign.com/com/v1/domain/${name}.com`,
	net: (name) => `https://rdap.verisign.com/net/v1/domain/${name}.net`,
	org: (name) => `https://rdap.publicinterestregistry.org/rdap/domain/${name}.org`,
	io: (name) => `https://rdap.identitydigital.services/rdap/domain/${name}.io`,
	ai: (name) => `https://rdap.identitydigital.services/rdap/domain/${name}.ai`,
};

export function isPlatformId(value: string): value is PlatformId {
	return (PLATFORM_IDS as readonly string[]).includes(value);
}

export function isTldId(value: string): value is TldId {
	return (TLD_IDS as readonly string[]).includes(value);
}

export function normalizeHandle(raw: string): string {
	return raw.trim().replace(/^@+/, '').toLowerCase();
}

export async function checkPlatforms(handle: string, platforms: PlatformId[]): Promise<CheckResult[]> {
	return Promise.all(platforms.map((platform) => checkPlatform(handle, platform)));
}

export async function checkTlds(handle: string, tlds: TldId[]): Promise<CheckResult[]> {
	return Promise.all(tlds.map((tld) => checkTld(handle, tld)));
}

async function checkTld(handle: string, tld: TldId): Promise<CheckResult> {
	const url = `https://${handle}.${tld}`;
	if (!DOMAIN_RULE.test(handle)) {
		return { tld, status: 'invalid', url };
	}

	try {
		const page = await load(RDAP[tld](handle), {
			Accept: 'application/rdap+json, application/json',
		});
		if (page.status === 404) return { tld, status: 'available', url };
		if (page.status === 200) return { tld, status: 'taken', url };
		return { tld, status: 'unknown', url };
	} catch {
		return { tld, status: 'unknown', url };
	}
}

async function checkPlatform(handle: string, platform: PlatformId): Promise<CheckResult> {
	const url = PROFILES[platform](handle);
	if (!RULES[platform].test(handle)) {
		return { platform, status: 'invalid', url };
	}

	try {
		const status = await CHECKERS[platform](handle);
		return { platform, status, url };
	} catch {
		return { platform, status: 'unknown', url };
	}
}

async function load(url: string, headers: Record<string, string> = {}) {
	const res = await fetch(url, {
		headers: {
			'User-Agent': UA,
			'Accept-Language': 'en-US,en;q=0.9',
			Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
			...headers,
		},
		redirect: 'follow',
		signal: AbortSignal.timeout(8000),
	});
	return { status: res.status, text: await res.text(), url: res.url };
}

const CHECKERS: Record<PlatformId, (handle: string) => Promise<CheckStatus>> = {
	async youtube(handle) {
		const page = await load(PROFILES.youtube(handle), {
			Cookie: 'CONSENT=YES+; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjUwOTEyLjA4X3AxGgJlbiACGgYIgPz8mgY',
		});
		if (page.status === 404 || page.text.includes("This page isn't available")) return 'available';
		if (page.text.includes('channelMetadataRenderer')) return 'taken';
		return 'unknown';
	},

	async tiktok(handle) {
		const embed = await load(`https://www.tiktok.com/oembed?url=${PROFILES.tiktok(handle)}`);
		if (embed.status === 200) return 'taken';
		if (embed.status === 400 || embed.status === 404) return 'available';

		const page = await load(PROFILES.tiktok(handle));
		if (page.text.includes(`"uniqueId":"${handle}"`)) return 'taken';
		if (page.text.includes('"statusCode":10221') || page.text.includes("Couldn't find this account")) {
			return 'available';
		}
		return 'unknown';
	},

	async x(handle) {
		const embed = await load(`https://publish.twitter.com/oembed?url=https://twitter.com/${handle}`);
		if (embed.status === 200) return 'taken';
		if (embed.status === 404) return 'available';
		return 'unknown';
	},

	async facebook(handle) {
		const href = encodeURIComponent(PROFILES.facebook(handle));
		const page = await load(
			`https://www.facebook.com/plugins/page.php?href=${href}&tabs&width=340&height=130`,
		);
		if (page.text.includes('Follow') || page.text.includes('Verified Page') || page.text.length > 35000) {
			return 'taken';
		}
		if (page.status === 200) return 'available';
		return 'unknown';
	},

	async instagram(handle) {
		const page = await load(PROFILES.instagram(handle), { 'User-Agent': IG_UA });
		if (page.status === 404 || page.text.includes("Sorry, this page isn't available")) return 'available';
		if (page.text.includes('profilePage_')) return 'taken';
		if (page.status === 200) return 'available';
		return 'unknown';
	},
};
