import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { flags } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_member(env, event.params.id, u.id);
	const f = await flags(env, event.params.id);
	return json({ f });
};
