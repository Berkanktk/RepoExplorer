
import { allRepos, authenticatedUsername, commits, contributors, fileStructure, issues, livePreviewUrl, loading, metadata, pullRequests, readme, releases, selectedRepo, username, userToken, showConfigs, activeTab } from "$lib/stores";
import type { Repo } from "$lib/types";
import { md } from "$lib/utils";


let usernameStore: string = "";
let authenticatedUsernameStore: string = "";
let userTokenStore: string = "";
let activeTabStore: string = "readme";

$: username.subscribe((value) => {
    usernameStore = value;
}
);

$: authenticatedUsername.subscribe((value) => {
    authenticatedUsernameStore = value;
});

$: userToken.subscribe((value) => {
    userTokenStore = value;
}
);

$: activeTab.subscribe((value) => {
    activeTabStore = value;
});

export async function fetchRepos() {
    if (usernameStore === authenticatedUsernameStore) {
        await fetchOwnRepos();
    } else {
        await fetchReposByUsername(usernameStore);
    }
}

export async function fetchReposByUsername(targetUsername: string) {
    if (!targetUsername || !userTokenStore) return;
    loading.set(true);
    let page = 1;
    let all: Repo[] = [];
    try {
        while (true) {
            const res = await fetch(
                `https://api.github.com/users/${targetUsername}/repos?per_page=100&page=${page}`,
                { headers: { Authorization: `token ${userTokenStore}` } },
            );
            const data: Repo[] = await res.json();
            if (!data.length) break;
            all = all.concat(data);
            page++;
        }
        allRepos.set(all);
    } catch (e) {
        console.error("Failed to fetch repos:", e);
    } finally {
        loading.set(false);
        showConfigs.set(false);
    }
}

export async function fetchOwnRepos() {
    if (!userTokenStore) return;
    loading.set(true);
    let page = 1;
    let all: Repo[] = [];
    try {
        while (true) {
            const res = await fetch(
                `https://api.github.com/user/repos?visibility=all&per_page=100&page=${page}`,
                { headers: { Authorization: `token ${userTokenStore}` } },
            );
            const data: Repo[] = await res.json();
            if (!data.length) break;
            all = all.concat(data);
            page++;
        }
        allRepos.set(all);
    } catch (e) {
        console.error("Failed to fetch own repos:", e);
    } finally {
        loading.set(false);
        showConfigs.set(false);
    }
}

export async function fetchAuthenticatedUsername(token: string) {
    try {
        const res = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `token ${token}`,
            },
        });

        if (res.ok) {
            const data = await res.json();
            authenticatedUsername.set(data.login);
            username.set(data.login);
        } else {
            authenticatedUsername.set("");
            console.warn("Invalid token or request failed.");
        }
    } catch (err) {
        console.error("Error fetching user info:", err);
        authenticatedUsername.set("");
    }
}

export async function selectRepo(repo: Repo) {
    selectedRepo.set(repo);
    activeTabStore = "readme";

    // Reset all detail stores
    readme.set("Loading README...");
    commits.set([]);
    issues.set([]);
    metadata.set(null);
    contributors.set([]);
    fileStructure.set([]);
    livePreviewUrl.set("");
    pullRequests.set([]);
    releases.set([]);

    // Fetch README
    try {
        const res = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`,
            {
                headers: {
                    Authorization: `token ${userTokenStore}`,
                    Accept: "application/vnd.github.v3+json",
                },
            },
        );

        if (res.ok) {
            const data = await res.json();
            const decoded = atob(data.content);
            const repoBaseUrl = `https://github.com/${repo.owner.login}/${repo.name}/blob/master`;

            // Replace markdown image paths
            let updatedMarkdown = decoded.replace(
                /!\[([^\]]*)\]\(((?!https?:\/\/)([^)]+))\)/g,
                (match, alt, path) => `![${alt}](${repoBaseUrl}/${path}?raw=true)`,
            );

            // Also replace <img src="..."> with relative paths
            updatedMarkdown = updatedMarkdown.replace(
                /<img\s+[^>]*src=["'](?!https?:\/\/)([^"']+)["']/g,
                (match, path) =>
                    match.replace(path, `${repoBaseUrl}/${path}?raw=true`),
            );

            // Render with markdown-it
            readme.set(md.render(updatedMarkdown));
        } else {
            readme.set("<p>No README available.</p>");
        }
    } catch (error) {
        console.error("Error fetching README", error);
        readme.set("<p>Error fetching README.</p>");
    }

    // Fetch recent commits (limit 20)
    try {
        const resCommits = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?per_page=20`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resCommits.ok) {
            const data = await resCommits.json();
            commits.set(data);
        } else {
            commits.set([]);
        }
    } catch (error) {
        console.error("Error fetching commits", error);
        commits.set([]);
    }

    // Fetch open issues (includes pull requests)
    try {
        const resIssues = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/issues?state=open`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resIssues.ok) {
            const data = await resIssues.json();
            issues.set(data);
        } else {
            issues.set([]);
        }
    } catch (error) {
        console.error("Error fetching issues", error);
        issues.set([]);
    }

    // Fetch repository metadata
    try {
        const resMetadata = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resMetadata.ok) {
            const data = await resMetadata.json();
            metadata.set(data);
            // Set live preview URL if GitHub Pages is enabled
            if (data.has_pages) {
                livePreviewUrl.set(
                    `https://${repo.owner.login}.github.io/${repo.name}/`,
                );
            }
        } else {
            metadata.set(null);
        }
    } catch (error) {
        console.error("Error fetching metadata", error);
        metadata.set(null);
    }

    // Fetch top contributors (limit 10)
    try {
        const resContributors = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contributors?per_page=10`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resContributors.ok) {
            const data = await resContributors.json();
            contributors.set(data);
        } else {
            contributors.set([]);
        }
    } catch (error) {
        console.error("Error fetching contributors", error);
        contributors.set([]);
    }

    // Fetch file structure (contents at root)
    try {
        const resFiles = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resFiles.ok) {
            const data = await resFiles.json();
            console.log("File structure data:", data);
            fileStructure.set(data);
        } else {
            fileStructure.set([]);
        }
    } catch (error) {
        console.error("Error fetching file structure", error);
        fileStructure.set([]);
    }

    // Fetch open pull requests (limit 5)
    try {
        const resPR = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls?state=open&per_page=5`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resPR.ok) {
            const data = await resPR.json();
            pullRequests.set(data);
        } else {
            pullRequests.set([]);
        }
    } catch (error) {
        console.error("Error fetching pull requests", error);
        pullRequests.set([]);
    }

    // Fetch latest releases (limit 5)
    try {
        const resRel = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/releases?per_page=5`,
            { headers: { Authorization: `token ${userTokenStore}` } },
        );
        if (resRel.ok) {
            const data = await resRel.json();
            releases.set(data);
        } else {
            releases.set([]);
        }
    } catch (error) {
        console.error("Error fetching releases", error);
        releases.set([]);
    }
}
