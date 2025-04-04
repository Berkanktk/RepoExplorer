<script lang="ts">
    import { onMount } from "svelte";
    import { writable, derived } from "svelte/store";
    import { token } from "$lib";
    import MarkdownIt from 'markdown-it';

    // Create a markdown-it instance with any custom options you like
    const md = new MarkdownIt({
    html: true,        // Enable HTML tags in source
    breaks: true,      // Convert '\n' in paragraphs into <br>
    linkify: true      // Autoconvert URL-like text to links
    });
    
    // Updated Repo interface with extra property for GitHub Pages
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
      owner: { login: string };
      has_pages?: boolean;
    }
  
    // Stores for fetched repositories and filter values
    const allRepos = writable<Repo[]>([]);
    const searchQuery = writable<string>("");
    const languageFilter = writable<string>("all");
    const repoTypeFilter = writable<string>("all");
    const archivedFilter = writable<string>("all");
    const templateFilter = writable<string>("all");
    const minStars = writable<number>(0);
    const minForks = writable<number>(0);
    const showForks = writable<boolean>(true);
    const sortKey = writable<string>("");
    const sortDirection = writable<string>("desc");
    const loading = writable<boolean>(true);
  
    // Stores for the selected repository details (for modal)
    const selectedRepo = writable<Repo | null>(null);
    const readme = writable<string>("");
  
    // New stores for additional details
    const commits = writable<any[]>([]);
    const issues = writable<any[]>([]);
    const metadata = writable<any>(null);
    const contributors = writable<any[]>([]);
    const fileStructure = writable<any[]>([]);
    const livePreviewUrl = writable<string>("");
    const pullRequests = writable<any[]>([]);
    const releases = writable<any[]>([]);
  
    // Active tab for modal (default "readme")
    type Tab =
      | "readme"
      | "commits"
      | "issues"
      | "pulls"
      | "releases"
      | "metadata"
      | "contributors"
      | "files"
      | "live";
    let activeTab: Tab = "readme";
  
    // Derived store for filtering and sorting repos
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
          const query = $searchQuery.toLowerCase();
          const matchesSearch =
            repo.name.toLowerCase().includes(query) ||
            (repo.description && repo.description.toLowerCase().includes(query));
          if (!matchesSearch) return false;
          if ($languageFilter !== "all" && repo.language !== $languageFilter) return false;
          if ($repoTypeFilter !== "all") {
            if ($repoTypeFilter === "public" && repo.private) return false;
            if ($repoTypeFilter === "private" && !repo.private) return false;
          }
          if ($archivedFilter !== "all") {
            if ($archivedFilter === "archived" && !repo.archived) return false;
            if ($archivedFilter === "active" && repo.archived) return false;
          }
          if ($templateFilter !== "all") {
            if ($templateFilter === "template" && !repo.is_template) return false;
            if ($templateFilter === "non-template" && repo.is_template) return false;
          }
          if (repo.stargazers_count < $minStars) return false;
          if (repo.forks_count < $minForks) return false;
          if (!$showForks && repo.fork) return false;
          return true;
        });
  
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
              comp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
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
  
    let uniqueLanguages: string[] = [];
    allRepos.subscribe(repos => {
      const langs = repos.map(repo => repo.language).filter(lang => lang != null);
      uniqueLanguages = Array.from(new Set(langs));
    });
  
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
  
    async function selectRepo(repo: Repo) {
      selectedRepo.set(repo);
      activeTab = "readme";
      // Reset all detail stores
      readme.set("Loading README...");
      commits.set([]);
      issues.set([]);
      metadata.set(null);
      contributors.set([]);
      fileStructure.set([]);
      livePreviewUrl.set("");
      pullRequests.set([]);
      releases.set([]);
  
      // Fetch README
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
          const decoded = atob(data.content);
          const repoBaseUrl = `https://github.com/${repo.owner.login}/${repo.name}/blob/master`;

          // Replace markdown image paths
          let updatedMarkdown = decoded.replace(
            /!\[([^\]]*)\]\(((?!https?:\/\/)([^)]+))\)/g,
            (match, alt, path) => `![${alt}](${repoBaseUrl}/${path}?raw=true)`
          );

          // Also replace <img src="..."> with relative paths
          updatedMarkdown = updatedMarkdown.replace(
            /<img\s+[^>]*src=["'](?!https?:\/\/)([^"']+)["']/g,
            (match, path) => match.replace(path, `${repoBaseUrl}/${path}?raw=true`)
          );

          // Render with markdown-it
          readme.set(md.render(updatedMarkdown));

        } else {
          readme.set("<p>No README available.</p>");
        }
      } catch (error) {
        console.error("Error fetching README", error);
        readme.set("<p>Error fetching README.</p>");
      }
  
      // Fetch recent commits (limit 5)
      try {
        const resCommits = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?per_page=5`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resCommits.ok) {
          const data = await resCommits.json();
          commits.set(data);
        } else {
          commits.set([]);
        }
      } catch (error) {
        console.error("Error fetching commits", error);
        commits.set([]);
      }
  
      // Fetch open issues (includes pull requests)
      try {
        const resIssues = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/issues?state=open`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resIssues.ok) {
          const data = await resIssues.json();
          issues.set(data);
        } else {
          issues.set([]);
        }
      } catch (error) {
        console.error("Error fetching issues", error);
        issues.set([]);
      }
  
      // Fetch repository metadata
      try {
        const resMetadata = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resMetadata.ok) {
          const data = await resMetadata.json();
          metadata.set(data);
          // Set live preview URL if GitHub Pages is enabled
          if (data.has_pages) {
            livePreviewUrl.set(`https://${repo.owner.login}.github.io/${repo.name}/`);
          }
        } else {
          metadata.set(null);
        }
      } catch (error) {
        console.error("Error fetching metadata", error);
        metadata.set(null);
      }
  
      // Fetch top contributors (limit 5)
      try {
        const resContributors = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contributors?per_page=5`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resContributors.ok) {
          const data = await resContributors.json();
          contributors.set(data);
        } else {
          contributors.set([]);
        }
      } catch (error) {
        console.error("Error fetching contributors", error);
        contributors.set([]);
      }
  
      // Fetch file structure (contents at root)
      try {
        const resFiles = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resFiles.ok) {
          const data = await resFiles.json();
          console.log("File structure data:", data);
          fileStructure.set(data);
        } else {
          fileStructure.set([]);
        }
      } catch (error) {
        console.error("Error fetching file structure", error);
        fileStructure.set([]);
      }
  
      // Fetch open pull requests (limit 5)
      try {
        const resPR = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls?state=open&per_page=5`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resPR.ok) {
          const data = await resPR.json();
          pullRequests.set(data);
        } else {
          pullRequests.set([]);
        }
      } catch (error) {
        console.error("Error fetching pull requests", error);
        pullRequests.set([]);
      }
  
      // Fetch latest releases (limit 5)
      try {
        const resRel = await fetch(
          `https://api.github.com/repos/${repo.owner.login}/${repo.name}/releases?per_page=5`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (resRel.ok) {
          const data = await resRel.json();
          releases.set(data);
        } else {
          releases.set([]);
        }
      } catch (error) {
        console.error("Error fetching releases", error);
        releases.set([]);
      }
    }
  
    function closeModal() {
      selectedRepo.set(null);
      readme.set("");
      commits.set([]);
      issues.set([]);
      metadata.set(null);
      contributors.set([]);
      fileStructure.set([]);
      livePreviewUrl.set("");
      pullRequests.set([]);
      releases.set([]);
    }
  
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
            { headers: { Authorization: `token ${token}` } }
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

    // Max starts
    const maxStars = derived(allRepos, $allRepos => {
      return Math.max(...$allRepos.map(repo => repo.stargazers_count));
    });
  </script>
  
  <style>
    .container {
      max-width: 1500px;
      margin: auto;
      padding: 1rem;
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
      margin-left: 0.25rem;
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
      padding: 1.5rem;
      border-radius: 0.75rem;
      max-width: 800px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      color: #2d3748;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-content h2 {
      margin-top: 0;
    }
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .tabs button {
      padding: 0.5rem 1rem;
      border: none;
      background: #e2e8f0;
      cursor: pointer;
      border-radius: 0.375rem;
    }
    .tabs button.active {
      background: #c6f6d5;
      font-weight: bold;
    }
    .modal-content button {
      margin-top: 1rem;
    }
  </style>
  
  <div class="container">
    <div class="bg-base-100">
        <h1 class="text-center text-2xl font-bold mb-8">GitHub Repo Explorer</h1>

        <div class="display flex flex-wrap gap-4 bg-base-100 pb-4">
          <label class="">
            <span class="label-text">Search</span>
            <input type="text" placeholder="Search by name or description..." bind:value={$searchQuery} class="input input-bordered w-full" />
          </label>
      
          <label class="!w-[200px]">
            <span class="label-text">Language</span>
            <select bind:value={$languageFilter} class="select select-bordered">
              <option value="all">All Languages</option>
              {#each uniqueLanguages as lang}
                <option value={lang}>{lang}</option>
              {/each}
            </select>
          </label>
      
          <label class="!w-[100px]">
            <span class="label-text">Repo Type</span>
            <select bind:value={$repoTypeFilter} class="select select-bordered">
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
      
          <label class="!w-[120px]">
            <span class="label-text">Archived Status</span>
            <select bind:value={$archivedFilter} class="select select-bordered">
              <option value="all">All</option>
              <option value="archived">Archived</option>
              <option value="active">Active</option>
            </select>
        </label>
      
          <label class="!w-[150px]">
            <span class="label-text">Template Status</span>
            <select bind:value={$templateFilter} class="select select-bordered">
              <option value="all">All</option>
              <option value="template">Template</option>
              <option value="non-template">Non-Template</option>
            </select>
          </label>
      
          <label class="!w-[125px]">
            <span class="label-text">Minimum Stars</span>
            <input type="number" min="0" max={$maxStars} placeholder="Minimum Stars" bind:value={$minStars} class="input input-bordered" />
          </label>
      
          <label class="!w-[125px]">
            <span class="label-text">Minimum Forks</span>
            <input type="number" min="0" placeholder="Minimum Forks" bind:value={$minForks} class="input input-bordered" />
          </label>
      
          <label class="flex flex-row items-center gap-2">
              <span class="label-text">Show Forked Repos</span>
            <input type="checkbox" bind:checked={$showForks} class="checkbox" />
          </label>
      
          <label class="!w-[175px]">
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
            <label class="!w-[150px]">
              <span class="label-text">Direction</span>
              <select bind:value={$sortDirection} class="select select-bordered">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
          {/if}
       
          <div class="mt-6 flex justify-end items-center">
            <button on:click={clearFilters} class="btn btn-error">Reset</button>
          </div>
        </div>      
      </div>
      
  
    {#if $loading}
      <p style="text-align: center;">Loading repositories...</p>
    {:else}
      <p class="ml-1 mb-2"><strong>Total Repositories:</strong> {$filteredRepos.length}</p>
      {#if $filteredRepos.length > 0}
        <div class="repo-grid">
          {#each $filteredRepos as repo (repo.html_url)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="repo-card" on:click={() => selectRepo(repo)}>
              <h2 class="repo-title">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" on:click|stopPropagation>
                  {repo.name}
                </a>
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
              {:else}
                <p>No description available.</p>
              {/if}
              <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
                <li><img src="/bling_fill.svg" alt="star" class="inline"> <strong>Stars:</strong> {repo.stargazers_count}</li>
                <li><img src="/fork_line.svg" alt="fork" class="inline"> <strong>Forks:</strong> {repo.forks_count}</li>
                <li><img src="/code_line.svg" alt="language" class="inline"> <strong>Language:</strong> {repo.language || "N/A"}</li>
                <ul>
                  <img src="/time_line.svg" alt="time" class="inline"> 
                  <strong> Last update:</strong>
                  {#if (new Date().getTime() - new Date(repo.updated_at).getTime()) > 1000 * 3600 * 24 * 365}
                    {Math.floor((new Date().getTime() - new Date(repo.updated_at).getTime()) / (1000 * 3600 * 24 * 365))} 
                    {Math.floor((new Date().getTime() - new Date(repo.updated_at).getTime()) / (1000 * 3600 * 24 * 365)) === 1 ? 'year' : 'years'} ago
                  {:else}
                    {Math.floor((new Date().getTime() - new Date(repo.updated_at).getTime()) / (1000 * 3600 * 24))} days ago
                  {/if}
                  ({new Date(repo.updated_at).toLocaleDateString()})
                </ul>
              </ul>
            </div>
          {/each}
        </div>
      {:else}
        <p style="text-align: center; margin-top: 2rem;">No repositories match your filters.</p>
      {/if}
    {/if}
  </div>
  
  {#if $selectedRepo}
    <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Enter' && closeModal()} role="button" tabindex="0" aria-label="Close modal">
      <div class="modal-content bg-white" on:click|stopPropagation on:keydown|stopPropagation={(e) => e.key === 'Enter' && e.stopPropagation()} role="dialog" tabindex="0" aria-labelledby="modal-title">
        <h2 id="modal-title" class="text-2xl">{$selectedRepo.name}</h2>
        <!-- Tabs UI -->
        <div class="tabs">
          <button class:active={activeTab === "readme"} on:click={() => activeTab = "readme"}>README</button>
          <button class:active={activeTab === "commits"} on:click={() => activeTab = "commits"}>Commits</button>
          <button class:active={activeTab === "issues"} on:click={() => activeTab = "issues"}>Issues</button>
          <button class:active={activeTab === "metadata"} on:click={() => activeTab = "metadata"}>Metadata</button>
          <button class:active={activeTab === "contributors"} on:click={() => activeTab = "contributors"}>Contributors</button>
          <button class:active={activeTab === "files"} on:click={() => activeTab = "files"}>Files</button>
          <button class:active={activeTab === "live"} on:click={() => activeTab = "live"}>Live Preview</button>
        </div>
        <!-- Tab Content -->
            {#if activeTab === "readme"}
              {#if $readme && $readme !== "Loading README..."}
                <!-- Render the README as HTML -->
                <div class="bg-gray-100 dark:bg-gray-900 p-4 rounded">
                  <div class="prose dark:prose-invert max-w-none">
                   {@html $readme}
                  </div>
                </div>
                
              {:else}
                <p>Loading README...</p>
              {/if}
            {:else if activeTab === "commits"}
              {#if $commits.length > 0}
                <ul>
                  {#each $commits as commit}
                    <li>
                      <a class="text-blue-500 hover:underline" href={commit.html_url} target="_blank" rel="noopener noreferrer">{commit.sha.substring(0, 7)}</a> - 
                      {#if commit.commit.message.length > 50}
                        {commit.commit.message.substring(0, 50)}...
                      {:else}
                        <strong>{commit.commit.message}</strong> by {commit.commit.author.name} on {new Date(commit.commit.author.date).toLocaleDateString()}
                      {/if}
                    </li>
                  {/each}
                </ul>
              {:else}
                <p>No recent commits found.</p>
              {/if}
            {:else if activeTab === "issues"}
              {#if $issues.length > 0}
                <ul>
                  {#each $issues as issue}
                    <li>
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer">{issue.title}</a> by {issue.user.login} on {new Date(issue.created_at).toLocaleDateString()}
                    </li>
                  {/each}
                </ul>
              {:else}
                <p>No open issues found.</p>
              {/if}
            {:else if activeTab === "metadata"}
              {#if $metadata}
                <ul>
                  <li><strong>License: </strong> {$metadata.license ? $metadata.license.name : 'N/A'}</li>
                  <li><strong>Default Branch: </strong> {$metadata.default_branch}</li>
                  <li><strong>Created At: </strong> {new Date($metadata.created_at).toLocaleDateString()}</li>
                  <li><strong>Last Updated: </strong> {new Date($metadata.updated_at).toLocaleDateString()}</li>
                  <li><strong>Topics: </strong> 
                    {#if $metadata.topics.length > 0}
                        {#each $metadata.topics as topic}
                          <span class="p-1 bg-orange-200 rounded mr-1">{topic}</span>
                        {/each}
                    {:else}
                      None
                    {/if}
                </ul>
              {:else}
                <p>No metadata available.</p>
              {/if}
            {:else if activeTab === "contributors"}
              {#if $contributors.length > 0}
                <ul>
                  {#each $contributors as contributor}
                  <li class="flex items-center mb-1">
                    <img src={contributor.avatar_url} alt={contributor.login} width="30" height="30" style="border-radius:50%" class="mr-2"/>
                    <strong class="mr-2">{contributor.login}:</strong> {contributor.contributions} commits
                  </li>
                  
                  {/each}
                </ul>
              {:else}
                <p>No contributors found.</p>
              {/if}
            {:else if activeTab === "files"}
              {#if $fileStructure.length > 0}
                <ul>
                  {#each $fileStructure as file}
                    <li>
                      {#if file.type === "file"}
                        <a href={file.html_url} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">{file.name}</a>
                      {:else if file.type === "dir"}
                        /<a href={file.html_url} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">{file.name}</a>
                      {/if}
                    </li>
                  {/each}
                </ul>
              {:else}
                <p>No files found.</p>
              {/if}
            {:else if activeTab === "live"}
              {#if $livePreviewUrl}
                <p>
                  <a class="text-blue-500 hover:underline" 
                    href={$livePreviewUrl} target="_blank" rel="noopener noreferrer">Live Preview.
                  </a>
                </p>
              {:else}
                <p>No live preview available.</p>
              {/if}
            {/if}
        <button on:click={closeModal} class="btn btn-primary mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Close</span>
        </div>
    </div>
    {/if}
