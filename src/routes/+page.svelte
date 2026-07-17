<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Card from '$lib/components/Card.svelte';
	import { reveal, parallax, float } from '$lib/actions';

	let { data }: { data: { user: { name: string } | null } } = $props();

	let progress = $state(0);
	function on_scroll() {
		const h = document.documentElement;
		const max = h.scrollHeight - h.clientHeight;
		progress = max > 0 ? h.scrollTop / max : 0;
	}

	const steps = [
		{ n: '01', i: 'box', t: 'Log the order', d: 'Record what you ordered from each supplier — quantities, cost notes, the lot.' },
		{ n: '02', i: 'truck', t: 'Confirm delivery', d: 'Mark what actually arrived on site, with a photo of the waybill if you like.' },
		{ n: '03', i: 'hammer', t: 'Record usage', d: 'Note what got used and the work it went into — 200 blocks, ground floor.' },
		{ n: '04', i: 'flag', t: 'Auto-reconcile', d: 'c6 compares it all to your benchmarks and flags anything that does not add up.' }
	];
	const features = [
		{ i: 'layers', t: 'Material ledger', d: 'One clean running record per material — ordered, received, used, on hand.' },
		{ i: 'flag', t: 'Discrepancy flags', d: 'Negative stock, over-delivery and waste surfaced the moment they happen.' },
		{ i: 'chart', t: 'Engineer benchmarks', d: 'Set expected rates — bags of cement per 100 blocks — and hold the site to them.' },
		{ i: 'file', t: 'Drawings & photos', d: 'Keep working drawings and site photos beside the numbers they belong to.' },
		{ i: 'check', t: 'Progress milestones', d: 'Track the build stage by stage with percentage complete and dated photos.' },
		{ i: 'spark', t: 'AI site assistant', d: 'Ask plain questions — “are we short on rebar?” — grounded in your own records.' }
	];
</script>

<svelte:head>
	<title>c6 · Site Ledger — material & progress control for builders</title>
	<meta name="description" content="Track construction materials from order to delivery to usage. Automatic discrepancy flags, engineer benchmarks, drawings and milestones — built for small residential developers." />
</svelte:head>

<Nav user={data.user} />

<div class="progress" style="transform: scaleX({progress})"></div>
<div class="aura" aria-hidden="true"></div>

<svelte:window on:scroll={on_scroll} />

<section class="hero wrap">
	<div class="hcopy" use:reveal>
		<span class="eyebrow eyebrow-amber">Material & progress control · for site builders</span>
		<h1 class="display h1">Know exactly<br />what's on your site.<br /><span class="amber">And what's missing.</span></h1>
		<p class="lead">
			c6 is the ledger for your building site — every bag of cement and length of rebar tracked
			from order to the wall, with the shortfalls flagged before they cost you a pour.
		</p>
		<div class="cta">
			<Btn href={data.user ? '/app' : '/login'} variant="amber">
				{data.user ? 'Open your sites' : 'Start your ledger'}<Icon name="arrow" size={16} />
			</Btn>
			<Btn href="#how" variant="ghost">See how it works</Btn>
		</div>
	</div>

	<div class="hviz" use:reveal={140} use:parallax={0.05}>
		<div class="mock card" use:float={{ amp: 9, dur: 8 }}>
			<div class="mhead">
				<span class="eyebrow">Marigold Terraces · Block B</span>
				<span class="badge badge-bad">1 flag</span>
			</div>
			<div class="mrow mth"><span>Material</span><span>Ordered</span><span>Used</span><span>Left</span></div>
			{#each [['Cement', '480', '452', '28', 'ok'], ['9" Blocks', '6,000', '6,180', '-180', 'bad'], ['Rebar 12mm', '3.2t', '2.1t', '1.1t', 'ok'], ['Sharp sand', '32', '27', '5', 'ok']] as row (row[0])}
				<div class="mrow">
					<span class="mm">{row[0]}</span>
					<span class="num">{row[1]}</span>
					<span class="num">{row[2]}</span>
					<span class="num {row[4]}">{row[3]}</span>
				</div>
			{/each}
			<div class="mflag">
				<span class="dot" style="color:var(--color-bad)"></span>
				<span>Blocks used exceed delivered — check for breakage or an unlogged order.</span>
			</div>
		</div>
		<div class="corner tl"></div>
		<div class="corner br"></div>
	</div>
</section>

<section id="how" class="band wrap">
	<div class="bhead" use:reveal>
		<span class="eyebrow">How it works</span>
		<h2 class="display h2">Four moves. Nothing slips through.</h2>
	</div>
	<div class="steps">
		{#each steps as s, i (s.n)}
			<div class="step" use:reveal={i * 70}>
				<span class="snum num">{s.n}</span>
				<span class="sic"><Icon name={s.i} size={18} /></span>
				<h3>{s.t}</h3>
				<p>{s.d}</p>
			</div>
		{/each}
	</div>
</section>

<section id="features" class="band wrap">
	<div class="bhead" use:reveal>
		<span class="eyebrow">Everything on site</span>
		<h2 class="display h2">A studio-grade record<br />of a working build.</h2>
	</div>
	<div class="fgrid">
		{#each features as f, i (f.t)}
			<Card hover delay={(i % 3) * 80}>
				<span class="fic"><Icon name={f.i} size={20} /></span>
				<h3 class="ft">{f.t}</h3>
				<p class="fd">{f.d}</p>
			</Card>
		{/each}
	</div>
</section>

<section class="wrap">
	<div class="final card card-pad" use:reveal>
		<span class="eyebrow eyebrow-amber">Bring order to the site</span>
		<h2 class="display h2">Start tracking in minutes.</h2>
		<p>Sign in with Google, spin up your first site, and log today's delivery before it walks off.</p>
		<Btn href={data.user ? '/app' : '/login'} variant="amber">
			{data.user ? 'Open your sites' : 'Continue with Google'}<Icon name="arrow" size={16} />
		</Btn>
	</div>
</section>

<footer class="foot wrap">
	<span class="eyebrow">c6 — Site Ledger</span>
	<span class="fmute">Materials & progress, reconciled. · {new Date().getFullYear()}</span>
</footer>

<style>
	.progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		transform-origin: 0 50%;
		background: linear-gradient(90deg, var(--color-amber), color-mix(in oklab, var(--color-amber) 40%, #fff));
		box-shadow: 0 0 12px color-mix(in oklab, var(--color-amber) 60%, transparent);
		z-index: 60;
		pointer-events: none;
	}
	.aura {
		position: fixed;
		inset: -20% -10% auto -10%;
		height: 70vh;
		background: radial-gradient(40% 60% at 70% 0%, rgba(245, 166, 35, 0.1), transparent 70%);
		filter: blur(20px);
		z-index: -1;
		pointer-events: none;
	}
	.hero {
		display: grid;
		grid-template-columns: 1.05fr 0.95fr;
		gap: clamp(1.5rem, 5vw, 4rem);
		align-items: center;
		padding-top: clamp(3rem, 8vw, 6rem);
		padding-bottom: clamp(3rem, 7vw, 5rem);
	}
	.h1 {
		font-size: clamp(2.6rem, 6.6vw, 4.7rem);
		margin: 1rem 0 1.3rem;
	}
	.amber {
		color: var(--color-amber);
	}
	.lead {
		color: var(--color-mute);
		font-size: clamp(1rem, 1.6vw, 1.15rem);
		line-height: 1.65;
		max-width: 33rem;
	}
	.cta {
		display: flex;
		gap: 0.7rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}
	.hviz {
		position: relative;
		transform: translateY(var(--py, 0));
		transition: transform 0.1s linear;
	}
	.mock {
		padding: 1.3rem;
		background: var(--color-panel);
		box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.7);
		transform: rotate(0.4deg);
	}
	.mhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.mrow {
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr 1fr;
		gap: 0.5rem;
		padding: 0.6rem 0.2rem;
		border-top: 1px solid var(--color-line);
		font-size: 0.85rem;
	}
	.mrow span:not(.mm) {
		text-align: right;
		color: var(--color-ink);
	}
	.mth {
		border-top: 0;
		font-size: 0.62rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.mth span {
		color: var(--color-faint) !important;
	}
	.mm {
		font-weight: 500;
	}
	.mrow .bad {
		color: var(--color-bad) !important;
		font-weight: 600;
	}
	.mrow .ok {
		color: var(--color-ok) !important;
	}
	.mflag {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		margin-top: 1rem;
		padding: 0.8rem;
		border-radius: 9px;
		background: color-mix(in oklab, var(--color-bad) 8%, transparent);
		border: 1px solid color-mix(in oklab, var(--color-bad) 22%, transparent);
		font-size: 0.78rem;
		color: var(--color-mute);
	}
	.mflag .dot {
		margin-top: 5px;
		flex: none;
	}
	.corner {
		position: absolute;
		width: 22px;
		height: 22px;
		pointer-events: none;
	}
	.corner.tl {
		top: -10px;
		left: -10px;
		border-top: 1px solid var(--color-amber);
		border-left: 1px solid var(--color-amber);
		opacity: 0.6;
	}
	.corner.br {
		bottom: -10px;
		right: -10px;
		border-bottom: 1px solid var(--color-amber);
		border-right: 1px solid var(--color-amber);
		opacity: 0.6;
	}
	.band {
		padding-block: clamp(3rem, 7vw, 5.5rem);
		border-top: 1px solid var(--color-line);
	}
	.bhead {
		margin-bottom: 2.5rem;
	}
	.h2 {
		font-size: clamp(1.9rem, 4.4vw, 3rem);
		margin-top: 0.7rem;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		background: var(--color-line);
		border: 1px solid var(--color-line);
		border-radius: 14px;
		overflow: hidden;
	}
	.step {
		background: var(--color-base);
		padding: 1.6rem 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: transform 0.5s var(--ease-out), background 0.5s var(--ease-out);
	}
	.step:hover {
		transform: translateY(-4px);
		background: color-mix(in oklab, var(--color-panel) 60%, var(--color-base));
	}
	.snum {
		color: var(--color-amber);
		font-size: 0.8rem;
		letter-spacing: 0.1em;
	}
	.sic {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border: 1px solid var(--color-line2);
		border-radius: 10px;
		color: var(--color-ink);
		margin: 0.3rem 0 0.4rem;
	}
	.step h3 {
		font-size: 1.05rem;
		font-weight: 500;
	}
	.step p {
		color: var(--color-mute);
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.fgrid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.fic {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: 11px;
		border: 1px solid var(--color-line);
		color: var(--color-amber);
		margin-bottom: 1rem;
	}
	.ft {
		font-size: 1.15rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}
	.fd {
		color: var(--color-mute);
		font-size: 0.9rem;
		line-height: 1.6;
	}
	.final {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding-block: clamp(2.5rem, 6vw, 4rem);
		margin-block: clamp(2rem, 5vw, 3rem);
		background:
			radial-gradient(70% 120% at 50% 0%, rgba(245, 166, 35, 0.08), transparent 60%),
			var(--color-panel);
	}
	.final p {
		color: var(--color-mute);
		max-width: 34rem;
		margin-bottom: 1rem;
	}
	.foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block: 2.5rem;
		border-top: 1px solid var(--color-line);
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.fmute {
		color: var(--color-faint);
		font-size: 0.8rem;
	}
	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.steps {
			grid-template-columns: repeat(2, 1fr);
		}
		.fgrid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 520px) {
		.steps {
			grid-template-columns: 1fr;
		}
	}
</style>
