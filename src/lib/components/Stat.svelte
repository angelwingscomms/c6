<script lang="ts">
	import { count_up } from '$lib/actions';
	let {
		label,
		value,
		unit = '',
		dp = 0,
		tone = 'ink'
	}: { label: string; value: number; unit?: string; dp?: number; tone?: 'ink' | 'amber' | 'ok' | 'bad' } = $props();
	const color = $derived(
		tone === 'amber'
			? 'var(--color-amber)'
			: tone === 'ok'
				? 'var(--color-ok)'
				: tone === 'bad'
					? 'var(--color-bad)'
					: 'var(--color-ink)'
	);
</script>

<div class="stat">
	<span class="eyebrow">{label}</span>
	<div class="row">
		<span class="num v" style:color={color} use:count_up={{ to: value, dp }}></span>
		{#if unit}<span class="u">{unit}</span>{/if}
	</div>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.v {
		font-family: var(--font-ui);
		font-weight: 600;
		font-size: clamp(1.9rem, 4.4vw, 2.9rem);
		line-height: 0.9;
	}
	.u {
		font-size: 0.8rem;
		color: var(--color-mute);
		letter-spacing: 0.04em;
	}
</style>
