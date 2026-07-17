import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_owner } from '$lib/server/access';
import { regen_invite } from '$lib/server/projects';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_owner(env, event.params.id, u.id);
	const r = await regen_invite(env, event.params.id);
	return json({ i: r.i });
};
