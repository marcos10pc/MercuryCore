<script lang="ts">
	import Breadcrumbs from "$components/Breadcrumbs.svelte"
	import Head from "$components/Head.svelte"
	import { writable } from "svelte/store"
	import ForumPost from "./ForumPost.svelte"

	export let data

	let posts = writable(data.posts)
</script>

<Head name={data.siteName} title="{data.name} - Forum" />

<div class="ctnr max-w-200">
	<Breadcrumbs
		path={[
			["Forum", "/forum"],
			[data.name, ""]
		]} />

	<h1 class="pb-8">
		{data.name} &ndash; Forum
		<span class="pl-6">
			<a
				href="/forum/create?category={data.name}"
				class="btn btn-primary">
				<fa fa-file class="pr-2" />
				Create post
			</a>
		</span>
	</h1>
	{#if $posts.length > 0}
		{#each $posts as post, num}
			<ForumPost
				{post}
				{num}
				total={$posts.length}
				categoryName={data.name} />
		{/each}
	{:else}
		<h2 class="text-center">
			No posts in this category yet. Be the first to create one!
		</h2>
	{/if}
</div>
