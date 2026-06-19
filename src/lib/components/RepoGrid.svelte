<script lang="ts">
  import { filteredRepos } from "$lib/stores";
  import { selectRepo } from "$lib/utils";

  const LANG_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    "C#": "#178600",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Svelte: "#ff3e00",
    Vue: "#41b883",
    Dart: "#00B4AB",
  };

  function langColor(lang: string | null): string {
    if (!lang) return "#8b949e";
    return LANG_COLORS[lang] ?? "#8b949e";
  }

  function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(ms / 86_400_000);
    if (days < 1) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }
</script>

<div class="repo-grid">
  {#each $filteredRepos as repo (repo.html_url)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="repo-card" on:click={() => selectRepo(repo)}>
      <!-- Header -->
      <div class="card-header">
        <div class="card-title-row">
          <a
            class="card-name"
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            on:click|stopPropagation
          >
            {repo.name}
          </a>
          <div class="card-badges">
            {#if repo.fork}
              <span class="badge badge-fork">
                <svg class="badge-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
                </svg>
                Fork
              </span>
            {/if}
            {#if repo.private}
              <span class="badge badge-private">Private</span>
            {:else}
              <span class="badge badge-public">Public</span>
            {/if}
            {#if repo.archived}
              <span class="badge badge-archived">Archived</span>
            {/if}
            {#if repo.is_template}
              <span class="badge badge-template">Template</span>
            {/if}
          </div>
        </div>

        <p class="card-desc">
          {repo.description || "No description available."}
        </p>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <div class="footer-meta">
          {#if repo.language}
            <span class="lang-badge">
              <span class="lang-dot" style="background:{langColor(repo.language)}"></span>
              {repo.language}
            </span>
          {:else}
            <span class="lang-badge muted">No language</span>
          {/if}
          <span class="stat-time" title={new Date(repo.updated_at).toLocaleDateString()}>
            Updated {timeAgo(repo.updated_at)}
          </span>
        </div>

        <div class="stats-row" aria-label="Repository statistics">
          <span class="repo-stat" title="Stars">
            <svg class="stat-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.873 6.325a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            {repo.stargazers_count}
          </span>
          <span class="repo-stat" title="Forks">
            <svg class="stat-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
            </svg>
            {repo.forks_count}
          </span>
          <span class="repo-stat" title="Open issues">
            <svg class="stat-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
            </svg>
            {repo.open_issues_count ?? 0}
          </span>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .repo-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    padding: 1rem;
  }

  .repo-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 0.75rem;
    padding: 1rem 1.125rem;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    color: #e6edf3;
    overflow: hidden;
    min-width: 0;
  }

  .repo-card:hover {
    border-color: #388bfd;
    box-shadow: 0 0 0 1px #1f6feb44, 0 4px 16px rgba(0, 0, 0, 0.4);
    transform: translateY(-1px);
  }

  /* Header */
  .card-header {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .card-title-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-name {
    font-size: 0.975rem;
    font-weight: 600;
    color: #58a6ff;
    text-decoration: none;
    line-height: 1.3;
    word-break: break-all;
  }

  .card-name:hover {
    text-decoration: underline;
  }

  .card-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 1px;
  }

  .badge {
    display: inline-block;
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1.6;
  }

  .badge-fork {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    background: #1f2937;
    border: 1px solid #374151;
    color: #9ca3af;
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .badge-icon {
    width: 0.7rem;
    height: 0.7rem;
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

  .badge-archived {
    background: rgba(139, 148, 158, 0.15);
    border: 1px solid rgba(139, 148, 158, 0.3);
    color: #8b949e;
  }

  .badge-template {
    background: rgba(130, 80, 255, 0.15);
    border: 1px solid rgba(130, 80, 255, 0.4);
    color: #a371f7;
  }

  .card-desc {
    font-size: 0.8rem;
    color: #8b949e;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Card footer */
  .card-footer {
    display: grid;
    gap: 0.5rem;
    border-top: 1px solid #21262d;
    padding-top: 0.625rem;
    margin-top: auto;
  }

  .footer-meta,
  .stats-row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
  }

  .footer-meta {
    justify-content: space-between;
  }

  .stats-row {
    flex-wrap: wrap;
  }

  .repo-stat {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.78rem;
    color: #8b949e;
    white-space: nowrap;
  }

  .stat-icon {
    width: 0.8rem;
    height: 0.8rem;
    flex-shrink: 0;
  }

  .lang-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: #e6edf3;
    white-space: nowrap;
  }

  .muted {
    color: #6e7681;
  }

  .lang-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stat-time {
    font-size: 0.75rem;
    color: #6e7681;
    white-space: nowrap;
    margin-left: auto;
  }
</style>
