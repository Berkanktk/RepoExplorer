<script lang="ts">
  import {
    searchQuery,
    languageFilter,
    repoTypeFilter,
    archivedFilter,
    templateFilter,
    minStars,
    minForks,
    maxStars,
    sortKey,
    sortDirection,
    showForks,
    allRepos,
    filteredRepos,
  } from "$lib/stores";

  let uniqueLanguages: string[] = [];

  $: {
    const langs = $allRepos.map((repo) => repo.language).filter(Boolean);
    uniqueLanguages = Array.from(new Set(langs));
  }

  function clearFilters() {
    searchQuery.set("");
    languageFilter.set("all");
    repoTypeFilter.set("all");
    archivedFilter.set("all");
    templateFilter.set("all");
    minStars.set(0);
    minForks.set(0);
    showForks.set(true);
    sortKey.set("");
    sortDirection.set("desc");
  }
</script>

<div class="display flex flex-wrap gap-2 bg-[#030418] p-4 pb-4 justify-between">
  <label class="space-y-1">
    <span class="label-textflex mb-1">Search</span>
    <input
      type="text"
      placeholder="Search by name or description..."
      bind:value={$searchQuery}
      class="input input-bordered w-full"
    />
  </label>

  <label class="!w-[200px] space-y-1">
    <span class="label-text mb-1">Language</span>
    <select bind:value={$languageFilter} class="select select-bordered">
      <option value="all">All Languages</option>
      {#each uniqueLanguages as lang}
        <option value={lang}>{lang}</option>
      {/each}
    </select>
  </label>

  <label class="!w-[100px] space-y-1">
    <span class="label-text">Repo Type</span>
    <select bind:value={$repoTypeFilter} class="select select-bordered">
      <option value="all">All</option>
      <option value="public">Public</option>
      <option value="private">Private</option>
    </select>
  </label>

  <label class="!w-[120px] space-y-1">
    <span class="label-text">Archived Status</span>
    <select bind:value={$archivedFilter} class="select select-bordered">
      <option value="all">All</option>
      <option value="archived">Archived</option>
      <option value="active">Active</option>
    </select>
  </label>

  <label class="!w-[150px] space-y-1">
    <span class="label-text">Template Status</span>
    <select bind:value={$templateFilter} class="select select-bordered">
      <option value="all">All</option>
      <option value="template">Template</option>
      <option value="non-template">Non-Template</option>
    </select>
  </label>

  <label class="!w-[125px] space-y-1">
    <span class="label-text">Minimum Stars</span>
    <input
      type="number"
      min="0"
      max={$maxStars}
      placeholder="Minimum Stars"
      bind:value={$minStars}
      class="input input-bordered"
    />
  </label>

  <label class="!w-[125px] space-y-1">
    <span class="label-text">Minimum Forks</span>
    <input
      type="number"
      min="0"
      placeholder="Minimum Forks"
      bind:value={$minForks}
      class="input input-bordered"
    />
  </label>

  <label class="!w-[175px] space-y-1">
    <span class="label-text">Sort By</span>
    <select bind:value={$sortKey} class="select select-bordered">
      <option value="">None</option>
      <option value="name">Name</option>
      <option value="stars">Stars</option>
      <option value="forks">Forks</option>
      <option value="updated">Recently Updated</option>
      <option value="language">Language</option>
    </select>
  </label>

  {#if $sortKey}
    <label class="!w-[150px] space-y-1">
      <span class="label-text">Direction</span>
      <select bind:value={$sortDirection} class="select select-bordered">
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </label>
  {/if}

  <div class="mt-[26px] flex justify-end items-center">
    <button on:click={clearFilters} class="btn btn-error">
      <img src="delete_2_line.svg" alt="delete" />
      Clear
    </button>
  </div>
</div>

<div class="flex flex-row items-center justify-between px-4 py-2">
  <div>
    <span class="ml-1 mb-2">
      <strong>Total Repositories:</strong>
      {$filteredRepos.length}
    </span>
  </div>

  <div>
    <label class="flex flex-row items-center gap-2">
      <span class="label-text">Show Forked Repos</span>
      <input type="checkbox" bind:checked={$showForks} class="checkbox" />
    </label>
  </div>
</div>
