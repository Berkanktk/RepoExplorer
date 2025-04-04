<script lang="ts">
    import { onMount } from "svelte";
    import { writable, derived } from "svelte/store";
    import { token } from "$lib";
  
    // Updated Repo interface with owner field
    interface Repo {
      name: string;
      private: boolean;
      description: string;
      stargazers_count: number;
      forks_count: number;
      language: string;
      updated_at: string;
      html_url: string;
      fork: boolean;
      archived: boolean;
      is_template: boolean;
      owner: {
        login: string;
      };
    }
  
    // Stores for fetched repositories and filter values
    const allRepos = writable<Repo[]>([]);
    const searchQuery = writable<string>("");
    const languageFilter = writable<string>("all");
    const repoTypeFilter = writable<string>("all"); // "all", "public", "private"
    const archivedFilter = writable<string>("all"); // "all", "archived", "active"
    const templateFilter = writable<string>("all"); // "all", "template", "non-template"
    const minStars = writable<number>(0);
    const minForks = writable<number>(0);
    const showForks = writable<boolean>(true);
    const sortKey = writable<string>(""); // Options: "name", "stars", "forks", "updated", "language"
    const sortDirection = writable<string>("desc"); // "asc" or "desc"
    const loading = writable<boolean>(true);
  
    // Store for selected repository (for modal) and its README content
    const selectedRepo = writable<Repo | null>(null);
    const readme = writable<string>("");
  
    // Derived store that applies filtering and sorting
    const filteredRepos = derived(
      [
        allRepos,
        searchQuery,
        languageFilter,
        repoTypeFilter,
        archivedFilter,
        templateFilter,
        minStars,
        minForks,
        showForks,
        sortKey,
        sortDirection
      ],
      ([
        $allRepos,
        $searchQuery,
        $languageFilter,
        $repoTypeFilter,
        $archivedFilter,
        $templateFilter,
        $minStars,
        $minForks,
        $showForks,
        $sortKey,
        $sortDirection
      ]) => {
        let repos = $allRepos.filter(repo => {
          // Search by name or description
          const query = $searchQuery.toLowerCase();
          const matchesSearch =
            repo.name.toLowerCase().includes(query) ||
            (repo.description && repo.description.toLowerCase().includes(query));
          if (!matchesSearch) return false;
  
          // Filter by language if not "all"
          if ($languageFilter !== "all" && repo.language !== $languageFilter)
            return false;
  
          // Filter by repository type (public/private)
          if ($repoTypeFilter !== "all") {
            if ($repoTypeFilter === "public" && repo.private) return false;
            if ($repoTypeFilter === "private" && !repo.private) return false;
          }
  
          // Filter by archived status
          if ($archivedFilter !== "all") {
            if ($archivedFilter === "archived" && !repo.archived) return false;
            if ($archivedFilter === "active" && repo.archived) return false;
          }
  
          // Filter by template status
          if ($templateFilter !== "all") {
            if ($templateFilter === "template" && !repo.is_template) return false;
            if ($templateFilter === "non-template" && repo.is_template) return false;
          }
  
          // Filter by minimum stars and forks
          if (repo.stargazers_count < $minStars) return false;
          if (repo.forks_count < $minForks) return false;
  
          // Optionally filter out forked repositories
          if (!$showForks && repo.fork) return false;
  
          return true;
        });
  
        // Sorting the filtered repositories based on selected key and direction
        if ($sortKey) {
          repos.sort((a, b) => {
            let comp = 0;
            if ($sortKey === "name") {
              comp = a.name.localeCompare(b.name);
            } else if ($sortKey === "stars") {
              comp = a.stargazers_count - b.stargazers_count;
            } else if ($sortKey === "forks") {
              comp = a.forks_count - b.forks_count;
            } else if ($sortKey === "updated") {
              comp =
                new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            } else if ($sortKey === "language") {
              comp = (a.language || "").localeCompare(b.language || "");
            }
            return $sortDirection === "asc" ? comp : -comp;
          });
        }
        return repos;
      }
    );
  
    // Caching functions using localStorage
    function loadFromCache(): Repo[] | null {
      try {
        const cached = localStorage.getItem("github_repos_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cache:", e);
      }
      return null;
    }
  
    function saveToCache(repos: Repo[]): void {
      try {
        localStorage.setItem("github_repos_cache", JSON.stringify(repos));
      } catch (e) {
        console.error("Failed to save cache:", e);
      }
    }
  
    // Keep track of unique languages for the language filter dropdown.
    let uniqueLanguages: string[] = [];
    allRepos.subscribe(repos => {
      const langs = repos
        .map(repo => repo.language)
        .filter(lang => lang != null);
      uniqueLanguages = Array.from(new Set(langs));
    });
  
    // Clear all filter values
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
  
    // When a repo card is clicked, open the modal and fetch its README.
    async function selectRepo(repo: Repo) {
      selectedRepo.set(repo);
      readme.set("Loading README...");
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json"
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          // GitHub returns the README content in base64
          const decoded = atob(data.content);
          readme.set(decoded);
        } else {
          readme.set("No README available.");
        }
      } catch (error) {
        console.error("Error fetching README", error);
        readme.set("Error fetching README.");
      }
    }
  
    // Close the modal
    function closeModal() {
      selectedRepo.set(null);
      readme.set("");
    }
  
    // Fetch GitHub repositories on mount, with pagination and caching
    onMount(async () => {
      const cached = loadFromCache();
      if (cached) {
        allRepos.set(cached);
      }
  
      let page = 1;
      let all: Repo[] = [];
      try {
        while (true) {
          const res = await fetch(
            `https://api.github.com/user/repos?visibility=all&per_page=100&page=${page}`,
            {
              headers: {
                Authorization: `token ${token}`
              }
            }
          );
          const data: Repo[] = await res.json();
          if (!data.length) break;
          all = all.concat(data);
          page++;
        }
        allRepos.set(all);
        saveToCache(all);
      } catch (e) {
        console.error("Failed to fetch repositories:", e);
      } finally {
        loading.set(false);
      }
    });
  </script>
  
  <style>
    .container {
      max-width: 1200px;
      margin: auto;
      padding: 1rem;
    }
    .filter-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .filter-panel label {
      display: flex;
      flex-direction: column;
      font-size: 0.9rem;
    }
    .filter-panel input,
    .filter-panel select {
      padding: 0.5rem;
      font-size: 1rem;
    }
    .repo-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .repo-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      transition: box-shadow 0.2s ease-in-out;
      color: #2d3748;
      cursor: pointer;
    }
    .repo-card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .repo-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2d3748;
    }
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }
    .tag.public {
      background: #c6f6d5;
      color: #276749;
    }
    .tag.private {
      background: #fed7d7;
      color: #c53030;
    }
    .tag.archived {
      background: #e2e8f0;
      color: #2d3748;
    }
    .tag.template {
      background: #faf089;
      color: #975a16;
    }
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      max-width: 600px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      color: #2d3748;
    }
    .modal-content h2 {
      margin-top: 0;
    }
    .modal-content pre {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      max-height: 400px;
      overflow: auto;
    }
    .modal-content button {
      margin-top: 1rem;
    }
  </style>
  
  <div class="container">
    <h1 style="text-align: center; margin-bottom: 2rem;">GitHub Repo Explorer</h1>
  
    <div class="filter-panel">
      <label>
        Search
        <input
          type="text"
          placeholder="Search by name or description..."
          bind:value={$searchQuery}
        />
      </label>
  
      <label>
        Language
        <select bind:value={$languageFilter}>
          <option value="all">All Languages</option>
          {#each uniqueLanguages as lang}
            <option value={lang}>{lang}</option>
          {/each}
        </select>
      </label>
  
      <label>
        Repo Type
        <select bind:value={$repoTypeFilter}>
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </label>
  
      <label>
        Archived Status
        <select bind:value={$archivedFilter}>
          <option value="all">All</option>
          <option value="archived">Archived</option>
          <option value="active">Active</option>
        </select>
      </label>
  
      <label>
        Template Status
        <select bind:value={$templateFilter}>
          <option value="all">All</option>
          <option value="template">Template</option>
          <option value="non-template">Non-Template</option>
        </select>
      </label>
  
      <label>
        Minimum Stars
        <input
          type="number"
          min="0"
          placeholder="Minimum Stars"
          bind:value={$minStars}
        />
      </label>
  
      <label>
        Minimum Forks
        <input
          type="number"
          min="0"
          placeholder="Minimum Forks"
          bind:value={$minForks}
        />
      </label>
  
      <label>
        Show Forked Repos
        <input type="checkbox" bind:checked={$showForks} />
      </label>
  
      <label>
        Sort By
        <select bind:value={$sortKey}>
          <option value="">None</option>
          <option value="name">Name</option>
          <option value="stars">Stars</option>
          <option value="forks">Forks</option>
          <option value="updated">Recently Updated</option>
          <option value="language">Language</option>
        </select>
      </label>
  
      {#if $sortKey}
        <label>
          Direction
          <select bind:value={$sortDirection}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      {/if}
  
      <button on:click={clearFilters}>Clear Filters</button>
    </div>
  
    {#if $loading}
      <p style="text-align: center;">Loading repositories...</p>
    {:else}
      <p>
        <strong>Total Repositories:</strong> {$filteredRepos.length}
      </p>
      {#if $filteredRepos.length > 0}
        <div class="repo-grid">
          {#each $filteredRepos as repo (repo.html_url)}
            <!-- Clicking on the card opens the modal -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="repo-card" on:click={() => selectRepo(repo)}>
              <h2 class="repo-title">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  on:click|stopPropagation
                >{repo.name}</a>
                {#if repo.private}
                  <span class="tag private">Private</span>
                {:else}
                  <span class="tag public">Public</span>
                {/if}
                {#if repo.archived}
                  <span class="tag archived">Archived</span>
                {/if}
                {#if repo.is_template}
                  <span class="tag template">Template</span>
                {/if}
              </h2>
              {#if repo.description}
                <p>{repo.description}</p>
              {/if}
              <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
                <li>⭐ Stars: {repo.stargazers_count}</li>
                <li>🍴 Forks: {repo.forks_count}</li>
                <li>🛠 Language: {repo.language || "N/A"}</li>
                <li>🕒 Updated: {new Date(repo.updated_at).toLocaleDateString()}</li>
              </ul>
            </div>
          {/each}
        </div>
      {:else}
        <p style="text-align: center; margin-top: 2rem;">
          No repositories match your filters.
        </p>
      {/if}
    {/if}
  </div>
  
  <!-- Modal for displaying the repository README -->
  {#if $selectedRepo}
    <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Enter' && closeModal()} role="button" tabindex="0" aria-label="Close modal">
      <div class="modal-content" on:click|stopPropagation on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="dialog" tabindex="0" aria-labelledby="modal-title">
        <h2 id="modal-title">README for {$selectedRepo.name}</h2>
        <pre>{$readme}</pre>
        <button on:click={closeModal} type="button">Close</button>
      </div>
    </div>
  {/if}
  