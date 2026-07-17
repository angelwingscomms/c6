<script lang="ts">
	let { size = 34, label = true }: { size?: number; label?: boolean } = $props();
</script>

<a href="/" class="logo" aria-label="c6 Site Ledger">
	<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
		<rect x="0.7" y="0.7" width="38.6" height="38.6" rx="9" fill="none" stroke="var(--color-line2)" />
		<!-- surveyor benchmark triangle -->
		<path d="M20 9l9 16H11z" fill="none" stroke="var(--color-amber)" stroke-width="1.6" stroke-linejoin="round" />
		<circle cx="20" cy="20.5" r="2.1" fill="var(--color-amber)" />
		<path d="M13 29h14" stroke="var(--color-line2)" stroke-width="1.4" stroke-linecap="round" />
	</svg>
	{#if label}
		<span class="logo-txt">
			<b class="serif">c6</b>
			<i class="eyebrow">Site Ledger</i>
		</span>
	{/if}
</a>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
	}
	.logo-txt {
		display: flex;
		flex-direction: column;
		line-height: 1;
		gap: 0.18rem;
	}
	.logo-txt b {
		font-size: 1.2rem;
		font-style: normal;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	.logo-txt i {
		font-style: normal;
		font-size: 0.56rem;
		letter-spacing: 0.28em;
	}
</style>
