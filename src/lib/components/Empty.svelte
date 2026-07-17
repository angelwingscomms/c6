<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	let { icon = 'box', title, sub = '', children }: { icon?: string; title: string; sub?: string; children?: Snippet } = $props();
</script>

<div class="empty">
	<div class="ic"><Icon name={icon} size={22} /></div>
	<p class="serif t">{title}</p>
	{#if sub}<p class="s">{sub}</p>{/if}
	{#if children}<div class="act">{@render children()}</div>{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
		padding: clamp(2rem, 6vw, 3.5rem) 1rem;
		color: var(--color-mute);
	}
	.ic {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: 12px;
		border: 1px solid var(--color-line);
		color: var(--color-amber);
		margin-bottom: 0.4rem;
	}
	.t {
		font-size: 1.2rem;
		color: var(--color-ink);
	}
	.s {
		font-size: 0.88rem;
		max-width: 34ch;
	}
	.act {
		margin-top: 0.7rem;
	}
</style>
