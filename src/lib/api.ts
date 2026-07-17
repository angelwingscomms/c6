import { invalidateAll } from '$app/navigation';
import { toast } from './toast.svelte';

// POST JSON, refresh page data, toast on error. Returns parsed body.
export async function post<T = unknown>(url: string, body?: unknown, ok_msg?: string): Promise<T | null> {
	try {
		const r = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
		if (!r.ok) {
			toast(r.status === 403 ? 'Not allowed' : 'Something went wrong', 'bad');
			return null;
		}
		const data = (await r.json().catch(() => ({}))) as T;
		if (ok_msg) toast(ok_msg, 'ok');
		await invalidateAll();
		return data;
	} catch {
		toast('Network error', 'bad');
		return null;
	}
}

export async function del(url: string, ok_msg?: string): Promise<boolean> {
	try {
		const r = await fetch(url, { method: 'DELETE' });
		if (!r.ok) {
			toast('Could not delete', 'bad');
			return false;
		}
		if (ok_msg) toast(ok_msg, 'ok');
		await invalidateAll();
		return true;
	} catch {
		toast('Network error', 'bad');
		return false;
	}
}
