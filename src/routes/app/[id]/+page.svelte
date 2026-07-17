<script lang="ts">
	import type { Mat, Stock, Flag, Recent } from '$lib/types';
	import { post } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { reveal } from '$lib/actions';
	import Card from '$lib/components/Card.svelte';
	import Stat from '$lib/components/Stat.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Empty from '$lib/components/Empty.svelte';

	let {
		data
	}: {
		data: {
			project: { id: string; n: string; l?: string; o: string; i: string; a: string[] };
			m: Mat[];
			s: Stock[];
			f: Flag[];
			r: Recent[];
		};
	} = $props();

	const id = $derived(data.project.id);
	const members = $derived(new Set([data.project.o, ...(data.project.a ?? [])]).size);
	const on_hand = (row: Stock) => row.r - row.g;

	const flag_label: Record<Flag['y'], string> = {
		over_receipt: 'Over-delivered',
		over_use: 'Over-used',
		under_use: 'Under benchmark',
		negative_stock: 'Negative stock'
	};
	const kind_label: Record<Recent['y'], string> = { o: 'Ordered', r: 'Received', g: 'Used' };
	const kind_icon: Record<Recent['y'], string> = { o: 'box', r: 'truck', g: 'hammer' };

	function stock_state(row: Stock): { c: string; l: string } {
		const h = on_hand(row);
		if (h < 0) return { c: 'badge-bad', l: 'Negative' };
		if (row.r < row.o) return { c: 'badge-warn', l: 'Awaiting' };
		if (h === 0) return { c: 'badge', l: 'Empty' };
		return { c: 'badge-ok', l: 'On hand' };
	}

	// ---- quick log ----
	let open = $state(false);
	let kind = $state<'o' | 'r' | 'g'>('r');
	let mat = $state('');
	let qty = $state('');
	let sup = $state('');
	let work = $state('');
	let wqty = $state('');
	let note = $state('');
	let busy = $state(false);

	function start(k: 'o' | 'r' | 'g') {
		if (!data.m.length) {
			toast('Add a material first', 'info');
			return;
		}
		kind = k;
		mat = data.m[0].id;
		qty = '';
		sup = '';
		work = '';
		wqty = '';
		note = '';
		open = true;
	}

	async function submit() {
		if (!mat || !qty) {
			toast('Pick a material and quantity', 'info');
			return;
		}
		busy = true;
		const base = { t: mat, q: Number(qty), x: note || undefined };
		const body =
			kind === 'o'
				? { ...base, v: sup || undefined }
				: kind === 'g'
					? { ...base, w: work || undefined, k: wqty ? Number(wqty) : undefined }
					: base;
		const path = kind === 'o' ? 'order' : kind === 'r' ? 'receipt' : 'usage';
		const res = await post(`/api/project/${id}/${path}`, body, `${kind_label[kind]} logged`);
		busy = false;
		if (res) open = false;
	}

	async function copy_invite() {
		try {
			await navigator.clipboard.writeText(data.project.i);
			toast('Invite code copied', 'ok');
		} catch {
			toast(data.project.i, 'info');
		}
	}
	const fmt = (n: number) => n.toLocaleString('en-US');
	const ago = (t: number) => {
		const s = (Date.now() - t) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return `${Math.floor(s / 86400)}d ago`;
	};
</script>

<svelte:head><title>{data.project.n} · c6</title></svelte:head>

<!-- hero -->
<header class="hero" use:reveal>
	<div>
		<span class="eyebrow eyebrow-amber">01 — Site overview</span>
		<h1 class="display h1">{data.project.n}</h1>
		<div class="meta">
			{#if data.project.l}<span><Icon name="flag" size={14} />{data.project.l}</span>{/if}
			<span><Icon name="user" size={14} />{members} on site</span>
			<button class="chip" onclick={copy_invite} title="Copy invite code">
				<Icon name="copy" size={13} />{data.project.i}
			</button>
		</div>
	</div>
	<div class="acts">
		<Btn variant="amber" onclick={() => start('r')}><Icon name="truck" size={16} />Log delivery</Btn>
		<Btn onclick={() => start('g')}><Icon name="hammer" size={16} />Log usage</Btn>
		<Btn variant="ghost" onclick={() => start('o')}><Icon name="box" size={16} />Order</Btn>
	</div>
</header>

<!-- stats -->
<div class="statrow card" use:reveal={80}>
	<div class="cell"><Stat label="Materials" value={data.m.length} /></div>
	<div class="cell"><Stat label="Stock lines" value={data.s.length} /></div>
	<div class="cell"><Stat label="Open flags" value={data.f.length} tone={data.f.length ? 'bad' : 'ok'} /></div>
	<div class="cell"><Stat label="Recent entries" value={data.r.length} tone="amber" /></div>
</div>

{#if !data.m.length}
	<Card class="mt" delay={120}>
		<Empty icon="layers" title="No materials yet" sub="Add the materials you track on this site — cement, blocks, rebar — then log orders, deliveries and usage against them.">
			<Btn href={`/app/${id}/ledger`} variant="amber"><Icon name="plus" size={16} />Add materials</Btn>
		</Empty>
	</Card>
{:else}
	<div class="grid">
		<!-- stock -->
		<Card pad={false} delay={120}>
			<div class="sec-head">
				<span class="eyebrow">02 — Materials on hand</span>
				<a class="lk" href={`/app/${id}/ledger`}>Full ledger <Icon name="arrow" size={14} /></a>
			</div>
			<div class="tbl">
				<div class="tr th">
					<span>Material</span><span class="r">Ordered</span><span class="r">Recv</span>
					<span class="r">Used</span><span class="r">On hand</span><span></span>
				</div>
				{#each data.s as row (row.t)}
					{@const st = stock_state(row)}
					<a class="tr" href={`/app/${id}/ledger?t=${row.t}`}>
						<span class="mname">{row.n}<em>{row.u}</em></span>
						<span class="r num">{fmt(row.o)}</span>
						<span class="r num">{fmt(row.r)}</span>
						<span class="r num">{fmt(row.g)}</span>
						<span class="r num strong" class:neg={on_hand(row) < 0}>{fmt(on_hand(row))}</span>
						<span class="r"><span class="badge {st.c}">{st.l}</span></span>
					</a>
				{/each}
			</div>
		</Card>

		<!-- flags -->
		<Card pad={false} delay={180} class="side">
			<div class="sec-head">
				<span class="eyebrow">03 — Discrepancy flags</span>
				{#if data.f.length}<span class="badge badge-bad">{data.f.length}</span>{/if}
			</div>
			{#if !data.f.length}
				<div class="okbox">
					<span class="dot" style="color:var(--color-ok)"></span>
					<p>Everything reconciles. No discrepancies detected against your benchmarks and stock.</p>
				</div>
			{:else}
				<ul class="flags">
					{#each data.f as fl (fl.t + fl.y)}
						<li>
							<span class="badge badge-bad">{flag_label[fl.y]}</span>
							<div>
								<b>{fl.n}</b>
								<p>{fl.m}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>

	<!-- recent -->
	<Card pad={false} class="mt" delay={220}>
		<div class="sec-head"><span class="eyebrow">04 — Recent activity</span></div>
		{#if !data.r.length}
			<div class="okbox"><p>No entries logged yet. Use the actions above to record your first delivery.</p></div>
		{:else}
			<ul class="feed">
				{#each data.r as e (e.id)}
					<li>
						<span class="fi {e.y}"><Icon name={kind_icon[e.y]} size={15} /></span>
						<span class="ft"><b>{kind_label[e.y]}</b> {fmt(e.q)} {e.u} · {e.n}</span>
						<span class="fd num">{ago(e.d)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>
{/if}

<!-- quick-log modal -->
<Modal bind:open title={`Log ${kind === 'o' ? 'order' : kind === 'r' ? 'delivery' : 'usage'}`}>
	<div class="seg">
		{#each [['r', 'Delivery'], ['g', 'Usage'], ['o', 'Order']] as [k, l] (k)}
			<button class="sg" class:on={kind === k} onclick={() => (kind = k as 'o' | 'r' | 'g')}>{l}</button>
		{/each}
	</div>
	<div class="form">
		<label class="lbl"><span class="eyebrow">Material</span>
			<select class="field" bind:value={mat}>
				{#each data.m as mm (mm.id)}<option value={mm.id}>{mm.n} ({mm.u})</option>{/each}
			</select>
		</label>
		<label class="lbl"><span class="eyebrow">Quantity</span>
			<input class="field" type="number" inputmode="decimal" placeholder="0" bind:value={qty} />
		</label>
		{#if kind === 'o'}
			<label class="lbl"><span class="eyebrow">Supplier (optional)</span>
				<input class="field" placeholder="e.g. Dangote depot" bind:value={sup} />
			</label>
		{/if}
		{#if kind === 'g'}
			<label class="lbl"><span class="eyebrow">Work done (optional)</span>
				<input class="field" placeholder="e.g. ground-floor blockwork" bind:value={work} />
			</label>
			<label class="lbl"><span class="eyebrow">Work quantity (optional)</span>
				<input class="field" type="number" placeholder="e.g. 200 blocks laid" bind:value={wqty} />
			</label>
		{/if}
		<label class="lbl"><span class="eyebrow">Note (optional)</span>
			<input class="field" placeholder="anything worth remembering" bind:value={note} />
		</label>
		<Btn variant="amber" onclick={submit} disabled={busy} class="w">
			<Icon name="check" size={16} />{busy ? 'Saving…' : 'Save entry'}
		</Btn>
	</div>
</Modal>

<style>
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
		margin: 0.5rem 0 0.7rem;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		color: var(--color-mute);
		font-size: 0.85rem;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--color-panel2);
		border: 1px solid var(--color-line);
		color: var(--color-amber);
		font-family: var(--font-ui);
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		padding: 0.3rem 0.6rem;
		border-radius: 7px;
		cursor: pointer;
	}
	.chip:hover {
		border-color: var(--color-line2);
	}
	.acts {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.statrow {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		padding: clamp(1.1rem, 2.6vw, 1.6rem);
	}
	.cell + .cell {
		border-left: 1px solid var(--color-line);
		padding-left: clamp(1rem, 2.4vw, 1.6rem);
	}
	.grid {
		display: grid;
		grid-template-columns: 1.7fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}
	.mt {
		margin-top: 1rem;
	}
	.sec-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.3rem;
		border-bottom: 1px solid var(--color-line);
	}
	.lk {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: var(--color-mute);
	}
	.lk:hover {
		color: var(--color-amber);
	}
	/* stock table */
	.tbl {
		display: flex;
		flex-direction: column;
	}
	.tr {
		display: grid;
		grid-template-columns: 1.6fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 1.3rem;
		border-bottom: 1px solid var(--color-line);
		transition: background 0.2s;
	}
	a.tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.tr:last-child {
		border-bottom: 0;
	}
	.th {
		font-size: 0.64rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-faint);
	}
	.r {
		text-align: right;
		justify-self: end;
	}
	.mname {
		display: flex;
		flex-direction: column;
		font-weight: 500;
		font-size: 0.92rem;
	}
	.mname em {
		font-style: normal;
		color: var(--color-faint);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.strong {
		font-weight: 600;
	}
	.neg {
		color: var(--color-bad);
	}
	.okbox {
		display: flex;
		gap: 0.7rem;
		align-items: flex-start;
		padding: 1.3rem;
		color: var(--color-mute);
		font-size: 0.86rem;
	}
	.okbox .dot {
		margin-top: 6px;
		flex: none;
	}
	.flags {
		list-style: none;
		margin: 0;
		padding: 0.4rem 0;
	}
	.flags li {
		display: flex;
		gap: 0.7rem;
		padding: 0.75rem 1.3rem;
		border-bottom: 1px solid var(--color-line);
	}
	.flags li:last-child {
		border-bottom: 0;
	}
	.flags b {
		font-size: 0.88rem;
	}
	.flags p {
		color: var(--color-mute);
		font-size: 0.8rem;
		margin: 0.15rem 0 0;
	}
	.feed {
		list-style: none;
		margin: 0;
		padding: 0.3rem 0;
	}
	.feed li {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.7rem 1.3rem;
		border-bottom: 1px solid var(--color-line);
		font-size: 0.86rem;
	}
	.feed li:last-child {
		border-bottom: 0;
	}
	.fi {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 8px;
		border: 1px solid var(--color-line);
		flex: none;
	}
	.fi.o {
		color: var(--color-mute);
	}
	.fi.r {
		color: var(--color-ok);
	}
	.fi.g {
		color: var(--color-amber);
	}
	.ft {
		flex: 1;
		min-width: 0;
	}
	.fd {
		color: var(--color-faint);
		font-size: 0.76rem;
		white-space: nowrap;
	}
	/* modal form */
	.seg {
		display: flex;
		gap: 0.3rem;
		background: var(--color-base);
		border: 1px solid var(--color-line);
		border-radius: 10px;
		padding: 0.25rem;
		margin-bottom: 1.1rem;
	}
	.sg {
		flex: 1;
		background: none;
		border: 0;
		color: var(--color-mute);
		font-family: var(--font-ui);
		font-size: 0.82rem;
		padding: 0.5rem;
		border-radius: 8px;
		cursor: pointer;
	}
	.sg.on {
		background: var(--color-panel2);
		color: var(--color-ink);
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.form :global(.w) {
		width: 100%;
		margin-top: 0.3rem;
	}
	@media (max-width: 860px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.statrow {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.2rem 0;
		}
		.cell:nth-child(3) {
			border-left: 0;
			padding-left: 0;
		}
	}
	@media (max-width: 560px) {
		.tr {
			grid-template-columns: 1.4fr 0.8fr 0.9fr;
		}
		.th span:nth-child(2),
		.tr span:nth-child(2),
		.th span:nth-child(3),
		.tr span:nth-child(3) {
			display: none;
		}
	}
</style>
