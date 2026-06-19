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
    showOnlyForked,
    allRepos,
    filteredRepos,
    showOnlyLiveRepos,
    hasActiveIssues,
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
    showOnlyForked.set(false);
    sortKey.set("");
    sortDirection.set("desc");
    showOnlyLiveRepos.set(false);
    hasActiveIssues.set(false);
  }
</script>

<div class="filter-panel">
  <!-- Row 1: search + dropdowns + sort + clear -->
  <div class="filter-row">
    <label class="filter-field grow">
      <span class="filter-label">Search</span>
      <input
        type="text"
        placeholder="Search by name or description..."
        bind:value={$searchQuery}
        class="filter-input"
      />
    </label>

    <label class="filter-field w-44">
      <span class="filter-label">Language</span>
      <select bind:value={$languageFilter} class="filter-select">
        <option value="all">All Languages</option>
        {#each uniqueLanguages as lang}
          <option value={lang}>{lang}</option>
        {/each}
      </select>
    </label>

    <label class="filter-field w-32">
      <span class="filter-label">Visibility</span>
      <select bind:value={$repoTypeFilter} class="filter-select">
        <option value="all">All</option>
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    </label>

    <label class="filter-field w-36">
      <span class="filter-label">Archive</span>
      <select bind:value={$archivedFilter} class="filter-select">
        <option value="all">All</option>
        <option value="archived">Archived</option>
        <option value="active">Active</option>
      </select>
    </label>

    <label class="filter-field w-36">
      <span class="filter-label">Template</span>
      <select bind:value={$templateFilter} class="filter-select">
        <option value="all">All</option>
        <option value="template">Template</option>
        <option value="non-template">Non-Template</option>
      </select>
    </label>

    <label class="filter-field w-28">
      <span class="filter-label">Min Stars</span>
      <input
        type="number"
        min="0"
        max={$maxStars}
        placeholder="0"
        bind:value={$minStars}
        class="filter-input"
      />
    </label>

    <label class="filter-field w-28">
      <span class="filter-label">Min Forks</span>
      <input
        type="number"
        min="0"
        placeholder="0"
        bind:value={$minForks}
        class="filter-input"
      />
    </label>

    <label class="filter-field w-44">
      <span class="filter-label">Sort By</span>
      <select bind:value={$sortKey} class="filter-select">
        <option value="">None</option>
        <option value="name">Name</option>
        <option value="stars">Stars</option>
        <option value="forks">Forks</option>
        <option value="updated">Recently Updated</option>
        <option value="language">Language</option>
        <option value="visibility">Visibility</option>
      </select>
    </label>

    <label class="filter-field w-36">
      <span class="filter-label">Direction</span>
      <select bind:value={$sortDirection} class="filter-select" disabled={!$sortKey}>
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </label>

    <div class="filter-field justify-end pt-[22px]">
      <button on:click={clearFilters} class="clear-btn" title="Clear all filters">
        <img src="delete_2_line.svg" alt="clear" class="w-4 h-4 clear-icon" />
        Clear
      </button>
    </div>
  </div>

  <!-- Row 2: toggle pills + result count -->
  <div class="toggle-row">
    <div class="toggle-group">
      <button
        class="toggle-pill"
        class:active={$showOnlyForked}
        on:click={() => showOnlyForked.set(!$showOnlyForked)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
        </svg>
        Only Forked
      </button>

      <button
        class="toggle-pill"
        class:active={!$showForks}
        on:click={() => showForks.set(!$showForks)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
        </svg>
        Hide Forks
      </button>

      <button
        class="toggle-pill"
        class:active={$showOnlyLiveRepos}
        on:click={() => showOnlyLiveRepos.set(!$showOnlyLiveRepos)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"/>
        </svg>
        Has Live URL
      </button>

      <button
        class="toggle-pill"
        class:active={$hasActiveIssues}
        on:click={() => hasActiveIssues.set(!$hasActiveIssues)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
        </svg>
        Active Issues
      </button>
    </div>

    <span class="result-count">
      <strong>{$filteredRepos.length}</strong>
      {$filteredRepos.length === 1 ? "repository" : "repositories"}
    </span>
  </div>
</div>

<style>
  .filter-panel {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 0.75rem;
    margin: 0 1rem 0.75rem;
    overflow: hidden;
  }

  :global(.clear-icon) {
    filter: brightness(0) invert(1);
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    align-items: flex-end;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
  }

  .filter-input,
  .filter-select {
    height: 2.25rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    color: #e6edf3;
    font-size: 0.875rem;
    padding: 0 0.75rem;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }

  .filter-input:focus,
  .filter-select:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .filter-select:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    height: 2.25rem;
    padding: 0 0.875rem;
    background: transparent;
    border: 1px solid #f85149;
    border-radius: 0.5rem;
    color: #f85149;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .clear-btn:hover {
    background: rgba(248, 81, 73, 0.1);
  }

  /* Toggle row */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 1rem 0.75rem;
    border-top: 1px solid #21262d;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .toggle-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid #30363d;
    background: transparent;
    color: #8b949e;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }

  .toggle-pill:hover {
    border-color: #8b949e;
    color: #e6edf3;
  }

  .toggle-pill.active {
    background: #1f6feb22;
    border-color: #388bfd;
    color: #58a6ff;
  }

  .result-count {
    font-size: 0.8rem;
    color: #8b949e;
    white-space: nowrap;
  }

  .result-count strong {
    color: #e6edf3;
  }
</style>
