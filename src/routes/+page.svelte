<script lang="ts">
  import { onMount } from "svelte";
  import {
    loading,
    selectedRepo,
    userToken,
    rememberToken,
    filteredRepos,
    allRepos,
  } from "$lib/stores";
  import {
    loadToken,
    saveToken,
    clearToken,
    fetchAuthenticatedUsername,
  } from "$lib/utils";
  import {
    ConfigPanel,
    FilterPanel,
    RepoGrid,
    SingleRepo,
  } from "$lib/components";

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
  <div class="page-header">
    <h1>GitHub Repo Explorer</h1>
    <p>
      Explore and filter your GitHub repositories with ease.
    </p>

    <ConfigPanel />

    {#if $allRepos.length > 0}
      <FilterPanel />
    {/if}
  </div>

  {#if $loading}
    <p class="p-4 text-center text-[#8b949e]">Loading repositories...</p>
  {:else if $filteredRepos.length > 0}
    <RepoGrid />
  {:else if $allRepos.length > 0}
    <p class="text-center mt-8 text-[#8b949e]">
      No repositories matched your filters.
    </p>
  {/if}
</div>

{#if $selectedRepo}
  <SingleRepo />
{/if}

<a
  href="https://github.com/Berkanktk/RepoExplorer"
  target="_blank"
  rel="noopener noreferrer"
  class="fixed bottom-4 right-4 z-50 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 hidden sm:block"
>
  <img
    src="/github-light.svg"
    alt="GitHub Logo"
    class="hidden dark:block hover:scale-110 transition-transform duration-200"
    style="width: 40px; height: 40px;"
  />
</a>

<style>
  .container {
    max-width: 1550px;
    margin: auto;
    padding: 1rem;
    width: 100%;
  }

  .page-header {
    padding-top: 2rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    text-align: center;
    font-size: 1.875rem;
    font-weight: 700;
    color: #e6edf3;
  }

  p {
    margin: 0 0 2rem;
    text-align: center;
    color: #8b949e;
  }
</style>
