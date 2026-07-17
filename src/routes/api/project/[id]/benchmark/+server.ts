import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_owner } from '$lib/server/access';
import { add_benchmark } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_owner(env, event.params.id, u.id);
	const b = (await event.request.json()) as { t: string; w: string; q: number; e: number };
	const r = await add_benchmark(env, event.params.id, u.id, b);
	return json({ id: r.id });
};
