import type { AppEnv } from './env';
import { new_id } from './qdrant';

// R2 object key for a site upload: p/<project_id>/<uuid>
export const file_key = (project_id: string): string => `p/${project_id}/${new_id()}`;

// project id embedded in a key (for member guard on /f/<key>)
export const project_of_key = (key: string): string | null => {
	const m = /^p\/([^/]+)\//.exec(key);
	return m ? m[1] : null;
};

export async function put_file(
	env: AppEnv,
	key: string,
	body: ReadableStream | ArrayBuffer | ArrayBufferView | string,
	content_type: string
): Promise<void> {
	await env.R2.put(key, body, { httpMetadata: { contentType: content_type } });
}

export async function get_file(
	env: AppEnv,
	key: string
): Promise<{ body: ReadableStream; type: string; size: number } | null> {
	const o = await env.R2.get(key);
	if (!o || !o.body) return null;
	return {
		body: o.body,
		type: o.httpMetadata?.contentType ?? 'application/octet-stream',
		size: o.size
	};
}
