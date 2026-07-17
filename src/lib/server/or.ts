import { get_secret, ZV, type SecretVal } from './qdrant';

export type OrEnv = { OPENROUTER_KEY: SecretVal };

const EMBED_MODEL = 'qwen/qwen3-embedding-8b';
const CHAT_MODEL = 'google/gemini-2.5-flash';

export async function embed(env: OrEnv, text: string): Promise<number[]> {
	const key = await get_secret(env.OPENROUTER_KEY);
	if (!key || !text.trim()) return ZV;
	try {
		const r = await fetch('https://openrouter.ai/api/v1/embeddings', {
			method: 'POST',
			headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 8000) })
		});
		if (!r.ok) return ZV;
		const j = (await r.json()) as { data: { embedding: number[] }[] };
		return j.data[0].embedding;
	} catch {
		return ZV;
	}
}

export async function chat(env: OrEnv, system: string, user: string): Promise<string> {
	const key = await get_secret(env.OPENROUTER_KEY);
	if (!key) return '';
	const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: CHAT_MODEL,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			]
		})
	});
	if (!r.ok) throw new Error('ai_unavailable');
	const j = (await r.json()) as { choices: { message: { content: string } }[] };
	return j.choices[0].message.content;
}
