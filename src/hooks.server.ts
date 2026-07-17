import { platform_env } from '$lib/server/env';
import { decode_session } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	const c = event.cookies.get('session');
	if (c) {
		const s = await decode_session(platform_env(event).SECRET, c).catch(() => null);
		if (s) event.locals.user = s.user;
		else event.cookies.delete('session', { path: '/' });
	}
	return resolve(event);
};
