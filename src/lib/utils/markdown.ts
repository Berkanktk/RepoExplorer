import MarkdownIt from "markdown-it";

// Create a markdown-it instance with any custom options you like
export const md = new MarkdownIt({
    html: true, // Enable HTML tags in source
    breaks: true, // Convert '\n' in paragraphs into <br>
    linkify: true, // Autoconvert URL-like text to links
});