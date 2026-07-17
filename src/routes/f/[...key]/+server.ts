import { error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { project_of_key, get_file } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const key = event.params.key;
	const j = project_of_key(key);
	if (!j) throw error(400);
	await require_member(env, j, u.id);
	const o = await get_file(env, key);
	if (!o) throw error(404);
	return new Response(o.body, {
		headers: { 'content-type': o.type, 'cache-control': 'private, max-age=3600' }
	});
};
