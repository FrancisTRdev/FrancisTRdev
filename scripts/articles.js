const fs = require("fs");

const USERNAME = "francistrdev";
const COUNT = 3;
const README_PATH = "README.md";
const MAX_TITLE_LENGTH = 90;

const PLACEHOLDER =
  "https://raw.githubusercontent.com/github/explore/main/topics/devto/devto.png";

/**
 * Returns the article cover image or a placeholder.
 *
 * DEV.to cover images may contain Cloudinary transformation
 * parameters. Increasing their dimensions improves README quality.
 */
function imageUrl(url) {
  if (!url) {
    return PLACEHOLDER;
  }

  return url.replace(
    /width=\d+,height=\d+/,
    "width=1200,height=600"
  );
}

/**
 * Escapes text before inserting it into HTML.
 */
function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Shortens long article titles.
 */
function truncateTitle(title, maxLength = MAX_TITLE_LENGTH) {
  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length <= maxLength) {
    return normalizedTitle;
  }

  const shortenedTitle = normalizedTitle.slice(
    0,
    maxLength - 1
  );

  const lastSpace = shortenedTitle.lastIndexOf(" ");

  if (lastSpace >= Math.floor(maxLength * 0.65)) {
    return `${shortenedTitle
      .slice(0, lastSpace)
      .trimEnd()}…`;
  }

  return `${shortenedTitle.trimEnd()}…`;
}

/**
 * Converts an article into safe display values.
 */
function formatArticle(article) {
  return {
    url: escapeHtml(article.url),
    image: escapeHtml(imageUrl(article.cover_image)),
    fullTitle: escapeHtml(article.title),
    displayTitle: escapeHtml(
      truncateTitle(article.title)
    ),
    publishDate: escapeHtml(
      article.readable_publish_date
    ),
    readingTime:
      Number(article.reading_time_minutes) || 0,
    reactions:
      Number(article.public_reactions_count) || 0,
    comments:
      Number(article.comments_count) || 0,
  };
}

/**
 * Builds one responsive article card.
 *
 * GitHub does not support custom CSS or media queries in README files.
 * A one-column table with a 100%-width image is the most reliable
 * responsive layout across desktop and mobile.
 *
 * Do not add blank lines inside the table HTML. Blank lines can cause
 * GitHub Markdown to display parts of the HTML as plain text.
 */
function buildArticleCard(article) {
  return [
    '<table width="100%" cellpadding="0" cellspacing="0">',
    "<tr>",
    '<td width="100%" align="center">',
    `<a href="${article.url}">`,
    `<img src="${article.image}" alt="${article.fullTitle}" width="100%">`,
    "</a>",
    "</td>",
    "</tr>",
    "<tr>",
    '<td width="100%" align="left">',
    `<h3><a href="${article.url}" title="${article.fullTitle}">${article.displayTitle}</a></h3>`,
    `<sub>📅 ${article.publishDate} &nbsp;•&nbsp; ⏱️ ${article.readingTime} min read &nbsp;•&nbsp; ❤️ ${article.reactions} &nbsp;•&nbsp; 💬 ${article.comments}</sub>`,
    "</td>",
    "</tr>",
    "</table>",
  ].join("\n");
}

/**
 * Builds the complete responsive article section.
 */
function buildArticleSection(articles) {
  return articles
    .map(formatArticle)
    .map(buildArticleCard)
    .join("\n<br>\n");
}

/**
 * Retrieves the latest articles and updates README.md.
 */
async function updateReadme() {
  const apiUrl =
    "https://dev.to/api/articles" +
    `?username=${encodeURIComponent(USERNAME)}` +
    `&per_page=${COUNT}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.forem.api-v1+json",
      "User-Agent": `${USERNAME}-github-readme`,
    },
  });

  if (!response.ok) {
    throw new Error(
      "DEV.to API request failed: " +
        `${response.status} ${response.statusText}`
    );
  }

  const articles = await response.json();

  if (!Array.isArray(articles) || articles.length === 0) {
    console.log("No articles found. README unchanged.");
    return;
  }

  const selectedArticles = articles.slice(0, COUNT);
  const articleCards = buildArticleSection(
    selectedArticles
  );

  const articleSection = [
    "<!-- ARTICLES:START -->",
    articleCards,
    '<p align="right">',
    `<a href="https://dev.to/${USERNAME}"><strong>View all articles on DEV.to →</strong></a>`,
    "</p>",
    "<!-- ARTICLES:END -->",
  ].join("\n");

  if (!fs.existsSync(README_PATH)) {
    throw new Error(
      `${README_PATH} was not found in the current directory.`
    );
  }

  const readme = fs.readFileSync(
    README_PATH,
    "utf8"
  );

  const markerPattern =
    /<!-- ARTICLES:START -->[\s\S]*?<!-- ARTICLES:END -->/;

  if (!markerPattern.test(readme)) {
    throw new Error(
      "Article markers were not found in README.md.\n\n" +
        "Add these markers where the articles should appear:\n\n" +
        "<!-- ARTICLES:START -->\n" +
        "<!-- ARTICLES:END -->"
    );
  }

  const updatedReadme = readme.replace(
    markerPattern,
    articleSection
  );

  if (updatedReadme === readme) {
    console.log(
      "No article changes detected. README unchanged."
    );
    return;
  }

  fs.writeFileSync(
    README_PATH,
    updatedReadme,
    "utf8"
  );

  console.log(
    `✅ Wrote ${selectedArticles.length} ` +
      `responsive article card(s) to ${README_PATH}`
  );
}

updateReadme().catch((error) => {
  console.error("❌ Failed to update README.md");
  console.error(error.message);
  process.exitCode = 1;
});
