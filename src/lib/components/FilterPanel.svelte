<script lang="ts">
  import { onMount } from "svelte";
  import FilterSelect from "./FilterSelect.svelte";
  import {
    allRepos,
    archivedFilter,
    filteredRepos,
    hasActiveIssues,
    hasDescription,
    languageFilter,
    licenseFilter,
    maxStars,
    minForks,
    minStars,
    permissionFilters,
    repoTypeFilter,
    searchQuery,
    showForks,
    showOnlyForked,
    showOnlyLiveRepos,
    sizeFilter,
    sortDirection,
    sortKey,
    templateFilter,
    updatedWithinFilter,
  } from "$lib/stores";

  let uniqueLanguages: string[] = [];
  let uniqueLicenses: { key: string; name: string }[] = [];
  let permissionsOpen = false;
  let permissionSelectEl: HTMLDetailsElement;
  const PERMISSIONS = ["admin", "maintain", "push", "triage", "pull"];

  const VISIBILITY_OPTIONS = [
    { value: "all", label: "All visibility" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const STATUS_OPTIONS = [
    { value: "all", label: "Any status" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  const TEMPLATE_OPTIONS = [
    { value: "all", label: "Any template state" },
    { value: "template", label: "Templates only" },
    { value: "non-template", label: "Non-templates" },
  ];

  const UPDATED_OPTIONS = [
    { value: "all", label: "Any time" },
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
    { value: "365", label: "Last year" },
  ];

  const SIZE_OPTIONS = [
    { value: "all", label: "Any size" },
    { value: "small", label: "Small (< 1 MB)" },
    { value: "medium", label: "Medium (1-10 MB)" },
    { value: "large", label: "Large (> 10 MB)" },
  ];

  const SORT_OPTIONS = [
    { value: "", label: "Default" },
    { value: "updated", label: "Updated" },
    { value: "created", label: "Created" },
    { value: "name", label: "Name" },
    { value: "stars", label: "Stars" },
    { value: "forks", label: "Forks" },
    { value: "issues", label: "Issues" },
    { value: "size", label: "Size" },
    { value: "language", label: "Language" },
    { value: "visibility", label: "Visibility" },
  ];

  const DIRECTION_OPTIONS = [
    { value: "desc", label: "Desc" },
    { value: "asc", label: "Asc" },
  ];

  $: uniqueLanguages = Array.from(
    new Set($allRepos.map((repo) => repo.language).filter(Boolean))
  ).sort();

  $: uniqueLicenses = Array.from(
    new Map(
      $allRepos
        .filter((repo) => repo.license?.key)
        .map((repo) => [repo.license!.key, repo.license!.name])
    )
  )
    .map(([key, name]) => ({ key, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  $: languageOptions = [
    { value: "all", label: "All languages" },
    ...uniqueLanguages.map((language) => ({ value: language, label: language })),
  ];

  $: licenseOptions = [
    { value: "all", label: "Any license" },
    { value: "none", label: "No license" },
    ...uniqueLicenses.map((license) => ({ value: license.key, label: license.name })),
  ];

  $: sourceMode = $showOnlyForked ? "forks" : !$showForks ? "source" : "all";

  $: activeFilterCount = [
    $searchQuery.trim().length > 0,
    $languageFilter !== "all",
    $repoTypeFilter !== "all",
    $archivedFilter !== "all",
    $templateFilter !== "all",
    $licenseFilter !== "all",
    $updatedWithinFilter !== "all",
    $sizeFilter !== "all",
    $permissionFilters.length > 0,
    $showOnlyLiveRepos,
    $hasActiveIssues,
    $hasDescription,
    Number($minStars) > 0,
    Number($minForks) > 0,
    sourceMode !== "all",
    $sortKey !== "",
  ].filter(Boolean).length;

  $: totalStars = $allRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  $: publicCount = $allRepos.filter((repo) => !repo.private).length;

  function clearFilters() {
    searchQuery.set("");
    languageFilter.set("all");
    repoTypeFilter.set("all");
    archivedFilter.set("all");
    templateFilter.set("all");
    licenseFilter.set("all");
    updatedWithinFilter.set("all");
    sizeFilter.set("all");
    permissionFilters.set([]);
    minStars.set(0);
    minForks.set(0);
    showForks.set(true);
    showOnlyForked.set(false);
    showOnlyLiveRepos.set(false);
    hasActiveIssues.set(false);
    hasDescription.set(false);
    sortKey.set("");
    sortDirection.set("desc");
  }

  function setSourceMode(mode: "all" | "source" | "forks") {
    showOnlyForked.set(mode === "forks");
    showForks.set(mode !== "source");
  }

  function toggleStore(store: { set: (value: boolean) => void }, value: boolean) {
    store.set(!value);
  }

  function togglePermission(permission: string) {
    permissionFilters.update((selected) =>
      selected.includes(permission)
        ? selected.filter((item) => item !== permission)
        : [...selected, permission]
    );
  }

  onMount(() => {
    function closePermissionsOnOutsideClick(event: PointerEvent) {
      if (
        permissionsOpen &&
        permissionSelectEl &&
        !permissionSelectEl.contains(event.target as Node)
      ) {
        permissionsOpen = false;
      }
    }

    document.addEventListener("pointerdown", closePermissionsOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closePermissionsOnOutsideClick);
  });
</script>

<section class="filter-panel">
  <div class="filter-header">
    <div>
      <p class="eyebrow">Organize Repositories</p>
      <div class="result-line">
        <strong>{$filteredRepos.length}</strong>
        <span>of {$allRepos.length} repositories</span>
      </div>
    </div>

    <div class="repo-summary" aria-label="Repository summary">
      <span>{publicCount} public</span>
      <span>{$allRepos.length - publicCount} private</span>
      <span>{totalStars} stars</span>
    </div>
  </div>

  <div class="search-row">
    <label class="filter-field search-field">
      <span class="filter-label">Search</span>
      <input
        type="search"
        placeholder="Name, description, language, license, or topic..."
        bind:value={$searchQuery}
        class="filter-input"
      />
    </label>

    <label class="filter-field sort-field">
      <span class="filter-label">Sort</span>
      <div class="sort-controls">
        <FilterSelect bind:value={$sortKey} options={SORT_OPTIONS} label="Default" />
        <FilterSelect
          bind:value={$sortDirection}
          options={DIRECTION_OPTIONS}
          label="Desc"
          disabled={!$sortKey}
        />
      </div>
    </label>
  </div>

  <div class="quick-row">
    <div class="chip-group" aria-label="Repository kind">
      <button class="chip" class:active={sourceMode === "all"} on:click={() => setSourceMode("all")}>
        All repos
      </button>
      <button class="chip" class:active={sourceMode === "source"} on:click={() => setSourceMode("source")}>
        Source only
      </button>
      <button class="chip" class:active={sourceMode === "forks"} on:click={() => setSourceMode("forks")}>
        Forks only
      </button>
    </div>

    <div class="chip-group" aria-label="Repository features">
      <button class="chip" class:active={$showOnlyLiveRepos} on:click={() => toggleStore(showOnlyLiveRepos, $showOnlyLiveRepos)}>
        Live URL
      </button>
      <button class="chip" class:active={$hasActiveIssues} on:click={() => toggleStore(hasActiveIssues, $hasActiveIssues)}>
        Open issues
      </button>
      <button class="chip" class:active={$hasDescription} on:click={() => toggleStore(hasDescription, $hasDescription)}>
        Has description
      </button>
    </div>
  </div>

  <div class="advanced-grid">
    <label class="filter-field">
      <span class="filter-label">Language</span>
      <FilterSelect bind:value={$languageFilter} options={languageOptions} label="All languages" />
    </label>

    <label class="filter-field">
      <span class="filter-label">Visibility</span>
      <FilterSelect bind:value={$repoTypeFilter} options={VISIBILITY_OPTIONS} label="All visibility" />
    </label>

    <label class="filter-field">
      <span class="filter-label">Status</span>
      <FilterSelect bind:value={$archivedFilter} options={STATUS_OPTIONS} label="Any status" />
    </label>

    <label class="filter-field">
      <span class="filter-label">Template</span>
      <FilterSelect bind:value={$templateFilter} options={TEMPLATE_OPTIONS} label="Any template state" />
    </label>

    <label class="filter-field">
      <span class="filter-label">License</span>
      <FilterSelect bind:value={$licenseFilter} options={licenseOptions} label="Any license" />
    </label>

    <label class="filter-field">
      <span class="filter-label">Updated</span>
      <FilterSelect bind:value={$updatedWithinFilter} options={UPDATED_OPTIONS} label="Any time" />
    </label>

    <label class="filter-field">
      <span class="filter-label">Size</span>
      <FilterSelect bind:value={$sizeFilter} options={SIZE_OPTIONS} label="Any size" />
    </label>

    <label class="filter-field number-field">
      <span class="filter-label">Min Stars</span>
      <input
        type="number"
        min="0"
        max={$maxStars}
        bind:value={$minStars}
        class="filter-input"
      />
    </label>

    <label class="filter-field number-field">
      <span class="filter-label">Min Forks</span>
      <input type="number" min="0" bind:value={$minForks} class="filter-input" />
    </label>

    <fieldset class="filter-field permission-field">
      <legend class="filter-label">Permissions</legend>
      <details class="multi-select" bind:open={permissionsOpen} bind:this={permissionSelectEl}>
        <summary class:active={$permissionFilters.length > 0}>
          <span>
            {$permissionFilters.length === 0
              ? "Any permission"
              : `${$permissionFilters.length} selected: ${$permissionFilters.join(", ")}`}
          </span>
          <svg class="select-arrow" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M12.78 5.72a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.78a.75.75 0 0 1 1.06-1.06L8 9.44l3.72-3.72a.75.75 0 0 1 1.06 0Z"/>
          </svg>
        </summary>

        <div class="multi-menu">
          {#each PERMISSIONS as permission}
            <label class="multi-option">
              <input
                type="checkbox"
                checked={$permissionFilters.includes(permission)}
                on:change={() => togglePermission(permission)}
              />
              <span>{permission}</span>
            </label>
          {/each}
        </div>
      </details>
    </fieldset>
  </div>

  <div class="filter-footer">
    <span class="active-count">
      {activeFilterCount === 0 ? "No filters applied" : `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`}
    </span>

    <button on:click={clearFilters} class="clear-btn" disabled={activeFilterCount === 0}>
      <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M6.5 1.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V2h3.75a.75.75 0 0 1 0 1.5h-.653l-.7 9.096A2.25 2.25 0 0 1 9.653 14.5H6.347a2.25 2.25 0 0 1-2.244-1.904L3.403 3.5H2.75a.75.75 0 0 1 0-1.5H6.5v-.25Zm-1.593 1.75.692 8.981a.75.75 0 0 0 .748.519h3.306a.75.75 0 0 0 .748-.519l.692-8.981H4.907Z"/>
      </svg>
      Clear filters
    </button>
  </div>
</section>

<style>
  .filter-panel {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 0.75rem;
    margin: 0 1rem 0.75rem;
    overflow: visible;
  }

  .filter-header,
  .filter-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 1rem;
  }

  .filter-header {
    border-bottom: 1px solid #21262d;
  }

  .eyebrow,
  .filter-label {
    color: #8b949e;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .eyebrow {
    margin: 0 0 0.2rem;
  }

  .result-line {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    color: #8b949e;
    font-size: 0.875rem;
  }

  .result-line strong {
    color: #e6edf3;
    font-size: 1.25rem;
  }

  .repo-summary {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .repo-summary span,
  .active-count {
    color: #8b949e;
    font-size: 0.8rem;
  }

  .repo-summary span {
    border: 1px solid #30363d;
    border-radius: 9999px;
    padding: 0.25rem 0.625rem;
  }

  .search-row {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(280px, 0.65fr);
    gap: 0.875rem;
    padding: 1rem;
  }

  .sort-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 5.5rem;
    gap: 0.5rem;
  }

  .advanced-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(140px, 1fr));
    gap: 0.75rem;
    padding: 0 1rem 1rem;
  }

  .quick-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0 1rem 1rem;
  }

  .chip-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  fieldset.filter-field {
    border: 0;
    margin: 0;
    padding: 0;
  }

  fieldset.filter-field .filter-label {
    display: block;
    margin-bottom: 0.35rem;
  }

  .filter-input {
    width: 100%;
    height: 2.35rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #161b22;
    color: #e6edf3;
    font-size: 0.875rem;
    outline: none;
    padding: 0 0.75rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .filter-input:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .chip,
  .clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
    white-space: nowrap;
  }

  .chip {
    min-height: 2rem;
    border: 1px solid #30363d;
    background: transparent;
    color: #8b949e;
    padding: 0.35rem 0.75rem;
  }

  .chip:hover {
    border-color: #8b949e;
    color: #e6edf3;
  }

  .chip.active {
    background: rgba(56, 139, 253, 0.16);
    border-color: #388bfd;
    color: #79c0ff;
  }

  .permission-field {
    grid-column: auto;
    gap: 0.35rem;
  }

  .multi-select {
    position: relative;
  }

  .multi-select summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    height: 2.35rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #161b22;
    color: #e6edf3;
    cursor: pointer;
    font-size: 0.875rem;
    list-style: none;
    padding: 0 0.65rem 0 0.75rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .multi-select summary::-webkit-details-marker {
    display: none;
  }

  .multi-select summary span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .multi-select summary:hover,
  .multi-select[open] summary {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .multi-select summary.active {
    border-color: #2ea043;
  }

  .select-arrow {
    width: 1rem;
    height: 1rem;
    color: #8b949e;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .multi-select[open] .select-arrow {
    transform: rotate(180deg);
  }

  .multi-menu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 0.35rem);
    right: 0;
    left: 0;
    display: grid;
    gap: 0.25rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #0d1117;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    padding: 0.4rem;
  }

  .multi-option {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    border-radius: 0.375rem;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.45rem 0.5rem;
  }

  .multi-option:hover {
    background: #161b22;
    color: #e6edf3;
  }

  .multi-option input {
    width: 0.95rem;
    height: 0.95rem;
    accent-color: #2ea043;
  }

  .filter-footer {
    border-top: 1px solid #21262d;
    padding-block: 0.75rem;
  }

  .clear-btn {
    min-height: 2.15rem;
    border: 1px solid #f85149;
    background: transparent;
    color: #f85149;
    padding: 0 0.8rem;
  }

  .clear-btn:hover:not(:disabled) {
    background: rgba(248, 81, 73, 0.1);
  }

  .clear-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .btn-icon {
    width: 0.95rem;
    height: 0.95rem;
  }

  @media (max-width: 1120px) {
    .advanced-grid {
      grid-template-columns: repeat(3, minmax(150px, 1fr));
    }
  }

  @media (max-width: 780px) {
    .filter-panel {
      margin-inline: 0;
    }

    .filter-header,
    .filter-footer,
    .search-row {
      align-items: stretch;
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .advanced-grid {
      grid-template-columns: 1fr;
    }

    .repo-summary {
      justify-content: flex-start;
    }
  }
</style>
