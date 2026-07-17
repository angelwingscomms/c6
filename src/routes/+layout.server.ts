import type { LayoutServerLoad } from './$types';

// expose the signed-in user to every page (Nav / Shell)
export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user ?? null });
