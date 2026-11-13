# insideperspective.org

Static site + one serverless function, hosted on Vercel.

## Add a new episode
1. Open `src/data.mjs`, find the episode, set `status: "live"`, add `youtubeId` (and `spotifyUrl`, `datePublished` if you have them).
2. Run `npm run build`. The episode gets its own page, a sitemap entry, a homepage card, and the "out now" count updates.

## Commands
- `npm run build`: builds the deployable site into `dist/`
- `npm run preview`: builds a private review copy into `preview/` (placeholder images, forms pretend to send)
- `npm test`: tests for the signup API

## Deploying (only when Aaliyah says go)
Pushing to `main` updates the live site. Pushing any other branch only makes a private Vercel preview link. Vercel builds automatically on every push: it runs `npm run build` and serves `dist/` (set in `vercel.json`). Images live in `static/images/`.


Check on a Vercel *preview* deployment before promoting to production:
- `/episodes`, `/episodes/<slug>`, `/guides/<id>` load; `/episodes.html?ep=0` lands on the Ep. 00 page
- Hero image loads and the network tab shows `/_vercel/image?...` returning 200 (resizing)
- Signup form on a preview URL returns "You're in" and the email appears in Kit
- `/sitemap.xml`, `/robots.txt`, and a junk URL (custom 404) all work

## Email signup
The site posts to `/api/subscribe`. The provider is chosen by the `SUBSCRIBE_PROVIDER` environment variable
(default `kit-form`, which uses the existing Kit form 9649184 with no API key). Other options: `kit-api`,
`webhook`, `mock`. To switch providers, add an adapter in `api/subscribe.js` and change the variable.
