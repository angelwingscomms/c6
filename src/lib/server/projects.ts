import { error } from '@sveltejs/kit';
import type { AppEnv } from './env';
import type { Dashboard, ProjectCard, Project, Mat, Recent, Material, Order, Receipt, Usage, Benchmark } from '$lib/types';
import { qc, C, ZV, new_id, ensure, eq, f, scroll } from './qdrant';
import { get_project } from './access';
import { compute_stock, compute_flags } from './ledger';

// ============================================================
// implemented by Worker A. Signatures are FROZEN.
// See .claude/HANDOFF.md for schema + rules.
// ============================================================

const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function gen_invite(): string {
	const bytes = new Uint8Array(6);
	crypto.getRandomValues(bytes);
	return [...bytes].map((b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}

// create a site; returns invite code `i` and point id
export async function create_project(
	env: AppEnv,
	uid: string,
	n: string,
	l?: string
): Promise<{ i: string; id: string }> {
	await ensure(env);
	const id = new_id();
	const i = gen_invite();
	const payload: Project = { s: 'p', n, l, o: uid, a: [uid], i, d: Date.now() };
	await (await qc(env)).upsert(C, { points: [{ id, vector: ZV, payload }] });
	return { i, id };
}

// sites the user owns or is a member of (c = member count)
export async function my_projects(env: AppEnv, uid: string): Promise<ProjectCard[]> {
	const pts = await scroll(env, f(eq('s', 'p'), eq('a', uid)));
	return pts.map((p) => {
		const v = p.payload as Project;
		return { id: String(p.id), n: v.n, l: v.l, o: v.o, c: v.a?.length ?? 1 };
	});
}

// full dashboard payload for a site
export async function get_dashboard(env: AppEnv, id: string): Promise<Dashboard> {
	const p = await get_project(env, id);
	if (!p) throw error(404, 'no_project');

	const mat_pts = await scroll(env, f(eq('s', 'm'), eq('j', id)));
	const m: Mat[] = mat_pts.map((x) => ({ id: String(x.id), ...(x.payload as Material) }));

	const [order_pts, receipt_pts, usage_pts, bench_pts] = await Promise.all([
		scroll(env, f(eq('s', 'o'), eq('j', id))),
		scroll(env, f(eq('s', 'r'), eq('j', id))),
		scroll(env, f(eq('s', 'g'), eq('j', id))),
		scroll(env, f(eq('s', 'k'), eq('j', id)))
	]);
	const orders = order_pts.map((x) => x.payload as Order);
	const receipts = receipt_pts.map((x) => x.payload as Receipt);
	const usages = usage_pts.map((x) => x.payload as Usage);
	const benchmarks = bench_pts.map((x) => x.payload as Benchmark);

	const s = compute_stock(m, orders, receipts, usages);
	const flags = compute_flags(m, orders, receipts, usages, benchmarks);

	const mat_name = new Map(m.map((x) => [x.id, x.n]));
	const mat_unit = new Map(m.map((x) => [x.id, x.u]));
	const r: Recent[] = [
		...order_pts.map((x) => {
			const v = x.payload as Order;
			return { id: String(x.id), y: 'o' as const, t: v.t, n: mat_name.get(v.t) ?? '?', q: v.q, u: mat_unit.get(v.t) ?? '', d: v.d };
		}),
		...receipt_pts.map((x) => {
			const v = x.payload as Receipt;
			return { id: String(x.id), y: 'r' as const, t: v.t, n: mat_name.get(v.t) ?? '?', q: v.q, u: mat_unit.get(v.t) ?? '', d: v.d };
		}),
		...usage_pts.map((x) => {
			const v = x.payload as Usage;
			return { id: String(x.id), y: 'g' as const, t: v.t, n: mat_name.get(v.t) ?? '?', q: v.q, u: mat_unit.get(v.t) ?? '', d: v.d };
		})
	]
		.sort((a, b) => b.d - a.d)
		.slice(0, 8);

	return { p, m, s, f: flags, r };
}

// join a site by invite code; null if code unknown
export async function join_by_code(
	env: AppEnv,
	uid: string,
	c: string
): Promise<{ id: string } | null> {
	const pts = await scroll(env, f(eq('s', 'p'), eq('i', c.toUpperCase())));
	if (pts.length === 0) return null;
	const pt = pts[0];
	const payload = pt.payload as Project;
	if (!payload.a.includes(uid)) {
		payload.a.push(uid);
		await (await qc(env)).upsert(C, { points: [{ id: pt.id, vector: ZV, payload }] });
	}
	return { id: String(pt.id) };
}

// regenerate a site invite code (owner checked by caller)
export async function regen_invite(env: AppEnv, id: string): Promise<{ i: string }> {
	const p = await get_project(env, id);
	if (!p) throw error(404, 'no_project');
	const i = gen_invite();
	const payload: Project = { s: 'p', n: p.n, l: p.l, o: p.o, a: p.a, i, d: p.d };
	await (await qc(env)).upsert(C, { points: [{ id, vector: ZV, payload }] });
	return { i };
}
