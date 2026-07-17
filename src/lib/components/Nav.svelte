<script lang="ts">
	import Logo from './Logo.svelte';
	import Btn from './Btn.svelte';
	let { user = null }: { user?: { name: string } | null } = $props();
</script>

<header class="nav">
	<div class="wrap bar">
		<Logo />
		<nav class="links">
			<a href="/#how" class="lk">How it works</a>
			<a href="/#features" class="lk">Features</a>
			{#if user}
				<Btn href="/app" variant="amber" sm>Open app</Btn>
			{:else}
				<Btn href="/login" variant="amber" sm>Sign in</Btn>
			{/if}
		</nav>
	</div>
</header>

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in oklab, var(--color-base) 72%, transparent);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--color-line);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 68px;
	}
	.links {
		display: flex;
		align-items: center;
		gap: 1.6rem;
	}
	.lk {
		font-size: 0.85rem;
		color: var(--color-mute);
		transition: color 0.2s;
	}
	.lk:hover {
		color: var(--color-ink);
	}
	@media (max-width: 640px) {
		.lk {
			display: none;
		}
	}
</style>
