<script lang="ts">
  import { filteredRepos } from "$lib/stores";
  import { selectRepo } from "$lib/utils";
</script>

<div class="repo-grid p-4">
  {#each $filteredRepos as repo (repo.html_url)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="repo-card" on:click={() => selectRepo(repo)}>
      <h2 class="repo-title">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          on:click|stopPropagation
        >
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
        <li>
          <img src="/bling_fill.svg" alt="star" class="inline" />
          <strong>Stars:</strong>
          {repo.stargazers_count}
        </li>
        <li>
          <img src="/fork_line.svg" alt="fork" class="inline" />
          <strong>Forks:</strong>
          {repo.forks_count}
        </li>
        <li>
          <img src="/code_line.svg" alt="language" class="inline" />
          <strong>Language:</strong>
          {repo.language || "N/A"}
        </li>
        <ul>
          <img src="/time_line.svg" alt="time" class="inline" />
          <strong>Last update:</strong>
          {#if new Date().getTime() - new Date(repo.updated_at).getTime() > 1000 * 3600 * 24 * 365}
            {Math.floor(
              (new Date().getTime() - new Date(repo.updated_at).getTime()) /
                (1000 * 3600 * 24 * 365),
            )}
            {Math.floor(
              (new Date().getTime() - new Date(repo.updated_at).getTime()) /
                (1000 * 3600 * 24 * 365),
            ) === 1
              ? "year"
              : "years"} ago
          {:else}
            {Math.floor(
              (new Date().getTime() - new Date(repo.updated_at).getTime()) /
                (1000 * 3600 * 24),
            )} days ago
          {/if}
          ({new Date(repo.updated_at).toLocaleDateString()})
        </ul>
      </ul>
    </div>
  {/each}
</div>

<style>
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
</style>
