<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/stores"
	import Head from "$components/Head.svelte"
	import Pagination from "$components/Pagination.svelte"
	import PlaceCard from "./PlaceCard.svelte"

	export let data

	let query = ""
	let searchedData: typeof data.places = []

	// Run function whenever query changes
	async function search() {
		const response = await fetch(`/games/search?q=${query}`)
		searchedData = (await response.json()) as typeof data.places
	}
	$: query && search()

	$: places = query ? searchedData : data.places || []

	export const snapshot = {
		capture: () => query,
		restore: v => {
			query = v
		}
	}
</script>

<Head name={data.siteName} title="Discover" />

<div class="ctnr">
	<div class="flex pb-12 gap-4 <sm:flex-wrap">
		<div class="flex w-full sm:w-1/2">
			<h1 class="pr-6">Games</h1>
			<a href="/games/create" class="btn btn-primary">
				<fa fa-plus class="pr-2" />
				Create
			</a>
		</div>
		<form
			use:enhance
			method="POST"
			action="/search?c=places"
			class="input-group w-full sm:w-1/2">
			<input
				bind:value={query}
				type="text"
				name="query"
				placeholder="Search for a game"
				aria-label="Search for a game"
				aria-describedby="button-addon2" />
			<button
				class="btn btn-secondary"
				aria-label="Search"
				id="button-addon2">
				<fa fa-search />
			</button>
		</form>
	</div>
	{#if places.length > 0}
		<div class="flex flex-wrap gap-4 justify-center">
			{#each places as place, num (place.id)}
				<PlaceCard {place} {num} total={data.places.length} />
			{/each}
			{#if query && searchedData.length === 0}
				<h2 class="text-lg pt-12">
					No games found with search term {query}
				</h2>
			{/if}
		</div>
		{#key $page.url}
			<Pagination totalPages={data.pages} />
		{/key}
	{:else}
		<h2 class="text-center">No games yet. Be the first to create one!</h2>
	{/if}
</div>

<style>
	input {
		background-color: var(--accent);
		border-color: var(--accent2);
	}
</style>
