<script lang="ts">
	import type { Snippet } from 'svelte';
	import Shell from '$lib/components/Shell.svelte';
	let { data, children }: { data: { user: { name: string; picture?: string }; project: { id: string; n: string } }; children: Snippet } = $props();
</script>

<Shell user={data.user} project={{ id: data.project.id, n: data.project.n }}>
	{@render children()}
</Shell>
