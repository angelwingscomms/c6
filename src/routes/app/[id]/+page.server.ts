import { get_dashboard } from '$lib/server/projects';
import { platform_env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const d = await get_dashboard(platform_env(event), event.params.id);
	return { m: d.m, s: d.s, f: d.f, r: d.r };
};
