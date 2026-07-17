import { my_projects } from '$lib/server/projects';
import { platform_env } from '$lib/server/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return { p: await my_projects(platform_env(event), event.locals.user!.id) };
};
