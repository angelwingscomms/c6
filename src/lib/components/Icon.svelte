<script lang="ts">
	// minimal 1.5px stroke icon set
	let { name, size = 18, class: cls = '' }: { name: string; size?: number; class?: string } = $props();
	const paths: Record<string, string> = {
		plus: 'M12 5v14M5 12h14',
		arrow: 'M5 12h14M13 6l6 6-6 6',
		back: 'M19 12H5M11 6l-6 6 6 6',
		check: 'M20 6L9 17l-5-5',
		box: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',
		truck: 'M3 6h11v9H3zM14 9h4l3 3v3h-7M6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
		hammer: 'M14 7l4 4M4 20l7-7M12.5 8.5l3 3 4-4-3-3zM17 5l2-2',
		flag: 'M5 3v18M5 4h11l-2 4 2 4H5',
		layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
		file: 'M6 3h8l4 4v14H6zM14 3v4h4',
		gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 1h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 23h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6A7 7 0 0019 12z',
		spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
		user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
		google: '',
		logout: 'M15 12H3M11 8l-4 4 4 4M9 4h9v16H9',
		chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
		copy: 'M9 9h11v11H9zM5 15H4V4h11v1'
	};
</script>

{#if name === 'google'}
	<svg width={size} height={size} viewBox="0 0 24 24" class={cls} aria-hidden="true">
		<path fill="#EA4335" d="M12 10.2v3.9h5.5a4.7 4.7 0 01-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2z" transform="translate(-.8 -1.8) scale(1.04)" />
		<path fill="#4285F4" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1a5.8 5.8 0 01-5.4-4H3.2v2.5A10 10 0 0012 22z" />
		<path fill="#FBBC05" d="M6.6 14a6 6 0 010-3.9V7.6H3.2a10 10 0 000 8.9z" />
		<path fill="#34A853" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003.2 7.6L6.6 10a5.8 5.8 0 015.4-3.9z" />
	</svg>
{:else}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={cls}
		aria-hidden="true"
	>
		<path d={paths[name] ?? ''} />
	</svg>
{/if}
