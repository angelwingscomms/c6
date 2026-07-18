<script lang="ts">
	import type { Mat, Stock, Row } from '$lib/types';
	import { post, del } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { reveal, ctrlEnter } from '$lib/actions';
	import { page } from '$app/state';
	import Card from '$lib/components/Card.svelte';
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
			m: Mat[];
			s: Stock[];
		};
	} = $props();

	const id = $derived(data.project.id);
	const on_hand = (row: Stock) => row.r - row.g;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const ago = (t: number) => {
		const s = (Date.now() - t) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		return `${Math.floor(s / 86400)}d ago`;
	};

	function stock_state(row: Stock): { c: string; l: string } {
		const h = on_hand(row);
		if (h < 0) return { c: 'badge-bad', l: 'Negative' };
		if (row.r < row.o) return { c: 'badge-warn', l: 'Awaiting' };
		if (h === 0) return { c: 'badge', l: 'Empty' };
		return { c: 'badge-ok', l: 'On hand' };
	}

	// ---- selection + detail ----
	let sel = $state<string | null>(null);
	let detail = $state<{ o: Row[]; r: Row[]; g: Row[] } | null>(null);
	let detail_busy = $state(false);
	const sel_mat = $derived(data.m.find((m) => m.id === sel));

	async function select(t: string) {
		sel = t;
		detail_busy = true;
		detail = await fetch(`/api/project/${id}/ledger?t=${t}`).then((r) => r.json());
		detail_busy = false;
	}

	let did_auto = false;
	$effect(() => {
		if (did_auto) return;
		did_auto = true;
		const t = page.url.searchParams.get('t');
		if (t && data.m.some((m) => m.id === t)) select(t);
	});

	function line(row: Row): string {
		const bits: string[] = [];
		if (row.v) bits.push(row.v);
		if (row.w) bits.push(row.k ? `${row.w} (${fmt(row.k)})` : row.w);
		if (row.x) bits.push(row.x);
		return bits.join(' · ') || '—';
	}

	async function remove(pid: string) {
		await del(`/api/project/${id}/item/${pid}`, 'Entry removed');
		if (sel) select(sel);
	}

	const sections = $derived(
		detail ? ([['Orders', detail.o], ['Deliveries', detail.r], ['Usage', detail.g]] as [string, Row[]][]) : []
	);

	// ---- log entry (order/receipt/usage) ----
	let open = $state(false);
	let kind = $state<'o' | 'r' | 'g'>('r');
	let mat = $state('');
	let qty = $state('');
	let sup = $state('');
	let work = $state('');
	let wqty = $state('');
	let note = $state('');
	let busy = $state(false);
	const kind_label: Record<'o' | 'r' | 'g', string> = { o: 'Order', r: 'Delivery', g: 'Usage' };

	function start() {
		if (!data.m.length) {
			toast('Add a material first', 'info');
			return;
		}
		kind = 'r';
		mat = sel ?? data.m[0].id;
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
		if (res) {
			open = false;
			if (sel === mat) select(sel);
		}
	}

	// ---- add material ----
	let add_open = $state(false);
	let new_n = $state('');
	let new_u = $state('bags');
	let new_c = $state('');
	let add_busy = $state(false);
	const UNIT_OPTIONS = [
		{ v: 'bags', l: 'Bags' },
		{ v: 'pcs', l: 'Pieces' },
		{ v: 'm', l: 'Metres' },
		{ v: 'm³', l: 'Cubic m' },
		{ v: 'tonnes', l: 'Tonnes' },
		{ v: 'kg', l: 'Kg' },
		{ v: 'litres', l: 'Litres' }
	];

	function open_add() {
		new_n = '';
		new_u = 'bags';
		new_c = '';
		add_open = true;
	}

	async function add_material_submit() {
		if (!new_n.trim()) {
			toast('Name the material', 'info');
			return;
		}
		add_busy = true;
		const r = await post(`/api/project/${id}/material`, { n: new_n.trim(), u: new_u, c: new_c.trim() || undefined }, 'Material added');
		add_busy = false;
		if (r) add_open = false;
	}

	// ---- benchmark ----
	let bench_open = $state(false);
	let bench_t = $state('');
	let bench_w = $state('');
	let bench_q = $state('');
	let bench_e = $state('10');
	let bench_busy = $state(false);

	function open_bench() {
		bench_t = sel ?? data.m[0]?.id ?? '';
		bench_w = '';
		bench_q = '';
		bench_e = '10';
		bench_open = true;
	}

	async function save_benchmark() {
		if (!bench_t || !bench_w.trim() || !bench_q) {
			toast('Fill in the benchmark', 'info');
			return;
		}
		bench_busy = true;
		const r = await post(
			`/api/project/${id}/benchmark`,
			{ t: bench_t, w: bench_w.trim(), q: Number(bench_q), e: Number(bench_e || 0) },
			'Benchmark saved'
		);
		bench_busy = false;
		if (r) bench_open = false;
	}
</script>

<svelte:head><title>Ledger · {data.project.n} · c6</title></svelte:head>

<header class="hd" use:reveal>
	<div>
		<span class="eyebrow eyebrow-amber">02 — Ledger</span>
		<h1 class="display h1">Materials</h1>
	</div>
	<div class="acts">
		{#if data.is_owner}
			<Btn variant="amber" onclick={open_add}><Icon name="plus" size={16} />Add material</Btn>
		{/if}
		{#if data.m.length}
			{#if data.is_owner}
				<Btn variant="ghost" onclick={open_bench}><Icon name="gear" size={16} />Set benchmark</Btn>
			{/if}
			<Btn onclick={start}><Icon name="truck" size={16} />Log entry</Btn>
		{/if}
	</div>
</header>

{#if !data.m.length}
	<Card class="mt" delay={100}>
		<Empty icon="layers" title="No materials yet" sub="Add the materials you track on this site — cement, blocks, rebar — then log orders, deliveries and usage against them.">
			{#if data.is_owner}
				<Btn variant="amber" onclick={open_add}><Icon name="plus" size={16} />Add material</Btn>
			{/if}
		</Empty>
	</Card>
{:else}
	<Card pad={false} class="mt" delay={100}>
		<div class="sec-head"><span class="eyebrow">Stock</span></div>
		<div class="tbl">
			<div class="tr th">
				<span>Material</span><span class="r">Ordered</span><span class="r">Recv</span>
				<span class="r">Used</span><span class="r">On hand</span><span></span>
			</div>
			{#each data.s as row (row.t)}
				{@const st = stock_state(row)}
				<button class="tr" class:on={sel === row.t} onclick={() => select(row.t)}>
					<span class="mname">{row.n}<em>{row.u}</em></span>
					<span class="r num">{fmt(row.o)}</span>
					<span class="r num">{fmt(row.r)}</span>
					<span class="r num">{fmt(row.g)}</span>
					<span class="r num strong" class:neg={on_hand(row) < 0}>{fmt(on_hand(row))}</span>
					<span class="r"><span class="badge {st.c}">{st.l}</span></span>
				</button>
			{/each}
		</div>
	</Card>

	{#if sel && sel_mat}
		{@const su = sel_mat}
		<Card pad={false} class="mt" delay={140}>
			<div class="sec-head">
				<span class="eyebrow">{su.n} · Detail</span>
				<button class="lk" onclick={() => (sel = null)}>Close</button>
			</div>
			{#if detail_busy}
				<div class="okbox"><p>Loading…</p></div>
			{:else if detail}
				<div class="dcols">
					{#each sections as [label, rows] (label)}
						<div class="dcol">
							<h4 class="dh">{label}</h4>
							{#if !rows.length}
								<p class="dempty">Nothing logged yet.</p>
							{:else}
								<ul class="dlist">
									{#each rows as row (row.id)}
										<li>
											<div class="drow">
												<b class="num">{fmt(row.q)} {su.u}</b>
												<p>{line(row)}</p>
											</div>
											<div class="dmeta">
												<span class="num">{ago(row.d)}</span>
												{#if data.is_owner}
													<button class="del" aria-label="Delete entry" onclick={() => remove(row.id)}>✕</button>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}
{/if}

<!-- log entry modal -->
<Modal bind:open title={`Log ${kind === 'o' ? 'order' : kind === 'r' ? 'delivery' : 'usage'}`}>
	<div class="seg">
		{#each [['r', 'Delivery'], ['g', 'Usage'], ['o', 'Order']] as [k, l] (k)}
			<button class="sg" class:on={kind === k} onclick={() => (kind = k as 'o' | 'r' | 'g')}>{l}</button>
		{/each}
	</div>
	<div class="form" use:ctrlEnter={submit}>
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

<!-- add material modal -->
<Modal bind:open={add_open} title="Add material">
	<div class="form" use:ctrlEnter={add_material_submit}>
		<Field label="Name" bind:value={new_n} placeholder="e.g. Cement (Dangote 3X)" required />
		<Field label="Unit" bind:value={new_u} options={UNIT_OPTIONS} />
		<Field label="Category (optional)" bind:value={new_c} placeholder="e.g. Structural" />
		<Btn variant="amber" onclick={add_material_submit} disabled={add_busy} class="w">
			<Icon name="check" size={16} />{add_busy ? 'Adding…' : 'Add material'}
		</Btn>
	</div>
</Modal>

<!-- benchmark modal -->
<Modal bind:open={bench_open} title="Set benchmark">
	<div class="form" use:ctrlEnter={save_benchmark}>
		<Field label="Material" bind:value={bench_t} options={data.m.map((m) => ({ v: m.id, l: m.n }))} />
		<Field label="Work unit (e.g. blocks laid)" bind:value={bench_w} placeholder="e.g. blocks laid" />
		<Field label="Material per 1 unit of work" type="number" bind:value={bench_q} placeholder="e.g. 0.5" />
		<Field label="Tolerance %" type="number" bind:value={bench_e} placeholder="e.g. 10" />
		<Btn variant="amber" onclick={save_benchmark} disabled={bench_busy} class="w">
			<Icon name="check" size={16} />{bench_busy ? 'Saving…' : 'Save benchmark'}
		</Btn>
	</div>
</Modal>

<style>
	.hd {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.6rem;
	}
	.h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		margin: 0.5rem 0 0;
	}
	.acts {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
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
		background: none;
		border: 0;
		font-family: var(--font-ui);
		font-size: 0.8rem;
		color: var(--color-mute);
		cursor: pointer;
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
		background: none;
		border-left: 0;
		border-right: 0;
		border-top: 0;
		width: 100%;
		text-align: left;
		font-family: var(--font-ui);
		color: var(--color-ink);
		cursor: pointer;
	}
	button.tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	button.tr.on {
		background: color-mix(in oklab, var(--color-amber) 8%, transparent);
	}
	.tr:last-child {
		border-bottom: 0;
	}
	.th {
		font-size: 0.64rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-faint);
		cursor: default;
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
		padding: 1.3rem;
		color: var(--color-mute);
		font-size: 0.86rem;
	}
	/* detail columns */
	.dcols {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}
	.dcol {
		padding: 1rem 1.3rem 1.3rem;
		border-right: 1px solid var(--color-line);
	}
	.dcol:last-child {
		border-right: 0;
	}
	.dh {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-mute);
		margin: 0 0 0.7rem;
	}
	.dempty {
		color: var(--color-faint);
		font-size: 0.82rem;
	}
	.dlist {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.dlist li {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid var(--color-line);
	}
	.dlist li:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}
	.drow b {
		font-size: 0.86rem;
		font-weight: 600;
	}
	.drow p {
		margin: 0.15rem 0 0;
		color: var(--color-mute);
		font-size: 0.78rem;
	}
	.dmeta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex: none;
	}
	.dmeta .num {
		color: var(--color-faint);
		font-size: 0.72rem;
		white-space: nowrap;
	}
	.del {
		background: none;
		border: 0;
		color: var(--color-faint);
		cursor: pointer;
		font-size: 0.78rem;
		line-height: 1;
		padding: 0.2rem;
	}
	.del:hover {
		color: var(--color-bad);
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
		.dcols {
			grid-template-columns: 1fr;
		}
		.dcol {
			border-right: 0;
			border-bottom: 1px solid var(--color-line);
		}
		.dcol:last-child {
			border-bottom: 0;
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
