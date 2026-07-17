type Toast = { id: number; m: string; k: 'ok' | 'bad' | 'info' };

export const toasts = $state<{ list: Toast[] }>({ list: [] });

let n = 0;
export function toast(m: string, k: Toast['k'] = 'info') {
	const id = ++n;
	toasts.list.push({ id, m, k });
	setTimeout(() => {
		toasts.list = toasts.list.filter((t) => t.id !== id);
	}, 3600);
}
