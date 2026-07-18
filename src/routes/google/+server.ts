import { generateState, generateCodeVerifier, google_client } from '$lib/server/oauth';
import { encode_session } from '$lib/server/session';
import { save_user } from '$lib/server/user';
import { platform_env } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const env = platform_env(event);
	const code = event.url.searchParams.get('code');
	if (code) return callback(event, env, code);

	const state = generateState();
	const verifier = generateCodeVerifier();
	const url = (await google_client(event.url.origin, env))
		.createAuthorizationURL(state, verifier, ['openid', 'profile', 'email'])
		.toString();
	const opt = {
		path: '/',
		httpOnly: true,
		maxAge: 600,
		sameSite: 'lax' as const,
		secure: event.url.protocol === 'https:'
	};
	event.cookies.set('oauth_state', state, opt);
	event.cookies.set('oauth_verifier', verifier, opt);
	return new Response(null, { status: 302, headers: { Location: url } });
}

async function callback(event: RequestEvent, env: Awaited<ReturnType<typeof platform_env>>, code: string): Promise<Response> {
	const state = event.url.searchParams.get('state');
	const s0 = event.cookies.get('oauth_state') ?? null;
	const v0 = event.cookies.get('oauth_verifier') ?? null;
	if (!state || !s0 || !v0 || state !== s0) return new Response(null, { status: 400 });

	let tokens: { accessToken(): string };
	try {
		tokens = await (await google_client(event.url.origin, env)).validateAuthorizationCode(code, v0);
	} catch {
		return new Response(null, { status: 400 });
	}

	const ures = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		headers: { Authorization: `Bearer ${tokens.accessToken()}` }
	});
	if (!ures.ok) return new Response(null, { status: 400 });
	const g = (await ures.json()) as { sub: string; name: string; picture?: string; email?: string };

	const id = await save_user(env, g.sub, g.name, g.picture, g.email);
	const session = await encode_session(env.SECRET, { id, name: g.name, picture: g.picture, email: g.email });
	event.cookies.set('session', session, { path: '/', httpOnly: true, maxAge: 604800, sameSite: 'lax', secure: event.url.protocol === 'https:' });
	event.cookies.delete('oauth_state', { path: '/' });
	event.cookies.delete('oauth_verifier', { path: '/' });
	return new Response(null, { status: 302, headers: { Location: '/app' } });
}
