import { error, redirect } from '@sveltejs/kit';
import type { Project } from '$lib/types';
import { retrieve_one } from './qdrant';
import type { AppEnv } from './env';

export type ProjectRow = Project & { id: string };

export async function get_project(env: AppEnv, id: string): Promise<ProjectRow | null> {
	const p = await retrieve_one(env, id);
	const v = p?.payload as Project | undefined;
	return v?.s === 'p' ? { ...v, id: String(p!.id) } : null;
}

// acting user must be owner or in member list
export async function require_member(env: AppEnv, id: string, uid: string): Promise<ProjectRow> {
	const p = await get_project(env, id);
	if (!p) throw error(404, 'no_project');
	if (p.o !== uid && !(p.a ?? []).includes(uid)) throw error(403, 'not_member');
	return p;
}

export async function require_owner(env: AppEnv, id: string, uid: string): Promise<ProjectRow> {
	const p = await get_project(env, id);
	if (!p) throw error(404, 'no_project');
	if (p.o !== uid) throw error(403, 'not_owner');
	return p;
}

// page/route guard: returns the signed-in user or redirects to /login
export function require_user(locals: App.Locals): NonNullable<App.Locals['user']> {
	if (!locals.user) throw redirect(302, '/login');
	return locals.user;
}
