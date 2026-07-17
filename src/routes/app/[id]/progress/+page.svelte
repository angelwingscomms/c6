<script lang="ts">
	import type { MilestoneRow } from '$lib/types';
	import { post, del } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { reveal } from '$lib/actions';
	import Card from '$lib/components/Card.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Empty from '$lib/components/Empty.svelte';

	let {
		data
	}: {
		data: {
			project: { id: string; n: string; l?: string; o: string; i: string; a: string[] };
			is_owner: boolean;
			l: MilestoneRow[];
		};
	} = $props();

	const id = $derived(data.project.id);
	const pct = $derived(data.l.length ? Math.max(...data.l.map((m) => m.c)) : 0);

	// ---- add milestone ----
	let open = $state(false);
	let n = $state('');
	let c = $state('');
	let x = $state('');
	let photo: File | null = $state(null);
	let photo_input: HTMLInputElement;
	let busy = $state(false);

	function open_modal() {
		n = '';
		c = '';
		x = '';
		photo = null;
		open = true;
	}

	function on_photo(e: Event) {
		photo = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
	}

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

	async function submit() {
		if (!n.trim() || c === '') {
			toast('Add a title and percent complete', 'info');
			return;
		}
		busy = true;
		let f: string | undefined;
		if (photo) {
			const k = await upload_file(photo);
			if (!k) {
				busy = false;
				return;
			}
			f = k;
		}
		const res = await post(
			`/api/project/${id}/milestone`,
			{ n, c: Number(c), f, x: x || undefined },
			'Milestone added'
		);
		busy = false;
		if (res) open = false;
	}

	const ago = (t: number) => {
		const s = (Date.now() - t) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return `${Math.floor(s / 86400)}d ago`;
	};
</script>

<svelte:head><title>Progress · {data.project.n} · c6</title></svelte:head>

<header class="hero" use:reveal>
	<div>
		<span class="eyebrow eyebrow-amber">04 — Progress</span>
		<h1 class="display h1">Milestones</h1>
	</div>
	<Btn variant="amber" onclick={open_modal}><Icon name="plus" size={16} />Add milestone</Btn>
</header>

<Card class="mt overall" delay={100}>
	<Stat label="Overall complete" value={pct} unit="%" tone="amber" />
	<div class="track"><div class="fill" style={`width:${pct}%`}></div></div>
</Card>

{#if !data.l.length}
	<Card class="mt" delay={160}>
		<Empty
			icon="flag"
			title="No milestones yet"
			sub="Log progress as work happens — foundation, blockwork, roofing — so everyone can see how the site is tracking."
		>
			<Btn variant="amber" onclick={open_modal}><Icon name="plus" size={16} />Add milestone</Btn>
		</Empty>
	</Card>
{:else}
	<Card pad={false} class="mt" delay={160}>
		<div class="sec-head"><span class="eyebrow">Timeline</span></div>
		<ul class="timeline">
			{#each data.l as m (m.id)}
				<li>
					<div class="node"><span class="dot" style="color:var(--color-amber)"></span></div>
					<div class="tbody">
						<div class="thead">
							<span class="badge pct num">{m.c}%</span>
							<h3 class="serif ttitle">{m.n}</h3>
							<span class="tdate num">{ago(m.d)}</span>
							{#if data.is_owner}
								<button
									class="del"
									aria-label="Delete milestone"
									onclick={() => del(`/api/project/${id}/item/${m.id}`, 'Removed')}
								>
									✕
								</button>
							{/if}
						</div>
						{#if m.x}<p class="tnote">{m.x}</p>{/if}
						{#if m.f}
							<a class="tphoto" href={`/f/${m.f}`} target="_blank" rel="noreferrer">
								<img src={`/f/${m.f}`} alt="" loading="lazy" />
							</a>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</Card>
{/if}

<!-- add milestone modal -->
<Modal bind:open title="Add milestone">
	<div class="form">
		<Field label="Title" bind:value={n} placeholder="e.g. Foundation complete" />
		<Field
			label="Percent complete"
			type="number"
			bind:value={c}
			placeholder="0–100"
			hint="Overall site completion, 0–100"
		/>
		<div class="photofield">
			<span class="eyebrow">Photo (optional)</span>
			<div class="photorow">
				<Btn variant="ghost" sm onclick={() => photo_input.click()}>
					<Icon name="file" size={14} />{photo ? photo.name : 'Attach photo'}
				</Btn>
			</div>
		</div>
		<Field label="Note (optional)" bind:value={x} placeholder="anything worth remembering" />
		<Btn variant="amber" onclick={submit} disabled={busy} class="w">
			<Icon name="check" size={16} />{busy ? 'Saving…' : 'Save milestone'}
		</Btn>
	</div>
</Modal>
<input
	bind:this={photo_input}
	type="file"
	accept="image/*"
	class="hidden-input"
	onchange={on_photo}
/>

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
	.overall {
		display: flex;
		align-items: center;
		gap: clamp(1.4rem, 4vw, 3rem);
		flex-wrap: wrap;
	}
	.overall :global(.stat) {
		flex: none;
	}
	.track {
		flex: 1;
		min-width: 180px;
		height: 10px;
		border-radius: 99px;
		background: var(--color-panel2);
		border: 1px solid var(--color-line);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--color-amber);
		border-radius: 99px;
		transition: width 0.7s var(--ease-out);
	}
	.sec-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.3rem;
		border-bottom: 1px solid var(--color-line);
	}
	/* timeline */
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0.6rem 0.4rem;
	}
	.timeline li {
		display: flex;
		gap: 0.9rem;
		padding: 0.7rem 0.9rem;
	}
	.node {
		position: relative;
		flex: none;
		width: 18px;
		display: flex;
		justify-content: center;
	}
	.node::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: -0.7rem;
		left: 50%;
		width: 1px;
		background: var(--color-line);
		transform: translateX(-50%);
	}
	.timeline li:last-child .node::before {
		display: none;
	}
	.node .dot {
		position: relative;
		z-index: 1;
		margin-top: 7px;
	}
	.tbody {
		flex: 1;
		min-width: 0;
		padding-bottom: 0.3rem;
	}
	.thead {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.badge.pct {
		color: var(--color-amber);
		border-color: color-mix(in oklab, var(--color-amber) 40%, transparent);
		background: color-mix(in oklab, var(--color-amber) 10%, transparent);
	}
	.ttitle {
		flex: 1;
		min-width: 0;
		font-size: 1.05rem;
		margin: 0;
	}
	.tdate {
		font-size: 0.74rem;
		color: var(--color-faint);
		white-space: nowrap;
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
		flex: none;
		transition:
			color 0.2s var(--ease),
			border-color 0.2s var(--ease);
	}
	.del:hover {
		color: var(--color-bad);
		border-color: color-mix(in oklab, var(--color-bad) 40%, transparent);
	}
	.tnote {
		margin: 0.4rem 0 0;
		color: var(--color-mute);
		font-size: 0.86rem;
	}
	.tphoto {
		display: block;
		margin-top: 0.6rem;
		width: 160px;
		height: 90px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--color-line);
	}
	.tphoto img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	/* modal form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.form :global(.w) {
		width: 100%;
		margin-top: 0.3rem;
	}
	.photofield .eyebrow {
		margin-bottom: 0.45rem;
		display: block;
	}
</style>
