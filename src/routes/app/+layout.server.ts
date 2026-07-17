import { require_user } from '$lib/server/access';
import type { LayoutServerLoad } from './$types';

// every /app/** route requires a signed-in user
export const load: LayoutServerLoad = ({ locals }) => ({ user: require_user(locals) });
