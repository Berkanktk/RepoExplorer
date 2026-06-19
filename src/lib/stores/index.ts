import type { Repo } from "$lib/types";
import { writable, derived } from "svelte/store";

export const userToken = writable<string>("");
export const rememberToken = writable<boolean>(false);
export const authenticatedUsername = writable<string>("");

export const username = writable<string>("");
export const allRepos = writable<Repo[]>([]);
export const searchQuery = writable<string>("");
export const languageFilter = writable<string>("all");
export const repoTypeFilter = writable<string>("all");
export const archivedFilter = writable<string>("all");
export const templateFilter = writable<string>("all");
export const licenseFilter = writable<string>("all");
export const updatedWithinFilter = writable<string>("all");
export const sizeFilter = writable<string>("all");
export const permissionFilters = writable<string[]>([]);
export const hasDescription = writable<boolean>(false);
export const minStars = writable<number>(0);
export const minForks = writable<number>(0);
export const showForks = writable<boolean>(true);
export const showOnlyForked = writable<boolean>(false);
export const sortKey = writable<string>("");
export const sortDirection = writable<string>("desc");

export const loading = writable<boolean>(false);
export const selectedRepo = writable<Repo | null>(null);
export const readme = writable<string>("");

export const commits = writable<any[]>([]);
export const issues = writable<any[]>([]);
export const hasActiveIssues = writable<boolean>(false);
export const metadata = writable<any>(null);
export const contributors = writable<any[]>([]);
export const fileStructure = writable<any[]>([]);
export const livePreviewUrl = writable<string>("");
export const showOnlyLiveRepos = writable(false);

export const showConfigs = writable<boolean>(true);
export const activeTab = writable<string>("readme");

export const maxStars = derived(allRepos, ($allRepos) =>
  Math.max(...$allRepos.map((repo) => repo.stargazers_count), 0)
);

// Derived store for filtering and sorting repos
export const filteredRepos = derived(
  [
    allRepos,
    searchQuery,
    languageFilter,
    repoTypeFilter,
    archivedFilter,
    templateFilter,
    licenseFilter,
    updatedWithinFilter,
    sizeFilter,
    permissionFilters,
    hasDescription,
    minStars,
    minForks,
    showForks,
    sortKey,
    sortDirection,
    showOnlyLiveRepos,
    hasActiveIssues,
    showOnlyForked,
  ],
  ([
    $allRepos,
    $searchQuery,
    $languageFilter,
    $repoTypeFilter,
    $archivedFilter,
    $templateFilter,
    $licenseFilter,
    $updatedWithinFilter,
    $sizeFilter,
    $permissionFilters,
    $hasDescription,
    $minStars,
    $minForks,
    $showForks,
    $sortKey,
    $sortDirection,
    $showOnlyLiveRepos,
    $hasActiveIssues,
    $showOnlyForked,
  ]) => {
    const query = $searchQuery.trim().toLowerCase();
    const minStarsValue = Number($minStars) || 0;
    const minForksValue = Number($minForks) || 0;
    const now = Date.now();

    let repos = $allRepos.filter((repo) => {
      const matchesSearch =
        query.length === 0 ||
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query)) ||
        (repo.language && repo.language.toLowerCase().includes(query)) ||
        (repo.license?.name && repo.license.name.toLowerCase().includes(query)) ||
        (repo.topics ?? []).some((topic) => topic.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      if ($languageFilter !== "all" && repo.language !== $languageFilter)
        return false;
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
      if ($licenseFilter !== "all") {
        const licenseKey = repo.license?.key ?? "none";
        if ($licenseFilter !== licenseKey) return false;
      }
      if ($updatedWithinFilter !== "all") {
        const days = Number($updatedWithinFilter);
        const updatedAt = new Date(repo.updated_at).getTime();
        if (!Number.isFinite(updatedAt) || now - updatedAt > days * 86_400_000)
          return false;
      }
      if ($sizeFilter !== "all") {
        const size = repo.size ?? 0;
        if ($sizeFilter === "small" && size >= 1_000) return false;
        if ($sizeFilter === "medium" && (size < 1_000 || size > 10_000))
          return false;
        if ($sizeFilter === "large" && size <= 10_000) return false;
      }
      if (
        $permissionFilters.length > 0 &&
        !$permissionFilters.every(
          (permission) =>
            repo.permissions?.[permission as keyof NonNullable<Repo["permissions"]>]
        )
      )
        return false;
      if (repo.stargazers_count < minStarsValue) return false;
      if (repo.forks_count < minForksValue) return false;
      if (!$showForks && repo.fork) return false;
      if ($showOnlyForked && !repo.fork) return false;
      if ($showOnlyLiveRepos && !repo.has_pages && !repo.homepage) return false;
      if ($hasActiveIssues && repo.open_issues_count === 0) return false; 
      if ($hasDescription && !repo.description) return false;

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
          comp =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        } else if ($sortKey === "created") {
          comp =
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
        } else if ($sortKey === "size") {
          comp = (a.size ?? 0) - (b.size ?? 0);
        } else if ($sortKey === "issues") {
          comp = (a.open_issues_count ?? 0) - (b.open_issues_count ?? 0);
        } else if ($sortKey === "language") {
          comp = (a.language || "").localeCompare(b.language || "");
        } else if ($sortKey === "visibility") {
          comp = (a.private ? 1 : 0) - (b.private ? 1 : 0);
        }
        return $sortDirection === "asc" ? comp : -comp;
      });
    }

    return repos;
  }
);
