<script lang="ts">
  import { userToken, username, rememberToken, showConfigs } from "$lib/stores";
  import { loadToken, fetchRepos } from "$lib/utils";
  import { onMount } from "svelte";

  function toggleConfigs() {
    showConfigs.set(!$showConfigs);
  }

  // Load token from localStorage on mount
  onMount(() => {
    const stored = loadToken();
    if (stored) {
      userToken.set(stored);
      rememberToken.set(true);
    }
  });
</script>

<div class="absolute top-0 right-0 p-4">
  <button class="btn btn-sm bg-white text-black" on:click={toggleConfigs}>
    {$showConfigs ? "Hide Configs" : "Show Configs"}
  </button>
</div>

{#if $showConfigs}
  <div class="flex w-full px-4 py-2 bg-[#030418]">
    <div class="token-input mr-4">
      <label>
        <span class="label-text flex items-center gap-1 mb-1">
          GitHub Token
          <span class="flex tooltip tooltip-bottom tooltip-primary">
            <div
              class="tooltip"
              data-tip="Your personal access token is required for authenticated GitHub API calls. It will be used to fetch repositories and read-only data such as issues and metadata."
            >
              <img src="/information_line.svg" alt="info" />
            </div>
          </span>
        </span>
        <input
          type="password"
          bind:value={$userToken}
          placeholder="Enter your GitHub token..."
          class="input input-bordered block w-full"
        />
      </label>
      <p class="text-xs text-gray-500 mt-2">
        You can generate a token here:
        <a
          class="text-blue-500 hover:underline"
          href="https://github.com/settings/personal-access-tokens"
          target="_blank"
        >
          github.com/settings/personal-access-tokens
        </a>
      </p>
      <label class="flex items-center gap-2 mt-3">
        <input
          type="checkbox"
          bind:checked={$rememberToken}
          class="checkbox checked:shadow-none"
        />
        <span class="label-text">Remember token on this device</span>
      </label>
    </div>

    <div class="flex gap-2">
      <div class="flex user-search mb-4">
        <label>
          <span class="label-text flex mb-1">GitHub Username</span>
          <div class="flex flex-row gap-4">
            <input
              type="text"
              bind:value={$username}
              placeholder="e.g., torvalds"
              class="input input-bordered block"
            />
            <div class="flex flex-row gap-2">
              <button class="btn bg-white text-black" on:click={fetchRepos}>
                Search
              </button>
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
{/if}

<style>
  .token-input {
    margin-bottom: 1rem;
  }
</style>
