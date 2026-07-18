import { Google, generateState, generateCodeVerifier } from 'arctic';
import { get_secret, type SecretVal } from './qdrant';

export type GoogleEnv = { GOOGLE_ID: SecretVal; GOOGLE_SECRET: SecretVal; OAUTH_ORIGIN?: SecretVal };

// Redirect URI must exactly match an Authorized Redirect URI in Google Cloud
// Console. Derive it from OAUTH_ORIGIN when set (stable, registered value);
// otherwise fall back to the request origin so local dev still works.
export async function google_client(origin: string, env: GoogleEnv): Promise<Google> {
	const id = await get_secret(env.GOOGLE_ID);
	const secret = await get_secret(env.GOOGLE_SECRET);
	const base = (await get_secret(env.OAUTH_ORIGIN)) || origin;
	return new Google(id, secret, new URL('/google/callback', base).toString());
}

export { generateState, generateCodeVerifier };
