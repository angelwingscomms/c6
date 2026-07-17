import type { User } from '$lib/types';
import { C, ZV, ensure, qc, uuid_from, type QEnv } from './qdrant';

export async function save_user(
	env: QEnv,
	sub: string,
	name: string,
	picture?: string,
	email?: string
): Promise<string> {
	await ensure(env);
	const id = await uuid_from(sub);
	const c = await get_user(env, id);
	const u: User = { s: 'u', g: sub, n: name, p: picture, m: email, d: c?.d ?? Date.now() };
	await (await qc(env)).upsert(C, {
		points: [{ id, vector: ZV, payload: u as unknown as Record<string, unknown> }]
	});
	return id;
}

export async function get_user(env: QEnv, id: string): Promise<User | null> {
	const r = await (await qc(env)).retrieve(C, { ids: [id] }).catch(() => []);
	const u = r[0]?.payload as User | undefined;
	return u?.s === 'u' ? u : null;
}
