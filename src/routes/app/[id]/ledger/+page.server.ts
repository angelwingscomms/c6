import { list_materials, stock } from '$lib/server/ledger';
import { platform_env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const env = platform_env(event);
	const id = event.params.id;
	return { m: await list_materials(env, id), s: await stock(env, id) };
};
