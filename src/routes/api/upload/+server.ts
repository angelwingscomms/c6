import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { file_key, put_file } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const j = event.url.searchParams.get('j');
	if (!j) throw error(400, 'no_j');
	await require_member(env, j, u.id);
	const fd = await event.request.formData();
	const file = fd.get('file') as File;
	if (!file) throw error(400, 'no_file');
	const key = file_key(j);
	await put_file(env, key, await file.arrayBuffer(), file.type || 'application/octet-stream');
	return json({ k: key });
};
