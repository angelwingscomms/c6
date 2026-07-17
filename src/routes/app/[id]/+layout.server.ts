import { require_member, require_user } from '$lib/server/access';
import { platform_env } from '$lib/server/env';
import type { LayoutServerLoad } from './$types';

// load the site + authorize membership; shared by all site sub-pages
export const load: LayoutServerLoad = async (event) => {
	const u = require_user(event.locals);
	const p = await require_member(platform_env(event), event.params.id, u.id);
	return { project: { id: p.id, n: p.n, l: p.l, o: p.o, i: p.i, a: p.a }, is_owner: p.o === u.id };
};
