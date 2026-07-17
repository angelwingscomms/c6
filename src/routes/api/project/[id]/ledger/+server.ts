import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { ledger } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_member(env, event.params.id, u.id);
	const t = event.url.searchParams.get('t');
	if (!t) throw error(400, 'no_t');
	const r = await ledger(env, event.params.id, t);
	return json(r);
};
