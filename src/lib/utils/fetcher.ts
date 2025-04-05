
import { allRepos, authenticatedUsername, commits, contributors, fileStructure, issues, livePreviewUrl, loading, metadata, readme, selectedRepo, username, userToken, showConfigs, activeTab } from "$lib/stores";
import type { Repo } from "$lib/types";
import { md } from "$lib/utils";


let usernameStore: string = "";
let authenticatedUsernameStore: string = "";
let userTokenStore: string = "";

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
                {
                    headers: {
                        Authorization: `token ${userTokenStore}`,
                    },
                }
            );

            const data: Repo[] = await res.json();
            all = all.concat(data);

            if (data.length < 100) break;

            page++;
        }

        allRepos.set(all);
    } catch (e) {
        console.error("Failed to fetch repos:", e);
    } finally {
        loading.set(false);
        showConfigs.set(true);
    }
}


export async function fetchOwnRepos(): Promise<void> {
    if (!userTokenStore) return;

    loading.set(true);
    showConfigs.set(false);

    let page = 1;
    let all: Repo[] = [];

    try {
        while (true) {
            const res = await fetch(
                `https://api.github.com/user/repos?visibility=all&per_page=100&page=${page}`,
                {
                    headers: {
                        Authorization: `token ${userTokenStore}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );

            if (!res.ok) {
                console.error(`GitHub API error (page ${page}):`, await res.text());
                break;
            }

            const data: Repo[] = await res.json();

            all.push(...data);
            if (data.length < 100) break;
            page++;
        }

        allRepos.set(all);
    } catch (err) {
        console.error("Failed to fetch own repos:", err);
    } finally {
        loading.set(false);
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
    activeTab.set("readme");

    // Reset all detail stores
    readme.set("Loading README...");
    commits.set([]);
    issues.set([]);
    metadata.set(null);
    contributors.set([]);
    fileStructure.set([]);
    livePreviewUrl.set("");

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
}
