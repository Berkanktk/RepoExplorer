export interface Repo {
    name: string;
    private: boolean;
    description: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
    license?: { key: string; name: string } | null;
    updated_at: string;
    created_at?: string;
    pushed_at?: string;
    size?: number;
    html_url: string;
    fork: boolean;
    archived: boolean;
    is_template: boolean;
    owner: { login: string };
    has_pages?: boolean;
    homepage?: string;
    topics?: string[];
    permissions?: {
        admin?: boolean;
        maintain?: boolean;
        pull?: boolean;
        push?: boolean;
        triage?: boolean;
    };
    clone_url?: string;
    default_branch?: string;
    open_issues_count?: number;
}

export type Tab =
    | "readme"
    | "commits"
    | "issues"
    | "pulls"
    | "releases"
    | "metadata"
    | "contributors"
    | "files"
    | "live";


export type FileEntry = {
    name: string;
    path: string;
    type: "file" | "dir";
    html_url: string;
    url: string; // GitHub API URL for this item
    children?: FileEntry[];
    isOpen?: boolean;
    loading?: boolean; // Added this property
};
