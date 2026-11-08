# Our Little Diwali ❤️

A five-scene, responsive Diwali surprise for Aman and Vanshu, with a collapsible memory timeline and an optional letter that unlocks through the existing sweets and diya interactions. It is a static site built with HTML, CSS and JavaScript, with no dependencies, backend, or external assets required at runtime.

## Publish with GitHub Pages

1. Create a public GitHub repository for the site.
2. Copy the **contents of this folder** into the repository root. The repository root should contain `index.html`, `styles.css`, `script.js`, and `assets/`.
3. Commit and push the files to the `main` branch.
4. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/(root)`.
5. Share the URL shown under **Settings → Pages** after the first build completes.

GitHub Pages publishes the repository root from `main`. Relative asset paths keep the images working on a project site.

## Local preview

Open `index.html` directly, or serve this folder with any static file server. There is no build step.

## Notes

- `assets/aman-vanshu-diwali-photo.jpg` is the greeting photograph; `assets/aman-vanshu-diwali-ending.jpg` is used in the final romantic section.
- Music and sound effects are synthesized in the browser with the Web Audio API. Audio starts only after the opening interaction. No third-party audio is downloaded.
- The sweets, diyas, sparkler and fireworks are drawn with inline SVG or CSS and animated with lightweight JavaScript.
- Personal copy, sweet reactions, timeline milestones, letter text and unlock thresholds are grouped in `personalization.js`.
