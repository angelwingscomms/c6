import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { answer } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	const b = (await event.request.json()) as { j: string; q: string };
	await require_member(env, b.j, u.id);
	const a = await answer(env, b.j, b.q);
	return json({ a });
};
