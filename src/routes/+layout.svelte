<script lang="ts">
	import '@fontsource-variable/fraunces/index.css';
	import '@fontsource-variable/space-grotesk/index.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0c0c0b" />
</svelte:head>

{@render children()}
<Toast />
