<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		open = $bindable(false),
		title,
		children
	}: { open?: boolean; title: string; children: Snippet } = $props();
	function key(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={key} />

{#if open}
	<div
		class="ov"
		role="button"
		tabindex="-1"
		aria-label="Close"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
		onkeydown={() => {}}
	>
		<div class="card card-pad sheet" role="dialog" aria-modal="true" aria-label={title}>
			<div class="head">
				<span class="eyebrow eyebrow-amber">{title}</span>
				<button class="x" aria-label="Close" onclick={() => (open = false)}>✕</button>
			</div>
			<hr class="hair" style="margin:0.9rem 0 1.2rem" />
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.ov {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: grid;
		place-items: start center;
		padding: clamp(1rem, 8vh, 6rem) 1rem 2rem;
		background: rgba(6, 6, 5, 0.72);
		backdrop-filter: blur(6px);
		animation: fade-up 0.3s var(--ease-out);
		overflow-y: auto;
	}
	.sheet {
		width: 100%;
		max-width: 460px;
		background: var(--color-panel);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.x {
		background: none;
		border: 0;
		color: var(--color-mute);
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0.2rem;
	}
	.x:hover {
		color: var(--color-ink);
	}
</style>
