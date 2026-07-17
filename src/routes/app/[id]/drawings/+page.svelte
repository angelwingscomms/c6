<script lang="ts">
	import type { DrawingRow } from '$lib/types';
	import { post, del } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { reveal } from '$lib/actions';
	import Card from '$lib/components/Card.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Empty from '$lib/components/Empty.svelte';

	let {
		data
	}: {
		data: {
			project: { id: string; n: string; l?: string; o: string; i: string; a: string[] };
			is_owner: boolean;
			d: DrawingRow[];
		};
	} = $props();

	const id = $derived(data.project.id);

	let file_input: HTMLInputElement;
	let busy = $state(false);

	async function upload_file(file: File): Promise<string | null> {
		const fd = new FormData();
		fd.append('file', file);
		const r = await fetch(`/api/upload?j=${id}`, { method: 'POST', body: fd });
		if (!r.ok) {
			toast('Upload failed', 'bad');
			return null;
		}
		return ((await r.json()) as { k: string }).k;
	}

	async function on_file(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		busy = true;
		const k = await upload_file(file);
		if (k)
			await post(
				`/api/project/${id}/drawing`,
				{ n: file.name, f: k, y: file.type || 'application/octet-stream' },
				'Uploaded'
			);
		busy = false;
		input.value = '';
	}

	const ago = (t: number) => {
		const s = (Date.now() - t) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return `${Math.floor(s / 86400)}d ago`;
	};
</script>

<svelte:head><title>Drawings · {data.project.n} · c6</title></svelte:head>

<input
	bind:this={file_input}
	type="file"
	accept="image/*,.pdf"
	class="hidden-input"
	onchange={on_file}
/>

<header class="hero" use:reveal>
	<div>
		<span class="eyebrow eyebrow-amber">05 — Drawings</span>
		<h1 class="display h1">Drawings &amp; documents</h1>
	</div>
	<Btn variant="amber" disabled={busy} onclick={() => file_input.click()}>
		<Icon name="plus" size={16} />{busy ? 'Uploading…' : 'Upload'}
	</Btn>
</header>

{#if !data.d.length}
	<Card class="mt" delay={120}>
		<Empty
			icon="file"
			title="No drawings yet"
			sub="Upload site plans, architectural drawings and documents so the whole crew can reference them."
		>
			<Btn variant="amber" disabled={busy} onclick={() => file_input.click()}>
				<Icon name="plus" size={16} />Upload a file
			</Btn>
		</Empty>
	</Card>
{:else}
	<div class="grid">
		{#each data.d as d, i (d.id)}
			<Card pad={false} delay={80 + i * 40} class="dcard">
				{#if d.y.startsWith('image/')}
					<a class="thumb" href={`/f/${d.f}`} target="_blank" rel="noreferrer">
						<img src={`/f/${d.f}`} alt={d.n} loading="lazy" />
					</a>
				{:else}
					<a class="thumb file" href={`/f/${d.f}`} target="_blank" rel="noreferrer">
						<Icon name="file" size={30} />
					</a>
				{/if}
				<div class="dinfo">
					<p class="dtitle" title={d.n}>{d.n}</p>
					<div class="drow">
						<span class="ddate num">{ago(d.d)}</span>
						{#if data.is_owner}
							<button
								class="del"
								aria-label="Delete drawing"
								onclick={() => del(`/api/project/${id}/item/${d.id}`, 'Removed')}
							>
								✕
							</button>
						{/if}
					</div>
				</div>
			</Card>
		{/each}
	</div>
{/if}

<style>
	.hidden-input {
		display: none;
	}
	.hero {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.6rem;
	}
	.h1 {
		font-size: clamp(2.1rem, 5.5vw, 3.4rem);
		margin: 0.5rem 0 0;
	}
	.mt {
		margin-top: 1rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.grid :global(.dcard) {
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.grid :global(.dcard:hover) {
		border-color: var(--color-line2);
	}
	.thumb {
		display: block;
		height: 150px;
		flex: none;
		background: var(--color-panel2);
		border-bottom: 1px solid var(--color-line);
		overflow: hidden;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.4s var(--ease);
	}
	.grid :global(.dcard:hover .thumb img) {
		transform: scale(1.04);
	}
	.thumb.file {
		display: grid;
		place-items: center;
		color: var(--color-amber);
	}
	.dinfo {
		padding: 0.9rem 1.05rem 1.05rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.dtitle {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.drow {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.ddate {
		font-size: 0.74rem;
		color: var(--color-faint);
	}
	.del {
		background: none;
		border: 1px solid var(--color-line);
		color: var(--color-mute);
		width: 24px;
		height: 24px;
		border-radius: 7px;
		font-size: 0.7rem;
		line-height: 1;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition:
			color 0.2s var(--ease),
			border-color 0.2s var(--ease);
	}
	.del:hover {
		color: var(--color-bad);
		border-color: color-mix(in oklab, var(--color-bad) 40%, transparent);
	}
</style>
