import { json, error } from '@sveltejs/kit';
import { platform_env } from '$lib/server/env';
import { require_owner } from '$lib/server/access';
import { add_material } from '$lib/server/ledger';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const u = event.locals.user;
	if (!u) throw error(401, 'auth');
	const env = platform_env(event);
	await require_owner(env, event.params.id, u.id);
	const b = (await event.request.json()) as { n: string; u: string; c?: string };
	const r = await add_material(env, event.params.id, u.id, { n: b.n, u: b.u, c: b.c });
	return json({ id: r.id });
};
