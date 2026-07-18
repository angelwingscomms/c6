import { env as dyn } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import type { SecretVal } from './qdrant';

// Unified server env. In production the values are Cloudflare secrets-store
// bindings (objects with async .get()); locally they are plain strings from
// .env via $env/dynamic/private. get_secret() unwraps either shape.
export type AppEnv = {
	QDRANT_URL: SecretVal;
	QDRANT_KEY: SecretVal;
	OPENROUTER_KEY: SecretVal;
	SECRET: SecretVal;
	GOOGLE_ID: SecretVal;
	GOOGLE_SECRET: SecretVal;
	OAUTH_ORIGIN?: SecretVal;
	R2: R2Bucket;
};

export function platform_env(event: RequestEvent): AppEnv {
	const p = (event.platform?.env ?? {}) as Record<string, unknown>;
	const pick = (k: string) => (p[k] ?? dyn[k]) as SecretVal;
	return {
		QDRANT_URL: pick('QDRANT_URL'),
		QDRANT_KEY: pick('QDRANT_KEY'),
		OPENROUTER_KEY: pick('OPENROUTER_KEY'),
		SECRET: pick('SECRET'),
		GOOGLE_ID: pick('GOOGLE_ID'),
		GOOGLE_SECRET: pick('GOOGLE_SECRET'),
		OAUTH_ORIGIN: pick('OAUTH_ORIGIN'),
		R2: p.R2 as R2Bucket
	};
}
