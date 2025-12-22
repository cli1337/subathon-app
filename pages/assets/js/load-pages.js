const fs = require("fs");
const nodePath = require("path");

(function loadPagePartials() {
  try {
    const main = document.getElementById("mainContent");
    if (!main) return;

    const partialsDir = nodePath.join(__dirname, "partials");

    const pageFiles = [
      "page-dashboard.html",
      "page-platforms.html",
      "page-profiles.html",
      "page-metrics.html",
      "page-overlay.html",
      "page-reducer.html",
      "page-settings.html"
    ];

    const htmlParts = pageFiles.map((file) => {
      const fullPath = nodePath.join(partialsDir, file);
      try {
        let html = fs.readFileSync(fullPath, "utf8");
        html = html.replace(/(src|href)=["'](\.\/)?assets\//g, '$1="./assets/');
        return html;
      } catch (err) {
        console.error("[load-pages] Failed to load partial:", fullPath, err);
        return "";
      }
    });

    main.innerHTML = htmlParts.join("\n\n");
  } catch (err) {
    console.error("[load-pages] Error while loading page partials:", err);
  }
})();


