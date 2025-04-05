<script lang="ts">
  import { onMount } from "svelte";
  import { loading, selectedRepo, userToken, rememberToken, filteredRepos, allRepos } from "$lib/stores";
  import { loadToken, saveToken, clearToken, fetchAuthenticatedUsername } from "$lib/utils";
  import { ConfigPanel, FilterPanel, RepoGrid, SingleRepo } from "$lib/components";

  // State variables
  let initialized = false;

  $: if (initialized && $userToken.trim().length > 0) {
    fetchAuthenticatedUsername($userToken.trim());
  }

  $: if (initialized) {
    if ($rememberToken && $userToken.trim().length > 0) {
      saveToken($userToken.trim());
    } else if (!$rememberToken) {
      clearToken();
    }
  }

  onMount(() => {
    const stored = loadToken();
    if (stored) {
      userToken.set(stored);
      rememberToken.set(true);
    }
    initialized = true;
  });
</script>

<div class="container bg-[#030418] flex flex-col min-h-screen">
  <div class="pt-8">
    <h1 class="text-center text-3xl font-bold mb-2">GitHub Repo Explorer</h1> 
    <p class="text-center text-gray-500 mb-8">
      Explore and filter your GitHub repositories with ease.
    </p>

    <ConfigPanel />

    {#if $allRepos.length > 0}
      <FilterPanel />
    {/if}
  </div>

  {#if $loading}
    <p class="p-4" style="text-align: center;">Loading repositories...</p>
  {:else if $filteredRepos.length > 0}
    <RepoGrid />
  {:else if $allRepos.length > 0 }
    <p style="text-align: center; margin-top: 2rem;">
      No repositories found. Please check your filters.
    </p>
  {/if}
</div>

{#if $selectedRepo}
  <SingleRepo />
{/if}

<style>
  .container {
    max-width: 1550px;
    margin: auto;
    padding: 1rem;
  }
</style>
