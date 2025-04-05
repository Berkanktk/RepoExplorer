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
export const minStars = writable<number>(0);
export const minForks = writable<number>(0);
export const showForks = writable<boolean>(true);
export const sortKey = writable<string>("");
export const sortDirection = writable<string>("desc");

export const loading = writable<boolean>(false);
export const selectedRepo = writable<Repo | null>(null);
export const readme = writable<string>("");

export const commits = writable<any[]>([]);
export const issues = writable<any[]>([]);
export const metadata = writable<any>(null);
export const contributors = writable<any[]>([]);
export const fileStructure = writable<any[]>([]);
export const livePreviewUrl = writable<string>("");
export const pullRequests = writable<any[]>([]);
export const releases = writable<any[]>([]);

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
    minStars,
    minForks,
    showForks,
    sortKey,
    sortDirection,
  ],
  ([
    $allRepos,
    $searchQuery,
    $languageFilter,
    $repoTypeFilter,
    $archivedFilter,
    $templateFilter,
    $minStars,
    $minForks,
    $showForks,
    $sortKey,
    $sortDirection,
  ]) => {
    let repos = $allRepos.filter((repo) => {
      const query = $searchQuery.toLowerCase();
      const matchesSearch =
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query));
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
        if ($templateFilter === "non-template" && repo.is_template)
          return false;
      }
      if (repo.stargazers_count < $minStars) return false;
      if (repo.forks_count < $minForks) return false;
      if (!$showForks && repo.fork) return false;
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
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime();
        } else if ($sortKey === "language") {
          comp = (a.language || "").localeCompare(b.language || "");
        }
        return $sortDirection === "asc" ? comp : -comp;
      });
    }
    return repos;
  },
);