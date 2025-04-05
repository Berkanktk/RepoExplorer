<script lang="ts">
  import type { FileEntry } from "$lib/types";
  import FileTree from "./FileTree.svelte";

  export let files: FileEntry[] = [];
  export let token: string;

  async function toggleDir(file: FileEntry) {
    if (file.loading) return;

    // Update isOpen and clone file object
    file.isOpen = !file.isOpen;
    files = [...files]; // force reactivity

    // Only fetch children if not already loaded
    if (file.isOpen && !file.children) {
      file.loading = true;
      files = [...files];

      try {
        const res = await fetch(file.url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (res.ok) {
          const data: FileEntry[] = await res.json();
          file.children = data.filter(
            (f) => f.type === "file" || f.type === "dir",
          );
        } else {
          console.warn("Failed to load subdirectory:", file.path);
          file.children = [];
        }
      } catch (err) {
        console.error("Error loading subdirectory:", err);
        file.children = [];
      } finally {
        file.loading = false;
        files = [...files];
      }
    }
  }
</script>

<ul class="ml-4">
  {#each files as file (file.path)}
    <li class="mb-1">
      {#if file.type === "dir"}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="cursor-pointer text-yellow-600"
          on:click={() => toggleDir(file)}
        >
          {file.isOpen ? "📂" : "📁"}
          {file.name}
        </span>
        {#if file.loading}
          <span class="loading loading-spinner loading-xs text-neutral"></span>
        {/if}
        {#if file.isOpen && file.children}
          <FileTree files={file.children} {token} />
        {/if}
      {:else}
        <a
          href={file.html_url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-500 hover:underline"
        >
          📄 {file.name}
        </a>
      {/if}
    </li>
  {/each}
</ul>
