const fs = require("fs");

const USERNAME = "francistrdev";
const COUNT = 3;
const PLACEHOLDER =
  "https://raw.githubusercontent.com/github/explore/main/topics/devto/devto.png";

// Resize/crop cover images consistently so all cards match
const img = (url) =>
  url
    ? url.replace(/width=\d+,height=\d+/, "width=500,height=250")
    : PLACEHOLDER;

const escapeHtml = (s = "") =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// One article "card" cell
function card(a) {
  return `    <td align="center" valign="top" width="33.33%">
      <a href="${a.url}">
        <img src="${img(a.cover_image)}" width="100%" style="border-radius:8px;" alt="${escapeHtml(a.title)}">
      </a>
      <br><br>
      <a href="${a.url}"><b>${escapeHtml(a.title)}</b></a>
      <br><br>
      <sub>📅 ${a.readable_publish_date} &nbsp;•&nbsp; ⏱️ ${a.reading_time_minutes} min read</sub>
      <br>
      <sub>❤️ ${a.public_reactions_count} &nbsp;•&nbsp; 💬 ${a.comments_count}</sub>
    </td>`;
}

(async () => {
  const res = await fetch(
    `https://dev.to/api/articles?username=${USERNAME}&per_page=${COUNT}`
  );
  if (!res.ok) throw new Error(`dev.to API error: ${res.status}`);

  const articles = await res.json();
  if (!articles.length) {
    console.log("No articles found — README unchanged.");
    return;
  }

  const cells = articles.map(card).join("\n");

  const table = `<!-- ARTICLES:START -->
<table>
  <tr>
${cells}
  </tr>
</table>

<p align="right"><a href="https://dev.to/${USERNAME}"><b>View all articles on dev.to →</b></a></p>
<!-- ARTICLES:END -->`;

  const readme = fs.readFileSync("README.md", "utf8");
  const updated = readme.replace(
    /<!-- ARTICLES:START -->[\s\S]*?<!-- ARTICLES:END -->/,
    table
  );

  if (updated === readme) {
    console.log("Markers not found or no change — README unchanged.");
    return;
  }

  fs.writeFileSync("README.md", updated);
  console.log(`✅ Wrote ${articles.length} articles to README.md`);
})();
