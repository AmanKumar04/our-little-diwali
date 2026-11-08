# Our Little Diwali ❤️

A five-scene, responsive Diwali surprise for Aman and Vanshu, with a collapsible memory timeline and an optional letter that unlocks through the existing sweets and diya interactions. It is a static site built with HTML, CSS and JavaScript, with no dependencies, backend, or external assets required at runtime.

## Publish with GitHub Pages

1. Create an empty GitHub repository for the site.
2. Copy the **contents of this folder** into the repository root. The repository root should contain `index.html`, `styles.css`, `script.js`, `assets/`, and `.github/`.
3. Commit and push the files to the `main` branch.
4. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
5. The included workflow deploys the site when changes are pushed to `main`. Open the URL shown under **Settings → Pages** after the workflow completes.

The workflow publishes the repository root as a static GitHub Pages artifact. Relative asset paths keep the image working both on a project site and a user or organization site.

## Local preview

Open `index.html` directly, or serve this folder with any static file server. There is no build step.

## Notes

- `assets/aman-vanshu-diwali-personalized.jpg` is the optimized cartoon illustration generated from Aman and Vanshu’s reference photographs. The earlier description-based artwork remains alongside it.
- Music and sound effects are synthesized in the browser with the Web Audio API. Audio starts only after the opening interaction. No third-party audio is downloaded.
- The sweets, diyas, sparkler and fireworks are drawn with inline SVG or CSS and animated with lightweight JavaScript.
- Personal copy, sweet reactions, timeline milestones, letter text and unlock thresholds are grouped in `personalization.js`.
