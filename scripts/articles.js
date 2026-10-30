const fs = require("fs");

const USERNAME = "francistrdev";
const COUNT = 3;
const README_PATH = "README.md";
const MAX_TITLE_LENGTH = 62;

const PLACEHOLDER =
  "https://raw.githubusercontent.com/github/explore/main/topics/devto/devto.png";

/**
 * Normalizes the cover image URL.
 * dev.to cover images commonly contain width and height parameters.
 */
function imageUrl(url) {
  if (!url) {
    return PLACEHOLDER;
  }

  return url.replace(
    /width=\d+,height=\d+/,
    "width=600,height=300"
  );
}

/**
 * Escapes text before inserting it into generated HTML.
 */
function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Shortens long titles so one card does not become taller
 * than the other cards.
 */
function truncateTitle(title, maxLength = MAX_TITLE_LENGTH) {
  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length <= maxLength) {
    return normalizedTitle;
  }

  const shortenedTitle = normalizedTitle.slice(0, maxLength - 1);
  const lastSpace = shortenedTitle.lastIndexOf(" ");

  // Avoid cutting through the middle of a word when possible.
  if (lastSpace >= Math.floor(maxLength * 0.65)) {
    return `${shortenedTitle.slice(0, lastSpace).trimEnd()}…`;
  }

  return `${shortenedTitle.trimEnd()}…`;
}

/**
 * Creates one GitHub-compatible article card.
 *
 * A nested table reserves matching sections for:
 * 1. Cover image
 * 2. Article title
 * 3. Publication details
 * 4. Reactions and comments
 */
function articleCard(article) {
  const articleUrl = escapeHtml(article.url);
  const coverImage = escapeHtml(imageUrl(article.cover_image));

  const fullTitle = escapeHtml(article.title);
  const displayTitle = escapeHtml(
    truncateTitle(article.title)
  );

  const publishDate = escapeHtml(
    article.readable_publish_date
  );

  const readingTime =
    Number(article.reading_time_minutes) || 0;

  const reactions =
    Number(article.public_reactions_count) || 0;

  const comments =
    Number(article.comments_count) || 0;

  return `
    <td align="center" valign="top" width="33%">
      <table
        width="100%"
        cellpadding="8"
        cellspacing="0"
      >
        <tr>
          <td
            align="center"
            valign="middle"
            height="170"
          >
            <a href="${articleUrl}">
              <img
                src="${coverImage}"
                alt="${fullTitle}"
                width="300"
                height="150"
              />
            </a>
          </td>
        </tr>

        <tr>
          <td
            align="center"
            valign="top"
            height="76"
          >
            <strong>
              <a
                href="${articleUrl}"
                title="${fullTitle}"
              >
                ${displayTitle}
              </a>
            </strong>
          </td>
        </tr>

        <tr>
          <td
            align="center"
            valign="middle"
            height="28"
          >
            <sub>
              📅 ${publishDate}
              &nbsp;&bull;&nbsp;
              ⏱️ ${readingTime} min read
            </sub>
          </td>
        </tr>

        <tr>
          <td
            align="center"
            valign="middle"
            height="28"
          >
            <sub>
              ❤️ ${reactions}
              &nbsp;&bull;&nbsp;
              💬 ${comments}
            </sub>
          </td>
        </tr>
      </table>
    </td>`.trim();
}

/**
 * Retrieves the latest articles and updates README.md.
 */
async function updateReadme() {
  const apiUrl =
    `https://dev.to/api/articles?username=${encodeURIComponent(USERNAME)}` +
    `&per_page=${COUNT}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.forem.api-v1+json",
      "User-Agent": `${USERNAME}-github-readme`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `dev.to API request failed: ` +
      `${response.status} ${response.statusText}`
    );
  }

  const articles = await response.json();

  if (!Array.isArray(articles) || articles.length === 0) {
    console.log("No articles found. README unchanged.");
    return;
  }

  const cards = articles
    .slice(0, COUNT)
    .map(articleCard)
    .join("\n\n");

  const articleSection = `<!-- ARTICLES:START -->

## 📝 Latest dev.to Articles

<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
${cards}
  </tr>
</table>

<p align="right">
  <a href="https://dev.to/${USERNAME}">
    <strong>View all articles on dev.to →</strong>
  </a>
</p>

<!-- ARTICLES:END -->`;

  if (!fs.existsSync(README_PATH)) {
    throw new Error(
      `${README_PATH} was not found in the current directory.`
    );
  }

  const readme = fs.readFileSync(README_PATH, "utf8");

  const markerPattern =
    /<!-- ARTICLES:START -->[\s\S]*?<!-- ARTICLES:END -->/;

  if (!markerPattern.test(readme)) {
    throw new Error(
      "Article markers were not found in README.md.\n" +
      "Add the following markers where the articles should appear:\n\n" +
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
      "No changes detected. README unchanged."
    );
    return;
  }

  fs.writeFileSync(
    README_PATH,
    updatedReadme,
    "utf8"
  );

  console.log(
    `✅ Wrote ${Math.min(articles.length, COUNT)} ` +
    `article card(s) to ${README_PATH}`
  );
}

updateReadme().catch((error) => {
  console.error("❌ Failed to update README.md");
  console.error(error.message);
  process.exitCode = 1;
});
