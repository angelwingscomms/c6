import { list_milestones } from '$lib/server/ledger';
import { platform_env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return { l: await list_milestones(platform_env(event), event.params.id) };
};
