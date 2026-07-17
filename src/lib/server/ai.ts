import type { AppEnv } from './env';
import type { Material, Order, Receipt, Usage } from '$lib/types';
import { eq, f, scroll } from './qdrant';
import { chat } from './or';
import { stock, flags } from './ledger';

// ============================================================
// implemented by Worker A. Signature is FROZEN.
// Grounded answer over a site's recent records (uses chat() in ./or).
// ============================================================
export async function answer(env: AppEnv, id: string, q: string): Promise<string> {
	const stocks = await stock(env, id);
	const flag_list = await flags(env, id);

	const mat_pts = await scroll(env, f(eq('s', 'm'), eq('j', id)));
	const mat_name = new Map(mat_pts.map((p) => [String(p.id), (p.payload as Material).n]));

	const [order_pts, receipt_pts, usage_pts] = await Promise.all([
		scroll(env, f(eq('s', 'o'), eq('j', id))),
		scroll(env, f(eq('s', 'r'), eq('j', id))),
		scroll(env, f(eq('s', 'g'), eq('j', id)))
	]);

	const recent = [
		...order_pts.map((p) => {
			const v = p.payload as Order;
			return { kind: 'order', d: v.d, q: v.q, t: v.t, x: v.x };
		}),
		...receipt_pts.map((p) => {
			const v = p.payload as Receipt;
			return { kind: 'receipt', d: v.d, q: v.q, t: v.t, x: v.x };
		}),
		...usage_pts.map((p) => {
			const v = p.payload as Usage;
			return { kind: 'usage', d: v.d, q: v.q, t: v.t, x: v.x };
		})
	]
		.sort((a, b) => b.d - a.d)
		.slice(0, 10);

	const stock_lines = stocks.map(
		(s) => `${s.n}: ordered ${s.o}, received ${s.r}, used ${s.g}, on-hand ${s.r - s.g} ${s.u}`
	);
	const flag_lines = flag_list.map((fl) => fl.m);
	const recent_lines = recent.map(
		(r) => `${r.kind} of ${r.q} ${mat_name.get(r.t) ?? '?'}${r.x ? ` (${r.x})` : ''}`
	);

	const context = [...stock_lines, ...flag_lines, ...recent_lines].join('\n');
	const system =
		"You are c6, a construction-site assistant. Answer ONLY from the SITE RECORDS provided. Be concise and specific with numbers. If the records don't contain the answer, say so plainly.";
	const user = `SITE RECORDS:\n${context}\n\nQUESTION: ${q}`;

	const a = await chat(env, system, user);
	return a || "The AI assistant isn't configured yet.";
}
