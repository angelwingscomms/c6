import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { create_project, my_projects } from '$lib/server/projects';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const b = (await event.request.json()) as { n: string; l?: string };
	const r = await create_project(env, u.id, b.n, b.l);
	return json({ i: r.i, id: r.id });
};

export const GET: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const p = await my_projects(env, u.id);
	return json({ p });
};
