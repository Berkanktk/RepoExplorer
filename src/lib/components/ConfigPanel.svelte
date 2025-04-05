<script lang="ts">
  import {
    userToken,
    username,
    rememberToken,
    showConfigs,
    allRepos,
  } from "$lib/stores";
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

{#if $userToken && $allRepos.length > 0}
  <div class="sm:absolute top-0 right-0 sm:p-4 flex justify-center">
    <button
      class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white text-black rounded-xl shadow-md hover:bg-gray-100 transition-all"
      on:click={toggleConfigs}
    >
      {#if $showConfigs}
        <img src="/toggle_right_fill.svg" alt="close" class="w-5 h-5" />
      {:else}
        <img src="/toggle_left_line.svg" alt="settings" class="w-5 h-5" />
      {/if}
      <span>Settings</span>
    </button>
  </div>
{/if}


{#if $showConfigs}
  <div class="flex w-full px-4 py-2 bg-[#030418] flex-wrap sm:justify-center">
    <div class="token-input mr-4">
      <label>
        <span class="label-text flex items-center gap-1 mb-1">
          GitHub Token
          <span class="flex tooltip tooltip-bottom tooltip-primary">
            <div class="relative group inline-block">
              <img src="/information_line.svg" alt="info" />

              <div
                class="absolute z-10 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto bg-[#09090b] text-white text-[13px] p-3 rounded w-72 shadow-lg top-full mt-2 transition-all duration-200 ease-in-out"
              >
                <p>This token grants the website to read your repository data through the GitHub API.</p>
                <p class="mt-2 font-semibold">Required read-only access:</p>
                <ul class="list-disc list-inside">
                  <li>Metadata</li>
                  <li>Contents</li>
                  <li>Deployments</li>
                  <li>Issues</li>
                </ul>
              </div>
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
      <span class="text-xs text-gray-500 mt-2">
        You can generate a token here:
        <a
          class="text-blue-500 hover:underline"
          href="https://github.com/settings/personal-access-tokens"
          target="_blank"
        >
          github.com/settings/personal-access-tokens
        </a>
      </span>
      <label class="flex items-center gap-2 mt-3">
        <input
          type="checkbox"
          bind:checked={$rememberToken}
          class="checkbox checked:shadow-none"
        />
        <span class="label-text">Remember token on this device</span>
        <div
          class="tooltip"
          data-tip="This option will save your token in local storage of your browser."
        >
          <img src="/information_line.svg" alt="info" />
        </div>
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
