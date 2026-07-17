import { list_drawings } from '$lib/server/ledger';
import { platform_env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return { d: await list_drawings(platform_env(event), event.params.id) };
};
