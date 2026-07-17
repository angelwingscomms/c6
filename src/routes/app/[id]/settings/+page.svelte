<script lang="ts">
	import { post } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { reveal } from '$lib/actions';
	import Card from '$lib/components/Card.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let {
		data
	}: {
		data: {
			project: { id: string; n: string; l?: string; o: string; i: string; a: string[] };
			is_owner: boolean;
			user: { id: string; name: string; picture?: string; email?: string };
		};
	} = $props();

	const id = $derived(data.project.id);

	function copy_code() {
		navigator.clipboard.writeText(data.project.i);
		toast('Copied', 'ok');
	}

	let regen_busy = $state(false);
	async function regen() {
		regen_busy = true;
		await post(`/api/project/${id}/invite`, undefined, 'New code generated');
		regen_busy = false;
	}
</script>

<svelte:head><title>Settings · {data.project.n} · c6</title></svelte:head>

<header class="hero" use:reveal>
	<span class="eyebrow eyebrow-amber">Settings</span>
	<h1 class="display h1">Site settings</h1>
</header>

<div class="stack">
	<Card delay={100}>
		<span class="card-label eyebrow eyebrow-amber">Details</span>
		<div class="row">
			<span class="eyebrow">Name</span>
			<span class="val serif">{data.project.n}</span>
		</div>
		<hr class="hair" />
		<div class="row">
			<span class="eyebrow">Location</span>
			<span class="val">{data.project.l || '—'}</span>
		</div>
	</Card>

	<Card delay={160}>
		<span class="card-label eyebrow eyebrow-amber">Invite</span>
		<div class="invite-row">
			<span class="code num">{data.project.i}</span>
			<div class="invite-acts">
				<Btn variant="ghost" sm onclick={copy_code}><Icon name="copy" size={14} />Copy</Btn>
				{#if data.is_owner}
					<Btn variant="ghost" sm onclick={regen} disabled={regen_busy}>
						<Icon name="spark" size={14} />{regen_busy ? 'Regenerating…' : 'Regenerate code'}
					</Btn>
				{/if}
			</div>
		</div>
		<p class="hint">Share this code so crew can join the site.</p>
	</Card>

	<Card delay={220}>
		<span class="card-label eyebrow eyebrow-amber">Team</span>
		<p class="teamline"><Icon name="user" size={15} />{data.project.a.length} people on site</p>
		{#if data.is_owner}<p class="teamsub">You are the owner of this site.</p>{/if}
	</Card>
</div>

<style>
	.hero {
		margin-bottom: 1.6rem;
	}
	.h1 {
		font-size: clamp(2.1rem, 5.5vw, 3.4rem);
		margin: 0.5rem 0 0;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.card-label {
		display: block;
		margin-bottom: 1.1rem;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.9rem 0;
	}
	.row:first-of-type {
		padding-top: 0;
	}
	.val {
		font-size: 1rem;
	}
	.hair {
		margin: 0;
	}
	.invite-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2rem;
		flex-wrap: wrap;
	}
	.code {
		font-size: clamp(1.6rem, 4vw, 2.3rem);
		font-weight: 600;
		color: var(--color-amber);
		letter-spacing: 0.06em;
	}
	.invite-acts {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.hint {
		margin: 1rem 0 0;
		color: var(--color-faint);
		font-size: 0.8rem;
	}
	.teamline {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin: 0;
		font-size: 1rem;
	}
	.teamsub {
		margin: 0.6rem 0 0;
		color: var(--color-mute);
		font-size: 0.85rem;
	}
</style>
