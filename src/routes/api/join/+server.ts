import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { join_by_code } from '$lib/server/projects';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const b = (await event.request.json()) as { c: string };
	const r = await join_by_code(env, u.id, b.c);
	if (!r) throw error(404, 'no_code');
	return json({ id: r.id });
};
