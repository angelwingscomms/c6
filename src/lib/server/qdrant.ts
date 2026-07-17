import { QdrantClient } from '@qdrant/js-client-rest';

export type SecretVal = string | { get?: () => Promise<string> } | undefined;

export async function get_secret(v: SecretVal): Promise<string> {
	if (v && typeof (v as { get?: unknown }).get === 'function')
		return await (v as { get: () => Promise<string> }).get();
	return (v as string) ?? '';
}

let q: QdrantClient | null = null;
let q_url = '';
let q_key = '';

export async function client(url: string, key: string): Promise<QdrantClient> {
	if (!q || q_url !== url || q_key !== key)
		q = new QdrantClient({ url, apiKey: key, checkCompatibility: false });
	q_url = url;
	q_key = key;
	return q;
}

export const ZV: number[] = new Array(4096).fill(0);
export const C = 'c6';

export type QEnv = { QDRANT_URL: SecretVal; QDRANT_KEY: SecretVal };

export async function qc(env: QEnv): Promise<QdrantClient> {
	return client(await get_secret(env.QDRANT_URL), await get_secret(env.QDRANT_KEY));
}

// deterministic UUID from an external id (e.g. google sub)
export async function uuid_from(s: string): Promise<string> {
	const h = new Uint8Array(
		await crypto.subtle.digest('SHA-256', new TextEncoder().encode('c6:' + s))
	);
	const x = [...h.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-8${x.slice(17, 20)}-${x.slice(20, 32)}`;
}

export const new_id = (): string => crypto.randomUUID();

// filter helpers: eq('s','o'), f(eq('s','o'), eq('j', id))
export type Cond = { key: string; match: { value: string | number } };
export const eq = (key: string, value: string | number): Cond => ({ key, match: { value } });
export const f = (...conds: Cond[]) => ({ must: conds });

type Pt = { id: string | number; payload: Record<string, unknown> | null };

// idempotent: create collection + keyword indexes if missing (once per instance)
let ensured = false;
export async function ensure(env: QEnv): Promise<void> {
	if (ensured) return;
	const c = await qc(env);
	const ok = await c.collectionExists(C).then((r) => r.exists).catch(() => false);
	if (!ok)
		await c.createCollection(C, { vectors: { size: 4096, distance: 'Cosine' } }).catch(() => {});
	for (const key of ['s', 'j', 't', 'g', 'i'])
		await c.createPayloadIndex(C, { field_name: key, field_schema: 'keyword' }).catch(() => {});
	ensured = true;
}

export async function scroll(
	env: QEnv,
	filter: ReturnType<typeof f>,
	limit = 1000
): Promise<Pt[]> {
	const r = await (await qc(env))
		.scroll(C, { filter, limit, with_payload: true, with_vector: false })
		.catch(() => ({ points: [] as Pt[] }));
	return r.points as Pt[];
}

export async function retrieve_one(env: QEnv, id: string): Promise<Pt | null> {
	const r = await (await qc(env)).retrieve(C, { ids: [id] }).catch(() => []);
	return (r[0] as Pt) ?? null;
}

export async function search(
	env: QEnv,
	vector: number[],
	filter: ReturnType<typeof f>,
	limit = 12
): Promise<Pt[]> {
	const r = await (await qc(env))
		.search(C, { vector, filter, limit, with_payload: true })
		.catch(() => []);
	return r as unknown as Pt[];
}
