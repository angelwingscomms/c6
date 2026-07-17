<script lang="ts">
	import { toasts } from '$lib/toast.svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="stack" aria-live="polite">
	{#each toasts.list as t (t.id)}
		<div class="t {t.k}" transition:fly={{ y: 14, duration: 260 }}>
			<span class="dot"></span>{t.m}
		</div>
	{/each}
</div>

<style>
	.stack {
		position: fixed;
		bottom: 1.4rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 80;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		pointer-events: none;
	}
	.t {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: var(--color-panel2);
		border: 1px solid var(--color-line2);
		border-radius: 10px;
		padding: 0.7rem 1rem;
		font-size: 0.85rem;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	}
	.t .dot {
		color: var(--color-mute);
	}
	.ok .dot {
		color: var(--color-ok);
	}
	.bad .dot {
		color: var(--color-bad);
	}
	.info .dot {
		color: var(--color-amber);
	}
</style>
