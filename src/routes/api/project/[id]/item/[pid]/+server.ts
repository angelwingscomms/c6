import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_owner } from '$lib/server/access';
import { delete_item } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_owner(env, event.params.id, u.id);
	await delete_item(env, event.params.id, event.params.pid);
	return json({ ok: true });
};
