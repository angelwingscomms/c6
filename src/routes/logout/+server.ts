import type { RequestHandler } from './$types';

const clear = (cookies: Parameters<RequestHandler>[0]['cookies']) =>
	cookies.delete('session', { path: '/' });

export const POST: RequestHandler = async ({ cookies }) => {
	clear(cookies);
	return new Response(null, { status: 303, headers: { Location: '/' } });
};

export const GET: RequestHandler = async ({ cookies }) => {
	clear(cookies);
	return new Response(null, { status: 302, headers: { Location: '/' } });
};
