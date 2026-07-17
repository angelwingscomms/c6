<script lang="ts">
	import type { Snippet } from 'svelte';
	import { reveal } from '$lib/actions';
	let {
		pad = true,
		hover = false,
		delay = 0,
		href = undefined,
		children,
		class: cls = ''
	}: { pad?: boolean; hover?: boolean; delay?: number; href?: string; children: Snippet; class?: string } = $props();
	const klass = $derived(`card ${pad ? 'card-pad' : ''} ${hover ? 'card-hover' : ''} ${cls}`);
</script>

{#if href}
	<a {href} class={klass} use:reveal={delay}>{@render children()}</a>
{:else}
	<div class={klass} use:reveal={delay}>{@render children()}</div>
{/if}
