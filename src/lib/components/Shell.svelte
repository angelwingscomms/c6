<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';
	import Icon from './Icon.svelte';
	let {
		user,
		project = null,
		children
	}: {
		user: { name: string; picture?: string; email?: string };
		project?: { id: string; n: string } | null;
		children: Snippet;
	} = $props();

	const tabs = $derived(
		project
			? [
					{ h: `/app/${project.id}`, l: 'Overview', i: 'box', exact: true },
					{ h: `/app/${project.id}/ledger`, l: 'Ledger', i: 'layers', exact: false },
					{ h: `/app/${project.id}/drawings`, l: 'Drawings', i: 'file', exact: false },
					{ h: `/app/${project.id}/progress`, l: 'Progress', i: 'flag', exact: false },
					{ h: `/app/${project.id}/settings`, l: 'Settings', i: 'gear', exact: false }
				]
			: []
	);
	const path = $derived(page.url.pathname);
	const active = (t: { h: string; exact: boolean }) => (t.exact ? path === t.h : path.startsWith(t.h));
	const initial = $derived((user.email && user.email.trim().charAt(0).toLowerCase()) || '?');
</script>

<header class="top">
	<div class="wrap bar">
		<div class="left">
			<Logo label={false} size={30} />
			{#if project}
				<span class="sep">/</span>
				<a href="/app" class="crumb">Sites</a>
				<span class="sep">/</span>
				<span class="pname serif">{project.n}</span>
			{:else}
				<a href="/app" class="pname serif">Your sites</a>
			{/if}
		</div>
		<details class="menu">
			<summary aria-label="Account">
				{#if user.picture}
					<img src={user.picture} alt="" referrerpolicy="no-referrer" />
				{:else}
					<span class="av">{initial}</span>
				{/if}
			</summary>
			<div class="pop card">
				<p class="who">{user.name}</p>
				<hr class="hair" />
				<a href="/app" class="mi"><Icon name="box" size={15} />Sites</a>
				<form method="POST" action="/logout">
					<button class="mi out" type="submit"><Icon name="logout" size={15} />Sign out</button>
				</form>
			</div>
		</details>
	</div>
	{#if project}
		<div class="wrap">
			<nav class="tabs">
				{#each tabs as t (t.h)}
					<a href={t.h} class="tab" class:on={active(t)}>
						<Icon name={t.i} size={15} />{t.l}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</header>

<main class="wrap page">{@render children()}</main>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in oklab, var(--color-base) 78%, transparent);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--color-line);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 62px;
	}
	.left {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		min-width: 0;
	}
	.sep {
		color: var(--color-faint);
	}
	.crumb {
		font-size: 0.85rem;
		color: var(--color-mute);
	}
	.crumb:hover {
		color: var(--color-ink);
	}
	.pname {
		font-size: 1.02rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.menu {
		position: relative;
	}
	.menu summary {
		list-style: none;
		cursor: pointer;
	}
	.menu summary::-webkit-details-marker {
		display: none;
	}
	.av,
	.menu img {
		width: 34px;
		height: 34px;
		border-radius: 99px;
		display: grid;
		place-items: center;
		border: 1px solid var(--color-line2);
		object-fit: cover;
	}
	.av {
		background: var(--color-panel2);
		color: var(--color-amber);
		font-weight: 600;
		font-size: 0.9rem;
	}
	.pop {
		position: absolute;
		right: 0;
		top: 44px;
		width: 190px;
		padding: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		z-index: 50;
	}
	.who {
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
		color: var(--color-mute);
	}
	.pop .hair {
		margin: 0.3rem 0;
	}
	.mi {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		text-align: left;
		background: none;
		border: 0;
		color: var(--color-ink);
		font-family: var(--font-ui);
		font-size: 0.85rem;
		padding: 0.5rem 0.5rem;
		border-radius: 8px;
		cursor: pointer;
	}
	.mi:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.out {
		color: var(--color-bad);
	}
	.tabs {
		display: flex;
		gap: 0.3rem;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs::-webkit-scrollbar {
		display: none;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.7rem 0.85rem;
		font-size: 0.82rem;
		color: var(--color-mute);
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		transition: color 0.2s;
	}
	.tab:hover {
		color: var(--color-ink);
	}
	.tab.on {
		color: var(--color-ink);
		border-bottom-color: var(--color-amber);
	}
	.page {
		padding-top: clamp(1.4rem, 4vw, 2.6rem);
		padding-bottom: 5rem;
	}
</style>
