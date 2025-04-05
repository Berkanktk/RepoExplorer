export interface Repo {
    name: string;
    private: boolean;
    description: string;
    stargazers_count: number;
    forks_count: number;
    language: string;
    updated_at: string;
    html_url: string;
    fork: boolean;
    archived: boolean;
    is_template: boolean;
    owner: { login: string };
    has_pages?: boolean;
    homepage?: string;
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