<script lang="ts">
  import { onMount } from "svelte";

  export let label = "";
  export let value = "";
  export let options: { value: string; label: string }[] = [];
  export let disabled = false;

  let open = false;
  let selectEl: HTMLDetailsElement;

  $: selectedLabel = options.find((option) => option.value === value)?.label ?? label;

  function selectValue(nextValue: string) {
    if (disabled) return;
    value = nextValue;
    open = false;
  }

  onMount(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (open && selectEl && !selectEl.contains(event.target as Node)) {
        open = false;
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  });
</script>

<details class="select-menu" class:disabled bind:open bind:this={selectEl}>
  <summary class:active={value !== "" && value !== "all"}>
    <span>{selectedLabel}</span>
    <svg class="select-arrow" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M12.78 5.72a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.78a.75.75 0 0 1 1.06-1.06L8 9.44l3.72-3.72a.75.75 0 0 1 1.06 0Z"/>
    </svg>
  </summary>

  {#if !disabled}
    <div class="select-options">
      {#each options as option}
        <button
          type="button"
          class="select-option"
          class:selected={option.value === value}
          on:click={() => selectValue(option.value)}
        >
          <span>{option.label}</span>
          {#if option.value === value}
            <svg class="check-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
            </svg>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</details>

<style>
  .select-menu {
    position: relative;
  }

  .select-menu summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    height: 2.35rem;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #161b22;
    color: #e6edf3;
    cursor: pointer;
    font-size: 0.875rem;
    list-style: none;
    padding: 0 0.65rem 0 0.75rem;
    transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
  }

  .select-menu summary::-webkit-details-marker {
    display: none;
  }

  .select-menu summary span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-menu summary:hover,
  .select-menu[open] summary {
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
  }

  .select-menu summary.active {
    border-color: #388bfd;
  }

  .select-menu.disabled summary {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .select-arrow {
    width: 1rem;
    height: 1rem;
    color: #8b949e;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .select-menu[open] .select-arrow {
    transform: rotate(180deg);
  }

  .select-options {
    position: absolute;
    z-index: 25;
    top: calc(100% + 0.35rem);
    right: 0;
    left: 0;
    display: grid;
    gap: 0.25rem;
    max-height: 18rem;
    overflow-y: auto;
    border: 1px solid #30363d;
    border-radius: 0.5rem;
    background: #0d1117;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    padding: 0.4rem;
    scrollbar-width: thin;
    scrollbar-color: #30363d #0d1117;
  }

  .select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    border: 0;
    border-radius: 0.375rem;
    background: transparent;
    color: #c9d1d9;
    cursor: pointer;
    font-size: 0.875rem;
    padding: 0.5rem;
    text-align: left;
  }

  .select-option:hover {
    background: #161b22;
    color: #e6edf3;
  }

  .select-option.selected {
    background: rgba(56, 139, 253, 0.14);
    color: #79c0ff;
  }

  .check-icon {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
  }
</style>
