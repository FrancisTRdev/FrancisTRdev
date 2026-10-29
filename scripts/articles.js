const fs = require("fs");

const USERNAME = "francistrdev";

(async () => {
  const res = await fetch(
    `https://dev.to/api/articles?username=${USERNAME}&per_page=3`
  );
  const articles = await res.json();

  const imgRow = articles
    .map(a => `    <td><a href="${a.url}"><img src="${a.cover_image}" width="250"></a></td>`)
    .join("\n");

  const titleRow = articles
    .map(a => `    <td><a href="${a.url}">${a.title}</a></td>`)
    .join("\n");

  const table = `<table>\n  <tr>\n${imgRow}\n  </tr>\n  <tr>\n${titleRow}\n  </tr>\n</table>`;

  let readme = fs.readFileSync("README.md", "utf8");
  readme = readme.replace(
    /<!-- ARTICLES:START -->[\s\S]*<!-- ARTICLES:END -->/,
    `<!-- ARTICLES:START -->\n${table}\n<!-- ARTICLES:END -->`
  );
  fs.writeFileSync("README.md", readme);
})();
