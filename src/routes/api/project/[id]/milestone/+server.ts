import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_member } from '$lib/server/access';
import { add_milestone } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_member(env, event.params.id, u.id);
	const b = (await event.request.json()) as { n: string; c: number; f?: string; x?: string };
	const r = await add_milestone(env, event.params.id, u.id, b);
	return json({ id: r.id });
};
