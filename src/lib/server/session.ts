import { get_secret, type SecretVal } from './qdrant';

function b64(s: string): string {
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ub64(s: string): string {
	s = s.replace(/-/g, '+').replace(/_/g, '/');
	while (s.length % 4) s += '=';
	return atob(s);
}

async function get_key(secret: string): Promise<CryptoKey> {
	const raw = new TextEncoder().encode(secret).slice(0, 32);
	return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
		'sign',
		'verify'
	]);
}

export type SessionUser = { id: string; name: string; picture?: string; email?: string };

export async function encode_session(secret: SecretVal, data: SessionUser): Promise<string> {
	const p = { u: data.id, n: data.name, p: data.picture, m: data.email, e: Date.now() + 604800000 };
	const raw = b64(JSON.stringify(p));
	const k = await get_key(await get_secret(secret));
	const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(raw));
	return raw + '.' + b64(String.fromCharCode(...new Uint8Array(sig)));
}

export async function decode_session(
	secret: SecretVal,
	c: string | undefined | null
): Promise<{ user: SessionUser } | null> {
	if (!c) return null;
	const [raw, sig] = c.split('.');
	if (!raw || !sig) return null;
	try {
		const k = await get_key(await get_secret(secret));
		const sig_buf = Uint8Array.from(ub64(sig), (ch) => ch.charCodeAt(0)).buffer as ArrayBuffer;
		const valid = await crypto.subtle.verify('HMAC', k, sig_buf, new TextEncoder().encode(raw));
		if (!valid) return null;
		const p = JSON.parse(ub64(raw));
		if (p.e < Date.now()) return null;
		return { user: { id: p.u, name: p.n, picture: p.p, email: p.m } };
	} catch {
		return null;
	}
}
