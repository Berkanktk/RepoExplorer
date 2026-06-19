<script lang="ts">
  import {
    allRepos,
    loading,
    rememberToken,
    showConfigs,
    userToken,
    username,
  } from "$lib/stores";
  import { fetchRepos } from "$lib/utils";

  $: hasRepos = $allRepos.length > 0;
  $: canSearch = $userToken.trim().length > 0 && $username.trim().length > 0 && !$loading;

  function toggleConfigs() {
    showConfigs.set(!$showConfigs);
  }
</script>

<section class:setup-shell={!hasRepos} class:settings-shell={hasRepos}>
  {#if hasRepos}
    <div class="settings-toolbar">
      <div>
        <p class="eyebrow">Repository Source</p>
        <p class="source-line">
          <span class="source-user">{$username}</span>
          <span class="source-count">{$allRepos.length} loaded</span>
        </p>
      </div>

      <button
        class="secondary-btn"
        type="button"
        on:click={toggleConfigs}
        aria-expanded={$showConfigs}
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M6.75 0a.75.75 0 0 1 .75.75V2h1V.75a.75.75 0 0 1 1.5 0V2h.75A2.25 2.25 0 0 1 13 4.25v7.5A2.25 2.25 0 0 1 10.75 14H10v1.25a.75.75 0 0 1-1.5 0V14h-1v1.25a.75.75 0 0 1-1.5 0V14h-.75A2.25 2.25 0 0 1 3 11.75v-7.5A2.25 2.25 0 0 1 5.25 2H6V.75A.75.75 0 0 1 6.75 0ZM5.25 3.5a.75.75 0 0 0-.75.75v7.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75h-5.5Z"/>
        </svg>
        {$showConfigs ? "Hide settings" : "Reconfigure"}
      </button>
    </div>
  {/if}

  {#if $showConfigs}
    <form class:setup-card={!hasRepos} class:settings-card={hasRepos} on:submit|preventDefault={fetchRepos}>
      {#if !hasRepos}
        <div class="setup-copy">
          <p class="eyebrow">Get Started</p>
          <h2>Connect GitHub</h2>
          <p>
            Enter a token and username to load repositories, including private repos your token can read.
          </p>
        </div>
      {:else}
        <div class="settings-heading">
          <div>
            <p class="eyebrow">Settings</p>
            <h2>Change repository source</h2>
          </div>
          <p>Update the token or username, then reload the repository list.</p>
        </div>
      {/if}

      <div class="config-grid">
        <label class="field field-token">
          <span class="field-label">
            GitHub Token
            <span class="hint-wrap">
              <span class="hint-icon" aria-label="Token permissions help">i</span>
              <span class="hint-popover">
                Used only in your browser for GitHub API requests. Required access: metadata, contents,
                deployments, and issues.
              </span>
            </span>
          </span>
          <input
            type="password"
            bind:value={$userToken}
            placeholder="github_pat_..."
            autocomplete="off"
            class="text-input"
          />
          <a
            class="field-link"
            href="https://github.com/settings/personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>You can generate a token here:</span>
            github.com/settings/personal-access-tokens
          </a>
        </label>

        <label class="field field-user">
          <span class="field-label">GitHub Username</span>
          <input
            type="text"
            bind:value={$username}
            placeholder="e.g. torvalds"
            autocomplete="username"
            class="text-input"
          />
        </label>
      </div>

      <div class="config-actions">
        <label class="remember-row">
          <input type="checkbox" bind:checked={$rememberToken} />
          <span>Remember token on this device</span>
        </label>

        <button class="primary-btn" type="submit" disabled={!canSearch}>
          {#if $loading}
            Loading...
          {:else if hasRepos}
            Reload repositories
          {:else}
            Load repositories
          {/if}
        </button>
      </div>
    </form>
  {/if}
</section>

<style>
  .setup-shell {
    display: flex;
    justify-content: center;
    padding: 0 1rem 1.5rem;
  }

  .settings-shell {
    margin: 0 1rem 0.75rem;
  }

  .setup-card,
  .settings-card,
  .settings-toolbar {
    background: #0d1117;
    border: 1px solid #21262d;
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.22);
  }

  .setup-card {
    width: min(100%, 760px);
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .settings-card {
    border-top: 0;
    border-radius: 0 0 0.75rem 0.75rem;
    padding: 1rem;
  }

  .settings-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
  }

  .settings-shell:has(.settings-card) .settings-toolbar {
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }

  .setup-copy {
    margin-bottom: 1rem;
    max-width: 34rem;
  }

  .settings-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8b949e;
  }

  h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #e6edf3;
  }

  p {
    margin: 0;
    color: #8b949e;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .source-line {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    flex-wrap: wrap;
  }

  .source-user {
    color: #e6edf3;
    font-weight: 600;
  }

  .source-count {
    color: #6e7681;
    font-size: 0.8rem;
  }

  .config-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1.3fr) minmax(220px, 0.7fr);
    gap: 0.875rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #c9d1d9;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .text-input {
    height: 2.5rem;
    width: 100%;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #161b22;
    color: #e6edf3;
    font-size: 0.9rem;
    outline: none;
    padding: 0 0.75rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .text-input:focus {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.12);
  }

  .field-link {
    width: fit-content;
    color: #58a6ff;
    font-size: 0.78rem;
    text-decoration: none;
  }

  .field-link span {
    color: #8b949e;
  }

  .field-link:hover {
    text-decoration: underline;
  }

  .hint-wrap {
    position: relative;
    display: inline-flex;
  }

  .hint-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    border: 1px solid #30363d;
    border-radius: 50%;
    color: #8b949e;
    font-size: 0.7rem;
    cursor: help;
  }

  .hint-popover {
    position: absolute;
    left: 50%;
    top: calc(100% + 0.5rem);
    z-index: 10;
    width: 17rem;
    transform: translateX(-50%) translateY(-0.25rem);
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #010409;
    color: #c9d1d9;
    font-size: 0.78rem;
    font-weight: 400;
    line-height: 1.45;
    opacity: 0;
    padding: 0.625rem 0.75rem;
    pointer-events: none;
    transition: opacity 0.15s, transform 0.15s;
  }

  .hint-wrap:hover .hint-popover,
  .hint-wrap:focus-within .hint-popover {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .config-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
  }

  .remember-row {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #c9d1d9;
    font-size: 0.85rem;
  }

  .remember-row input {
    width: 1rem;
    height: 1rem;
    accent-color: #238636;
  }

  .primary-btn,
  .secondary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
    white-space: nowrap;
  }

  .primary-btn {
    min-width: 10rem;
    height: 2.5rem;
    border: 1px solid #2ea043;
    background: #238636;
    color: #ffffff;
    padding: 0 1rem;
  }

  .primary-btn:hover:not(:disabled) {
    background: #2ea043;
  }

  .primary-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .secondary-btn {
    height: 2.25rem;
    border: 1px solid #30363d;
    background: #161b22;
    color: #c9d1d9;
    padding: 0 0.875rem;
  }

  .secondary-btn:hover {
    border-color: #58a6ff;
    color: #e6edf3;
  }

  .btn-icon {
    width: 1rem;
    height: 1rem;
    color: #8b949e;
  }

  @media (max-width: 760px) {
    .settings-shell {
      margin-inline: 0;
    }

    .settings-heading,
    .settings-toolbar,
    .config-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .config-grid {
      grid-template-columns: 1fr;
    }

    .primary-btn,
    .secondary-btn {
      width: 100%;
    }
  }
</style>
