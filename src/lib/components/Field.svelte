<script lang="ts">
	let {
		label,
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		required = false,
		step = undefined,
		options = undefined,
		hint = ''
	}: {
		label: string;
		value?: string | number;
		type?: string;
		placeholder?: string;
		required?: boolean;
		step?: string;
		options?: { v: string; l: string }[];
		hint?: string;
	} = $props();
</script>

<label class="lbl">
	<span class="eyebrow">{label}</span>
	{#if options}
		<select class="field" bind:value>
			{#each options as o (o.v)}<option value={o.v}>{o.l}</option>{/each}
		</select>
	{:else if type === 'textarea'}
		<textarea class="field" rows="3" {placeholder} {required} bind:value></textarea>
	{:else}
		<input class="field" {type} {placeholder} {required} {step} bind:value />
	{/if}
	{#if hint}<small class="hint">{hint}</small>{/if}
</label>

<style>
	.lbl {
		display: block;
	}
	.eyebrow {
		margin-bottom: 0.45rem;
		display: block;
	}
	.hint {
		display: block;
		margin-top: 0.35rem;
		color: var(--color-faint);
		font-size: 0.72rem;
	}
</style>
