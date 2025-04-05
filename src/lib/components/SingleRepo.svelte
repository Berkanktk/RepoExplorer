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

  function copyCloneUrl() {
    const cloneUrl = $selectedRepo?.clone_url;
    if (cloneUrl) {
      navigator.clipboard.writeText(cloneUrl).then(() => {
        alert("Clone URL copied to clipboard!");
      });
    }
  }

  function downloadRepo() {
    if (!$selectedRepo) return;

    const { owner, name, default_branch } = $selectedRepo;
    const downloadUrl = `https://github.com/${owner.login}/${name}/archive/refs/heads/${default_branch}.zip`;

    window.open(downloadUrl, "_blank");
  }

  function getBranches() {
    if (!$selectedRepo) return;

    const { owner, name } = $selectedRepo;
    const branchesUrl = `https://api.github.com/repos/${owner.login}/${name}/branches`;

    fetch(branchesUrl, {
      headers: {
        Authorization: `token ${$userToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        branches = data.map((branch: any) => branch.name);
      })
      .catch((error) => {
        console.error("Error fetching branches:", error);
      });
  }
  getBranches();

  function getDeployments() {
    if (!$selectedRepo) return;

    const { owner, name } = $selectedRepo;
    const deploymentsUrl = `https://api.github.com/repos/${owner.login}/${name}/deployments`;

    fetch(deploymentsUrl, {
      headers: {
        Authorization: `token ${$userToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Deployments:", data);
        deployments = data.map((deployment: any) => deployment.environment);
      })
      .catch((error) => {
        console.error("Error fetching deployments:", error);
      });
  }
  getDeployments();
</script>

<div
  class="modal-overlay"
  on:click={closeModal}
  on:keydown={(e) => e.key === "Enter" && closeModal()}
  role="button"
  tabindex="0"
  aria-label="Close modal"
>
  <div
    class="modal-content bg-white"
    on:click|stopPropagation
    on:keydown|stopPropagation={(e) => e.key === "Enter" && e.stopPropagation()}
    role="dialog"
    tabindex="0"
    aria-labelledby="modal-title"
  >
    <h2 id="modal-title" class="text-2xl">
      <a
        href={$selectedRepo?.html_url}
        target="_blank"
        rel="noopener noreferrer"
        class="hover:underline"
      >
        {$selectedRepo?.name}
      </a>
    </h2>
    <!-- Tabs UI -->
    <div class="tabs">
      <button
        class:active={$activeTab === "readme"}
        on:click={() => activeTab.set("readme")}
      >
        README
      </button>
      <button
        class:active={$activeTab === "commits"}
        on:click={() => activeTab.set("commits")}
      >
        Commits
      </button>
      <button
        class:active={$activeTab === "issues"}
        on:click={() => activeTab.set("issues")}
      >
        Issues
      </button>
      <button
        class:active={$activeTab === "metadata"}
        on:click={() => activeTab.set("metadata")}
      >
        Metadata
      </button>
      <button
        class:active={$activeTab === "contributors"}
        on:click={() => activeTab.set("contributors")}
      >
        Contributors
      </button>
      <button
        class:active={$activeTab === "files"}
        on:click={() => activeTab.set("files")}
      >
        Files
      </button>
      <button
        class:active={$activeTab === "live"}
        on:click={() => activeTab.set("live")}
      >
        Live Preview
      </button>
    </div>

    <!-- Tab Content -->
    {#if $activeTab === "readme"}
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
    {:else if $activeTab === "commits"}
      {#if $commits.length > 0}
        <ul>
          {#each $commits as commit}
            <li>
              <a
                class="text-blue-500 hover:underline"
                href={commit.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {commit.sha.substring(0, 7)}
              </a>
              -
              {#if commit.commit.message.length > 50}
                {commit.commit.message.substring(0, 50)}...
              {:else}
                <strong>{commit.commit.message}</strong>
                by {commit.commit.author.name} on {new Date(
                  commit.commit.author.date,
                ).toLocaleDateString()}
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p>No recent commits found.</p>
      {/if}
    {:else if $activeTab === "issues"}
      {#if $issues.length > 0}
        <ul>
          {#each $issues as issue}
            <li>
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{issue.title}</strong>
              </a>
              by {issue.user.login} on {new Date(
                issue.created_at,
              ).toLocaleDateString()}
            </li>
          {/each}
        </ul>

        <p class="text-gray-500 mt-2 flex justify-end">
          <span class="text-gray-500 mr-2">Total Open Issues:</span>
          <strong>{$issues.length}</strong>
        </p>
      {:else}
        <p>No open issues found.</p>
      {/if}
    {:else if $activeTab === "metadata"}
      {#if $metadata}
        <ul>
          <li>
            <strong>Branches:</strong>
            <span class="py-0.5 px-1 bg-blue-300 rounded text-sm">
              {$metadata.default_branch} (default)
            </span>

            {#if branches.length > 1}
              - {#each branches.filter((branch) => branch !== $metadata.default_branch) as branch}
                <span class="py-0.5 px-1 bg-blue-200 rounded mr-1 text-sm">
                  {branch}
                </span>
              {/each}
            {/if}
          </li>

          <li>
            <strong>Stars:</strong>
            {$metadata.stargazers_count}
          </li>
          <li>
            <strong>Watchers:</strong>
            {$metadata.subscribers_count}
          </li>
          <li>
            <strong>License:</strong>
            {$metadata.license ? $metadata.license.name : "N/A"}
          </li>
          <li>
            <strong>Created At:</strong>
            {new Date($metadata.created_at).toLocaleDateString()} ({Math.floor(
              (new Date().getTime() -
                new Date($metadata.created_at).getTime()) /
                (1000 * 3600 * 24),
            )}
            {Math.floor(
              (new Date().getTime() -
                new Date($metadata.created_at).getTime()) /
                (1000 * 3600 * 24),
            ) === 1
              ? "day"
              : "days"} ago)
          </li>
          <li>
            <strong>Last Updated:</strong>
            {new Date($metadata.updated_at).toLocaleDateString()} ({Math.floor(
              (new Date().getTime() -
                new Date($metadata.updated_at).getTime()) /
                (1000 * 3600 * 24),
            )}
            {Math.floor(
              (new Date().getTime() -
                new Date($metadata.updated_at).getTime()) /
                (1000 * 3600 * 24),
            ) === 1
              ? "day"
              : "days"} ago)
          </li>
          <li class="mt-4">
            <strong>Topics:</strong>
            {#if $metadata.topics.length > 0}
              {#each $metadata.topics as topic}
                <span class="py-0.5 px-1 bg-orange-200 rounded mr-1 text-sm">
                  {topic}
                </span>
              {/each}
            {:else}
              None
            {/if}
          </li>
        </ul>
      {:else}
        <p>No metadata available.</p>
      {/if}
    {:else if $activeTab === "contributors"}
      {#if $contributors.length > 0}
        <ul>
          {#each $contributors as contributor}
            <li class="flex items-center mb-1">
              <img
                src={contributor.avatar_url}
                alt={contributor.login}
                width="30"
                height="30"
                style="border-radius:50%"
                class="mr-2"
              />
              <strong class="mr-2">
                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-black hover:underline"
                  title="View {contributor.login}'s profile"
                  aria-label="View {contributor.login}'s profile"
                  tabindex="0"
                  aria-describedby="contributor-{contributor.login}"
                >
                  {contributor.login}:
                </a>
              </strong>
              {contributor.contributions} commits
            </li>
          {/each}
        </ul>
      {:else}
        <p>No contributors found.</p>
      {/if}
    {:else if $activeTab === "files"}
      {#if $fileStructure.length > 0}
        <span class="text-gray-500">
          Click on a file to open it in a new window, or click on a folder to
          expand it.
        </span>

        <div class="mt-4">
          <FileTree files={$fileStructure} token={$userToken} />
        </div>
      {:else}
        <p>No files found.</p>
      {/if}
    {:else if $activeTab === "live"}
      {#if $livePreviewUrl}
        <p class="text-gray-500 mb-2 text-center">
          Quick preview of the hosted site.
        </p>
        <iframe
          src={$livePreviewUrl}
          width="100%"
          height="500px"
          class="border-0 rounded-lg shadow-lg"
          title="Live Preview"
        ></iframe>

        <p class="mt-4">
          <strong>Preview Link:</strong>
          <a
            class="text-blue-500 hover:underline"
            href={$livePreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {$livePreviewUrl}
          </a>
        </p>
      {:else if deployments.includes("github-pages") && $selectedRepo}
        <p class="mt-4">
          <strong>Preview Link:</strong>
          <a
            class="text-blue-500 hover:underline text-lg"
            href={`https://${$selectedRepo.owner.login}.github.io/${$selectedRepo.name}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            https://{$selectedRepo.owner.login}.github.io/{$selectedRepo.name}
          </a>
        </p>
      {:else}
        <p>No live preview available.</p>
      {/if}
      {#if deployments.length > 0}
        <div class="mt-2">
          <strong>Deployed To:</strong>
          {#each deployments.slice(0, 1) as deployment}
            <span class="p-1 bg-green-200 rounded mr-1 text-sm">
              {deployment}
            </span>
          {/each}
        </div>
      {/if}
    {/if}
    <button on:click={closeModal} class="btn btn-error text-white mt-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span>Close</span>
    </button>

    <button
      on:click={copyCloneUrl}
      class="btn bg-black text-white mt-4 ml-2"
      aria-label="Copy clone URL"
      tabindex="0"
      on:keydown={(e) => e.key === "Enter" && copyCloneUrl()}
    >
      Clone URL
    </button>

    <button
      on:click={downloadRepo}
      class="btn bg-black text-white mt-4 ml-2"
      aria-label="Download repository"
      tabindex="0"
      on:keydown={(e) => e.key === "Enter" && downloadRepo()}
    >
      Download
    </button>
  </div>
</div>

<style>
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
