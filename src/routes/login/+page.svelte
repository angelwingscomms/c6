<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { reveal } from '$lib/actions';
</script>

<svelte:head><title>Sign in · c6</title></svelte:head>

<main class="screen">
	<div class="col info">
		<Logo />
		<div class="mid" use:reveal>
			<span class="eyebrow eyebrow-amber">Site Ledger</span>
			<h1 class="display h1">Every bag, block<br />and beam — accounted for.</h1>
			<p class="lead">
				Track materials from order to delivery to the wall. Catch shortfalls before they cost
				you. Built for small residential developers who live on the site.
			</p>
			<ul class="pts">
				<li><span class="dot"></span>Order → received → used, per material</li>
				<li><span class="dot"></span>Engineer benchmarks & automatic discrepancy flags</li>
				<li><span class="dot"></span>Drawings, milestones and site photos in one place</li>
			</ul>
		</div>
		<p class="fine">One tap with Google. No passwords to lose on site.</p>
	</div>

	<div class="col panel">
		<div class="box card card-pad" use:reveal={120}>
			<span class="eyebrow">Welcome</span>
			<h2 class="display h2">Sign in to c6</h2>
			<p class="sub">Continue with your Google account to open your sites.</p>
			<a class="btn g" href="/login/google" data-sveltekit-reload>
				<Icon name="google" size={18} />Continue with Google
			</a>
			<p class="terms">By continuing you agree to keep your crew's site data tidy.</p>
		</div>
		<div class="ticks" aria-hidden="true">
			<span></span><span></span><span></span>
		</div>
	</div>
</main>

<style>
	.screen {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
	}
	.col {
		padding: clamp(1.6rem, 4vw, 3rem);
		display: flex;
		flex-direction: column;
	}
	.info {
		justify-content: space-between;
		gap: 2rem;
		border-right: 1px solid var(--color-line);
	}
	.mid {
		max-width: 30rem;
	}
	.h1 {
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		margin: 0.8rem 0 1.1rem;
	}
	.lead {
		color: var(--color-mute);
		font-size: 1.02rem;
		line-height: 1.6;
		max-width: 34rem;
	}
	.pts {
		list-style: none;
		margin: 1.8rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.pts li {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		color: var(--color-ink);
		font-size: 0.92rem;
	}
	.pts .dot {
		color: var(--color-amber);
		flex: none;
	}
	.fine {
		color: var(--color-faint);
		font-size: 0.8rem;
	}
	.panel {
		justify-content: center;
		align-items: center;
		position: relative;
		background:
			radial-gradient(80% 60% at 70% 20%, rgba(245, 166, 35, 0.06), transparent 60%);
	}
	.box {
		width: 100%;
		max-width: 25rem;
		background: var(--color-panel);
	}
	.h2 {
		font-size: 1.8rem;
		margin: 0.5rem 0 0.4rem;
	}
	.sub {
		color: var(--color-mute);
		font-size: 0.9rem;
		margin-bottom: 1.6rem;
	}
	.g {
		width: 100%;
		background: var(--color-ink);
		color: #14110b;
		border-color: transparent;
		font-weight: 600;
	}
	.g:hover {
		background: #fff;
		border-color: transparent;
	}
	.terms {
		color: var(--color-faint);
		font-size: 0.74rem;
		text-align: center;
		margin-top: 1rem;
	}
	.ticks {
		position: absolute;
		bottom: 2rem;
		display: flex;
		gap: 0.5rem;
	}
	.ticks span {
		width: 28px;
		height: 1px;
		background: var(--color-line2);
	}
	@media (max-width: 820px) {
		.screen {
			grid-template-columns: 1fr;
		}
		.info {
			border-right: 0;
			border-bottom: 1px solid var(--color-line);
		}
	}
</style>
