<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		href = undefined,
		variant = 'default',
		sm = false,
		type = 'button',
		disabled = false,
		onclick = undefined,
		children,
		class: cls = ''
	}: {
		href?: string;
		variant?: 'default' | 'amber' | 'ghost';
		sm?: boolean;
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		class?: string;
	} = $props();
	const klass = $derived(
		`btn ${variant === 'amber' ? 'btn-amber' : variant === 'ghost' ? 'btn-ghost' : ''} ${sm ? 'btn-sm' : ''} ${cls}`
	);
</script>

{#if href}
	<a {href} class={klass}>{@render children()}</a>
{:else}
	<button {type} {disabled} {onclick} class={klass}>{@render children()}</button>
{/if}
