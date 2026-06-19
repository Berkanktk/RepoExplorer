<script lang="ts">
  import {
    activeTab,
    commits,
    contributors,
    fileStructure,
    issues,
    livePreviewUrl,
    metadata,
    readme,
    selectedRepo,
    userToken,
  } from "$lib/stores";
  import FileTree from "./FileTree.svelte";

  let branches: string[] = [];
  let deployments: string[] = [];
  let copied = false;

  function closeModal() {
    selectedRepo.set(null);
    readme.set("");
    commits.set([]);
    issues.set([]);
    metadata.set(null);
    contributors.set([]);
    fileStructure.set([]);
    livePreviewUrl.set("");
  }

  async function copyCloneUrl() {
    const cloneUrl = $selectedRepo?.clone_url;
    if (cloneUrl) {
      await navigator.clipboard.writeText(cloneUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  function downloadRepo() {
    if (!$selectedRepo) return;
    const { owner, name, default_branch } = $selectedRepo;
    const url = `https://github.com/${owner.login}/${name}/archive/refs/heads/${default_branch}.zip`;
    window.open(url, "_blank");
  }

  function getBranches() {
    if (!$selectedRepo) return;
    const { owner, name } = $selectedRepo;
    fetch(`https://api.github.com/repos/${owner.login}/${name}/branches`, {
      headers: {
        Authorization: `token ${$userToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((r) => r.json())
      .then((data) => { branches = data.map((b: any) => b.name); })
      .catch(console.error);
  }

  function getDeployments() {
    if (!$selectedRepo) return;
    const { owner, name } = $selectedRepo;
    fetch(`https://api.github.com/repos/${owner.login}/${name}/deployments`, {
      headers: {
        Authorization: `token ${$userToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((r) => r.json())
      .then((data) => { deployments = data.map((d: any) => d.environment); })
      .catch(console.error);
  }

  getBranches();
  getDeployments();

  function daysAgo(dateStr: string): string {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (d === 0) return "today";
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
  }

  const TABS = [
    { key: "readme", label: "README" },
    { key: "commits", label: "Commits" },
    { key: "issues", label: "Issues" },
    { key: "metadata", label: "Metadata" },
    { key: "contributors", label: "Contributors" },
    { key: "files", label: "Files" },
    { key: "live", label: "Live Preview" },
  ] as const;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" on:click={closeModal}>
  <!-- blur sits behind, does not affect modal stacking context -->
  <div class="overlay-blur"></div>
  <div
    class="repo-modal"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="dialog"
    tabindex="-1"
    aria-labelledby="modal-title"
  >
    <!-- Modal header -->
    <div class="modal-header">
      <div class="modal-title-row">
        <div class="modal-title-left">
          <svg class="repo-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
          </svg>
          <h2 id="modal-title">
            <a
              href={$selectedRepo?.html_url}
              target="_blank"
              rel="noopener noreferrer"
              class="modal-repo-link"
            >
              {$selectedRepo?.owner.login}<span class="slash">/</span>{$selectedRepo?.name}
            </a>
          </h2>
          {#if $selectedRepo?.fork}
            <span class="header-badge badge-fork">Fork</span>
          {/if}
          {#if $selectedRepo?.private}
            <span class="header-badge badge-private">Private</span>
          {:else}
            <span class="header-badge badge-public">Public</span>
          {/if}
          {#if $selectedRepo?.archived}
            <span class="header-badge badge-archived">Archived</span>
          {/if}
        </div>

        <div class="modal-actions">
          <button class="action-btn" on:click={copyCloneUrl} title="Copy clone URL">
            {#if copied}
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
              </svg>
              Copied!
            {:else}
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
              </svg>
              Clone URL
            {/if}
          </button>
          <button class="action-btn" on:click={downloadRepo} title="Download ZIP">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
            </svg>
            Download
          </button>
          <button class="close-btn" on:click={closeModal} title="Close" aria-label="Close repository details">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" role="tablist">
        {#each TABS as tab}
          <button
            class="tab"
            class:active={$activeTab === tab.key}
            on:click={() => activeTab.set(tab.key)}
            role="tab"
            aria-selected={$activeTab === tab.key}
          >
            {tab.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Tab content -->
    <div class="modal-body" class:readme-body={$activeTab === "readme"}>
      {#if $activeTab === "readme"}
        {#if $readme && $readme !== "Loading README..."}
          <div class="prose-wrapper">
            <div class="prose">{@html $readme}</div>
          </div>
        {:else}
          <div class="empty-state">Loading README...</div>
        {/if}

      {:else if $activeTab === "commits"}
        {#if $commits.length > 0}
          <ul class="item-list">
            {#each $commits as commit}
              <li class="item-row">
                <a
                  class="commit-sha"
                  href={commit.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {commit.sha.substring(0, 7)}
                </a>
                <span class="commit-msg">
                  {commit.commit.message.length > 72
                    ? commit.commit.message.substring(0, 72) + "…"
                    : commit.commit.message}
                </span>
                <span class="item-meta">
                  {commit.commit.author.name} · {new Date(commit.commit.author.date).toLocaleDateString()}
                </span>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="empty-state">No recent commits found.</div>
        {/if}

      {:else if $activeTab === "issues"}
        {#if $issues.length > 0}
          <ul class="item-list">
            {#each $issues as issue}
              <li class="item-row">
                <svg class="issue-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
                </svg>
                <a
                  class="issue-title"
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {issue.title}
                </a>
                <span class="item-meta">
                  #{issue.number} · {issue.user.login} · {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </li>
            {/each}
          </ul>
          <div class="list-footer">
            <span class="item-meta">{$issues.length} open issue{$issues.length !== 1 ? "s" : ""}</span>
          </div>
        {:else}
          <div class="empty-state">No open issues found.</div>
        {/if}

      {:else if $activeTab === "metadata"}
        {#if $metadata}
          <div class="meta-grid">
            <div class="meta-section">
              <h3 class="meta-heading">Repository</h3>
              <dl class="meta-list">
                <div class="meta-row">
                  <dt>Stars</dt>
                  <dd>⭐ {$metadata.stargazers_count.toLocaleString()}</dd>
                </div>
                <div class="meta-row">
                  <dt>Watchers</dt>
                  <dd>{$metadata.subscribers_count.toLocaleString()}</dd>
                </div>
                <div class="meta-row">
                  <dt>Forks</dt>
                  <dd>{$metadata.forks_count?.toLocaleString() ?? 0}</dd>
                </div>
                <div class="meta-row">
                  <dt>License</dt>
                  <dd>{$metadata.license ? $metadata.license.name : "None"}</dd>
                </div>
                <div class="meta-row">
                  <dt>Open Issues</dt>
                  <dd>{$metadata.open_issues_count ?? 0}</dd>
                </div>
              </dl>
            </div>

            <div class="meta-section">
              <h3 class="meta-heading">Dates</h3>
              <dl class="meta-list">
                <div class="meta-row">
                  <dt>Created</dt>
                  <dd>
                    {new Date($metadata.created_at).toLocaleDateString()}
                    <span class="item-meta">({daysAgo($metadata.created_at)})</span>
                  </dd>
                </div>
                <div class="meta-row">
                  <dt>Last Updated</dt>
                  <dd>
                    {new Date($metadata.updated_at).toLocaleDateString()}
                    <span class="item-meta">({daysAgo($metadata.updated_at)})</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div class="meta-section meta-section-full">
              <h3 class="meta-heading">Branches</h3>
              <div class="branch-list">
                <span class="branch-tag branch-default">{$metadata.default_branch} (default)</span>
                {#each branches.filter((b) => b !== $metadata.default_branch) as branch}
                  <span class="branch-tag">{branch}</span>
                {/each}
              </div>
            </div>

            {#if $metadata.topics?.length > 0}
              <div class="meta-section meta-section-full">
                <h3 class="meta-heading">Topics</h3>
                <div class="branch-list">
                  {#each $metadata.topics as topic}
                    <span class="topic-tag">{topic}</span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="empty-state">No metadata available.</div>
        {/if}

      {:else if $activeTab === "contributors"}
        {#if $contributors.length > 0}
          <ul class="contrib-list">
            {#each $contributors as contributor}
              <li class="contrib-row">
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  class="contrib-avatar"
                />
                <div class="contrib-info">
                  <a
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="contrib-name"
                  >
                    {contributor.login}
                  </a>
                  <span class="item-meta">{contributor.contributions} commits</span>
                </div>
                <div class="contrib-bar-wrap">
                  <div
                    class="contrib-bar"
                    style="width:{Math.round((contributor.contributions / $contributors[0].contributions) * 100)}%"
                  ></div>
                </div>
                <span class="contrib-count">{contributor.contributions}</span>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="empty-state">No contributors found.</div>
        {/if}

      {:else if $activeTab === "files"}
        {#if $fileStructure.length > 0}
          <p class="files-hint">Click a file to open in GitHub, or a folder to expand.</p>
          <div class="mt-3">
            <FileTree files={$fileStructure} token={$userToken} />
          </div>
        {:else}
          <div class="empty-state">No files found.</div>
        {/if}

      {:else if $activeTab === "live"}
        {#if $livePreviewUrl}
          <p class="files-hint text-center mb-3">Quick preview of the hosted site.</p>
          <iframe
            src={$livePreviewUrl}
            width="100%"
            height="460px"
            class="live-iframe"
            title="Live Preview"
          ></iframe>
          <div class="live-link-row">
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z"/>
            </svg>
            <a href={$livePreviewUrl} target="_blank" rel="noopener noreferrer" class="live-link">
              {$livePreviewUrl}
            </a>
          </div>
        {:else if deployments.includes("github-pages") && $selectedRepo}
          {@const pagesUrl = `https://${$selectedRepo.owner.login}.github.io/${$selectedRepo.name}`}
          <div class="empty-state">
            <a href={pagesUrl} target="_blank" rel="noopener noreferrer" class="live-link">
              {pagesUrl}
            </a>
          </div>
        {:else}
          <div class="empty-state">No live preview available.</div>
        {/if}

        {#if deployments.length > 0}
          <div class="deployed-row">
            <span class="item-meta">Deployed to:</span>
            {#each deployments.slice(0, 3) as env}
              <span class="deploy-tag">{env}</span>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  /* Separate blur layer that sits behind the modal */
  .overlay-blur {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: -1;
  }

  .repo-modal {
    background: #2d333b;
    border: 1px solid #444c56;
    border-radius: 0.875rem;
    max-width: 860px;
    width: 100%;
    height: min(780px, 92vh);
    min-height: min(620px, 92vh);
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    color: #e6edf3;
    overflow: hidden;
    position: relative;
  }

  /* Header */
  .modal-header {
    border-bottom: 1px solid #21262d;
    flex-shrink: 0;
  }

  .modal-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .modal-title-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .repo-icon {
    width: 1.1rem;
    height: 1.1rem;
    color: #8b949e;
    flex-shrink: 0;
  }

  .modal-repo-link {
    font-size: 1.05rem;
    font-weight: 600;
    color: #58a6ff;
    text-decoration: none;
  }

  .modal-repo-link:hover { text-decoration: underline; }

  .slash {
    color: #8b949e;
    font-weight: 400;
    margin: 0 1px;
  }

  .header-badge {
    display: inline-block;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .badge-public {
    background: rgba(35, 134, 54, 0.15);
    border: 1px solid rgba(35, 134, 54, 0.4);
    color: #3fb950;
  }

  .badge-private {
    background: rgba(187, 128, 9, 0.15);
    border: 1px solid rgba(187, 128, 9, 0.4);
    color: #d29922;
  }

  .badge-fork {
    background: #1f2937;
    border: 1px solid #374151;
    color: #9ca3af;
  }

  .badge-archived {
    background: rgba(139, 148, 158, 0.15);
    border: 1px solid rgba(139, 148, 158, 0.3);
    color: #8b949e;
  }

  .modal-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #373e47;
    color: #e6edf3;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .action-btn:hover {
    background: #21262d;
    border-color: #8b949e;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #373e47;
    color: #8b949e;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: rgba(248, 81, 73, 0.1);
    border-color: #f85149;
    color: #f85149;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0;
    padding: 0 1.25rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
    color: #8b949e;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s;
    margin-bottom: -1px;
  }

  .tab:hover { color: #e6edf3; }

  .tab.active {
    color: #e6edf3;
    border-bottom-color: #f78166;
    font-weight: 500;
  }

  /* Body */
  .modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1.25rem;
    scrollbar-width: thin;
    scrollbar-color: #444c56 #2d333b;
  }

  /* README */
  .modal-body.readme-body {
    background: #0d1117;
    padding: 1.5rem;
  }

  .prose-wrapper {
    max-width: 820px;
    padding: 0 0 2rem;
  }

  .prose {
    color: #c9d1d9;
    font-size: 0.95rem;
    line-height: 1.65;
  }

  .prose :global(h1),
  .prose :global(h2),
  .prose :global(h3),
  .prose :global(h4) {
    color: #e6edf3;
    border-bottom: 1px solid #30363d;
    padding-bottom: 0.3em;
    margin-top: 1.5em;
    margin-bottom: 1rem;
    line-height: 1.25;
  }

  .prose :global(h1) {
    font-size: 2rem;
  }

  .prose :global(h2) {
    font-size: 1.45rem;
  }

  .prose :global(h3) {
    font-size: 1.15rem;
  }

  .prose :global(h1:first-child),
  .prose :global(h2:first-child),
  .prose :global(h3:first-child),
  .prose :global(h4:first-child) {
    margin-top: 0;
  }

  .prose :global(p),
  .prose :global(li),
  .prose :global(td) {
    color: #c9d1d9;
    line-height: 1.7;
  }

  .prose :global(p) {
    margin: 0 0 1rem;
  }

  .prose :global(ul),
  .prose :global(ol) {
    margin: 0 0 1rem;
    padding-left: 1.5rem;
  }

  .prose :global(a) { color: #58a6ff; }

  .prose :global(code) {
    background: #22272e;
    border: 1px solid #444c56;
    border-radius: 0.25rem;
    padding: 0.1em 0.35em;
    font-size: 0.875em;
    color: #e6edf3;
  }

  .prose :global(pre) {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }

  .prose :global(pre code) {
    background: none;
    border: none;
    padding: 0;
  }

  .prose :global(blockquote) {
    border-left: 3px solid #30363d;
    margin: 1rem 0;
    padding-left: 1rem;
    color: #8b949e;
  }

  .prose :global(table) {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem;
    font-size: 0.875rem;
  }

  .prose :global(th),
  .prose :global(td) {
    border: 1px solid #30363d;
    padding: 0.55rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }

  .prose :global(th) {
    background: #161b22;
    color: #e6edf3;
    font-weight: 600;
  }

  .prose :global(tr:nth-child(even) td) {
    background: rgba(22, 27, 34, 0.65);
  }

  .prose :global(tr:hover td) {
    background: rgba(88, 166, 255, 0.08);
  }

  .prose :global(hr) {
    border: 0;
    border-top: 1px solid #30363d;
    margin: 1.5rem 0;
  }

  .prose :global(img) {
    max-width: 100%;
    border-radius: 0.375rem;
  }

  /* Shared list */
  .item-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .item-row {
    display: flex;
    align-items: baseline;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    background: #373e47;
    border: 1px solid #21262d;
    border-radius: 0.5rem;
    flex-wrap: wrap;
  }

  .item-row + .item-row { margin-top: 0.375rem; }

  .commit-sha {
    font-family: monospace;
    font-size: 0.8rem;
    color: #58a6ff;
    text-decoration: none;
    flex-shrink: 0;
  }

  .commit-sha:hover { text-decoration: underline; }

  .commit-msg {
    font-size: 0.875rem;
    color: #e6edf3;
    flex: 1;
    min-width: 0;
    word-break: break-word;
  }

  .issue-icon {
    width: 0.875rem;
    height: 0.875rem;
    color: #3fb950;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .issue-title {
    font-size: 0.875rem;
    color: #e6edf3;
    text-decoration: none;
    flex: 1;
  }

  .issue-title:hover { color: #58a6ff; }

  .item-meta {
    font-size: 0.75rem;
    color: #6e7681;
    white-space: nowrap;
  }

  .list-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.5rem;
  }

  /* Metadata */
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .meta-section {
    background: #373e47;
    border: 1px solid #21262d;
    border-radius: 0.5rem;
    padding: 0.875rem 1rem;
  }

  .meta-section-full {
    grid-column: 1 / -1;
  }

  .meta-heading {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8b949e;
    margin: 0 0 0.625rem;
  }

  .meta-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .meta-row dt { color: #8b949e; }
  .meta-row dd { color: #e6edf3; font-weight: 500; text-align: right; }

  .branch-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .branch-tag {
    padding: 0.2rem 0.6rem;
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid rgba(88, 166, 255, 0.3);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #58a6ff;
    font-family: monospace;
  }

  .branch-default {
    background: rgba(31, 111, 235, 0.15);
    border-color: rgba(31, 111, 235, 0.5);
  }

  .topic-tag {
    padding: 0.2rem 0.6rem;
    background: rgba(130, 80, 255, 0.1);
    border: 1px solid rgba(130, 80, 255, 0.3);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #a371f7;
  }

  /* Contributors */
  .contrib-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .contrib-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    background: #373e47;
    border: 1px solid #21262d;
    border-radius: 0.5rem;
  }

  .contrib-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid #30363d;
    flex-shrink: 0;
  }

  .contrib-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 100px;
  }

  .contrib-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #e6edf3;
    text-decoration: none;
  }

  .contrib-name:hover { color: #58a6ff; }

  .contrib-bar-wrap {
    flex: 1;
    height: 0.3rem;
    background: #21262d;
    border-radius: 9999px;
    overflow: hidden;
  }

  .contrib-bar {
    height: 100%;
    background: #1f6feb;
    border-radius: 9999px;
    min-width: 2px;
  }

  .contrib-count {
    font-size: 0.78rem;
    color: #8b949e;
    min-width: 2.5rem;
    text-align: right;
  }

  /* Files */
  .files-hint {
    font-size: 0.8rem;
    color: #8b949e;
    margin: 0 0 0.5rem;
  }

  /* Live */
  .live-iframe {
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    display: block;
  }

  .live-link-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    color: #8b949e;
  }

  .live-link {
    font-size: 0.875rem;
    color: #58a6ff;
    text-decoration: none;
    word-break: break-all;
  }

  .live-link:hover { text-decoration: underline; }

  .deployed-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .deploy-tag {
    padding: 0.2rem 0.6rem;
    background: rgba(35, 134, 54, 0.15);
    border: 1px solid rgba(35, 134, 54, 0.4);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #3fb950;
  }

  /* Empty */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 8rem;
    color: #8b949e;
    font-size: 0.9rem;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
    .overlay {
      align-items: stretch;
      padding: 0.5rem;
    }

    .repo-modal {
      height: calc(100vh - 1rem);
      min-height: 0;
    }
  }
</style>
