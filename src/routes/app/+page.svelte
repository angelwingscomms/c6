<script lang="ts">
	import type { ProjectCard } from '$lib/types';
	import { post } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/actions';
	import Shell from '$lib/components/Shell.svelte';
	import Card from '$lib/components/Card.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Field from '$lib/components/Field.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: { user: { name: string; picture?: string }; p: ProjectCard[] } } = $props();

	let open = $state(false);
	let code = $state('');
	let busy = $state(false);

	async function join() {
		if (!code.trim()) {
			toast('Enter an invite code', 'info');
			return;
		}
		busy = true;
		const r = await post<{ id: string }>('/api/join', { c: code.trim() });
		busy = false;
		if (r) {
			open = false;
			goto('/app/' + r.id);
		}
	}
</script>

<svelte:head><title>Your sites · c6</title></svelte:head>

<Shell user={data.user}>
	<header class="hero" use:reveal>
		<div>
			<span class="eyebrow eyebrow-amber">Your sites</span>
			<h1 class="display h1">Sites</h1>
		</div>
		<div class="acts">
			<Btn variant="ghost" onclick={() => (open = true)}><Icon name="box" size={16} />Join a site</Btn>
			<Btn variant="amber" href="/app/new"><Icon name="plus" size={16} />New site</Btn>
		</div>
	</header>

	{#if !data.p.length}
		<Card class="mt" delay={100}>
			<Empty icon="layers" title="No sites yet" sub="Create your first site to start tracking materials, deliveries and usage — or join one with an invite code.">
				<Btn href="/app/new" variant="amber"><Icon name="plus" size={16} />New site</Btn>
			</Empty>
		</Card>
	{:else}
		<div class="grid">
			{#each data.p as pr, i (pr.id)}
				<Card hover href={`/app/${pr.id}`} delay={80 + i * 60}>
					<span class="eyebrow eyebrow-amber">Site</span>
					<h3 class="serif name">{pr.n}</h3>
					<div class="meta">
						{#if pr.l}<span><Icon name="flag" size={13} />{pr.l}</span>{/if}
						<span><Icon name="user" size={13} />{pr.c} on site</span>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</Shell>

<Modal bind:open title="Join a site">
	<div class="form">
		<Field label="Invite code" bind:value={code} placeholder="e.g. 7Q3K9M" />
		<Btn variant="amber" onclick={join} disabled={busy} class="w">
			<Icon name="check" size={16} />{busy ? 'Joining…' : 'Join site'}
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
		margin-bottom: 1.8rem;
	}
	.h1 {
		font-size: clamp(2.1rem, 5.5vw, 3.4rem);
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}
	.name {
		font-size: 1.4rem;
		margin: 0.55rem 0 0.7rem;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		color: var(--color-mute);
		font-size: 0.83rem;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
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
</style>
