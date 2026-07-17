import { generateState, generateCodeVerifier, google_client } from '$lib/server/oauth';
import { platform_env } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET(event: RequestEvent): Promise<Response> {
	const env = platform_env(event);
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
