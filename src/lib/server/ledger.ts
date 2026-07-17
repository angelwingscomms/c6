import type { AppEnv } from './env';
import type {
	Flag,
	Stock,
	Row,
	Mat,
	DrawingRow,
	MilestoneRow,
	Material,
	Order,
	Receipt,
	Usage,
	Benchmark,
	Drawing,
	Milestone
} from '$lib/types';
import { qc, C, ZV, new_id, ensure, eq, f, scroll, retrieve_one } from './qdrant';
import { embed } from './or';

// ============================================================
// implemented by Worker A. Signatures are FROZEN.
// See .claude/HANDOFF.md for schema + rules.
// ============================================================

export async function add_material(
	env: AppEnv,
	id: string,
	uid: string,
	d: { n: string; u: string; c?: string }
): Promise<{ id: string }> {
	void uid;
	await ensure(env);
	const pid = new_id();
	const payload: Material = { s: 'm', j: id, n: d.n, u: d.u, c: d.c, d: Date.now() };
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector: ZV, payload }] });
	return { id: pid };
}

export async function list_materials(env: AppEnv, id: string): Promise<Mat[]> {
	return fetch_materials(env, id);
}

export async function add_order(
	env: AppEnv,
	id: string,
	uid: string,
	d: { t: string; q: number; v?: string; x?: string; d?: number }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Order = { s: 'o', j: id, t: d.t, q: d.q, v: d.v, d: d.d ?? Date.now(), x: d.x, b: uid };
	const vector = await embed(env, [d.x, d.v].filter(Boolean).join(' '));
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector, payload }] });
	return { id: pid };
}

export async function add_receipt(
	env: AppEnv,
	id: string,
	uid: string,
	d: { t: string; q: number; f?: string; x?: string }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Receipt = { s: 'r', j: id, t: d.t, q: d.q, d: Date.now(), f: d.f, x: d.x, b: uid };
	const vector = await embed(env, d.x || '');
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector, payload }] });
	return { id: pid };
}

export async function add_usage(
	env: AppEnv,
	id: string,
	uid: string,
	d: { t: string; q: number; w?: string; k?: number; x?: string }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Usage = { s: 'g', j: id, t: d.t, q: d.q, w: d.w, k: d.k, d: Date.now(), x: d.x, b: uid };
	const vector = await embed(env, [d.w, d.x].filter(Boolean).join(' '));
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector, payload }] });
	return { id: pid };
}

export async function add_benchmark(
	env: AppEnv,
	id: string,
	uid: string,
	d: { t: string; w: string; q: number; e: number }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Benchmark = { s: 'k', j: id, t: d.t, w: d.w, q: d.q, e: d.e, b: uid };
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector: ZV, payload }] });
	return { id: pid };
}

export async function add_milestone(
	env: AppEnv,
	id: string,
	uid: string,
	d: { n: string; c: number; f?: string; x?: string }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Milestone = { s: 'l', j: id, n: d.n, c: d.c, f: d.f, x: d.x, d: Date.now(), b: uid };
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector: ZV, payload }] });
	return { id: pid };
}

type LedgerPayload = {
	s: 'o' | 'r' | 'g';
	t: string;
	q: number;
	d: number;
	b: string;
	x?: string;
	v?: string;
	w?: string;
	k?: number;
	f?: string;
};

function to_row(p: { id: string | number; payload: Record<string, unknown> | null }): Row {
	const v = p.payload as LedgerPayload;
	return { id: String(p.id), s: v.s, t: v.t, q: v.q, d: v.d, b: v.b, x: v.x, v: v.v, w: v.w, k: v.k, f: v.f };
}

// order/receipt/usage rows for one material, newest first
export async function ledger(
	env: AppEnv,
	id: string,
	t: string
): Promise<{ o: Row[]; r: Row[]; g: Row[] }> {
	const [op, rp, gp] = await Promise.all([
		scroll(env, f(eq('s', 'o'), eq('j', id), eq('t', t))),
		scroll(env, f(eq('s', 'r'), eq('j', id), eq('t', t))),
		scroll(env, f(eq('s', 'g'), eq('j', id), eq('t', t)))
	]);
	return {
		o: op.map(to_row).sort((a, b) => b.d - a.d),
		r: rp.map(to_row).sort((a, b) => b.d - a.d),
		g: gp.map(to_row).sort((a, b) => b.d - a.d)
	};
}

async function fetch_materials(env: AppEnv, id: string): Promise<Mat[]> {
	const pts = await scroll(env, f(eq('s', 'm'), eq('j', id)));
	return pts.map((p) => ({ id: String(p.id), ...(p.payload as Material) }));
}

async function fetch_kind<T>(env: AppEnv, s: string, id: string): Promise<T[]> {
	const pts = await scroll(env, f(eq('s', s), eq('j', id)));
	return pts.map((p) => p.payload as T);
}

// shared with projects.ts (get_dashboard) — per-material ordered/received/used totals
export function compute_stock(
	materials: Mat[],
	orders: Order[],
	receipts: Receipt[],
	usages: Usage[]
): Stock[] {
	return materials.map((mat) => {
		const o = orders.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		const r = receipts.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		const g = usages.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		return { t: mat.id, n: mat.n, u: mat.u, o, r, g };
	});
}

// shared with projects.ts (get_dashboard) — discrepancies vs benchmarks & stock
export function compute_flags(
	materials: Mat[],
	orders: Order[],
	receipts: Receipt[],
	usages: Usage[],
	benchmarks: Benchmark[]
): Flag[] {
	const out: Flag[] = [];
	const now = Date.now();
	for (const mat of materials) {
		const o = orders.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		const r = receipts.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		const u = usages.filter((x) => x.t === mat.id).reduce((a, x) => a + x.q, 0);
		const on_hand = r - u;
		if (on_hand < 0)
			out.push({
				t: mat.id,
				n: mat.n,
				y: 'negative_stock',
				m: `Used ${u} ${mat.u} but only ${r} delivered — short by ${Math.abs(on_hand)}.`,
				d: now
			});
		if (o > 0 && r > o)
			out.push({ t: mat.id, n: mat.n, y: 'over_receipt', m: `Delivered ${r} exceeds ${o} ordered.`, d: now });

		const w = usages.filter((x) => x.t === mat.id).reduce((a, x) => a + (x.k ?? 0), 0);
		if (w <= 0) continue;
		for (const bm of benchmarks.filter((b) => b.t === mat.id)) {
			const expected = bm.q * w;
			if (u > expected * (1 + bm.e / 100))
				out.push({
					t: mat.id,
					n: mat.n,
					y: 'over_use',
					m: `Used ${u} vs ~${Math.round(expected)} expected for ${w} ${bm.w} (>${bm.e}% tolerance).`,
					d: now
				});
			else if (u < expected * (1 - bm.e / 100))
				out.push({
					t: mat.id,
					n: mat.n,
					y: 'under_use',
					m: `Used ${u} vs ~${Math.round(expected)} expected for ${w} ${bm.w} (<${bm.e}% tolerance).`,
					d: now
				});
		}
	}
	return out;
}

// per-material stock: ordered / received / used / on-hand
export async function stock(env: AppEnv, id: string): Promise<Stock[]> {
	const materials = await fetch_materials(env, id);
	const [orders, receipts, usages] = await Promise.all([
		fetch_kind<Order>(env, 'o', id),
		fetch_kind<Receipt>(env, 'r', id),
		fetch_kind<Usage>(env, 'g', id)
	]);
	return compute_stock(materials, orders, receipts, usages);
}

// discrepancies (vs benchmarks and stock)
export async function flags(env: AppEnv, id: string): Promise<Flag[]> {
	const materials = await fetch_materials(env, id);
	const [orders, receipts, usages, benchmarks] = await Promise.all([
		fetch_kind<Order>(env, 'o', id),
		fetch_kind<Receipt>(env, 'r', id),
		fetch_kind<Usage>(env, 'g', id),
		fetch_kind<Benchmark>(env, 'k', id)
	]);
	return compute_flags(materials, orders, receipts, usages, benchmarks);
}

export async function list_drawings(env: AppEnv, id: string): Promise<DrawingRow[]> {
	const pts = await scroll(env, f(eq('s', 'f'), eq('j', id)));
	return pts.map((p) => ({ id: String(p.id), ...(p.payload as Drawing) }));
}

export async function add_drawing(
	env: AppEnv,
	id: string,
	uid: string,
	d: { n: string; f: string; y: string }
): Promise<{ id: string }> {
	const pid = new_id();
	const payload: Drawing = { s: 'f', j: id, n: d.n, f: d.f, y: d.y, d: Date.now(), b: uid };
	await (await qc(env)).upsert(C, { points: [{ id: pid, vector: ZV, payload }] });
	return { id: pid };
}

export async function list_milestones(env: AppEnv, id: string): Promise<MilestoneRow[]> {
	const pts = await scroll(env, f(eq('s', 'l'), eq('j', id)));
	return pts.map((p) => ({ id: String(p.id), ...(p.payload as Milestone) })).sort((a, b) => b.d - a.d);
}

// delete any point in a site (owner checked by caller)
export async function delete_item(env: AppEnv, id: string, pid: string): Promise<void> {
	const pt = await retrieve_one(env, pid);
	const j = (pt?.payload as { j?: string } | null)?.j;
	if (j === id) await (await qc(env)).delete(C, { points: [pid] });
}
