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