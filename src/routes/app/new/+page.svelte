<script lang="ts">
	import { post } from '$lib/api';
	import { toast } from '$lib/toast.svelte';
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/actions';
	import Shell from '$lib/components/Shell.svelte';
	import Card from '$lib/components/Card.svelte';
	import Btn from '$lib/components/Btn.svelte';
	import Field from '$lib/components/Field.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: { user: { name: string; picture?: string } } } = $props();

	let n = $state('');
	let l = $state('');
	let busy = $state(false);

	async function create() {
		if (!n.trim()) {
			toast('Name the site', 'info');
			return;
		}
		busy = true;
		const r = await post<{ id: string }>('/api/project', { n: n.trim(), l: l.trim() || undefined });
		busy = false;
		if (r) goto('/app/' + r.id);
	}
</script>

<svelte:head><title>New site · c6</title></svelte:head>

<Shell user={data.user}>
	<a href="/app" class="back" use:reveal><Icon name="back" size={15} />Sites</a>

	<div class="center">
		<Card class="panel" delay={80}>
			<span class="eyebrow eyebrow-amber">New site</span>
			<h1 class="serif h1">Start a site ledger</h1>
			<div class="form">
				<Field label="Site name" bind:value={n} placeholder="e.g. Lekki Phase 2 Duplex" required />
				<Field label="Location (optional)" bind:value={l} placeholder="e.g. Lekki, Lagos" />
				<Btn variant="amber" onclick={create} disabled={busy} class="w">
					<Icon name="check" size={16} />{busy ? 'Creating…' : 'Create site'}
				</Btn>
			</div>
		</Card>
	</div>
</Shell>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--color-mute);
		font-size: 0.85rem;
		margin-bottom: 1.6rem;
	}
	.back:hover {
		color: var(--color-ink);
	}
	.center {
		display: flex;
		justify-content: center;
	}
	.center :global(.panel) {
		width: 100%;
		max-width: 460px;
	}
	.h1 {
		font-size: clamp(1.7rem, 4vw, 2.2rem);
		margin: 0.5rem 0 1.4rem;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.form :global(.w) {
		width: 100%;
		margin-top: 0.3rem;
	}
</style>
