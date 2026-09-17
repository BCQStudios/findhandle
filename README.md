# Findhandle

Astro 7 app deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/).

## Requirements

- Node.js `>=22.12.0` (even-numbered releases only; this repo pins Node 24)
- npm `>=9.6.5`

## Project structure

```text
/
├── public/
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Routes come from files in `src/pages/`. Shared UI lives in `src/layouts/` and `src/components/`. Static files that should not be processed go in `public/`.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run check`           | Type-checks `.astro` and TypeScript files        |
| `npm run build`           | Type-checks, then builds to `./dist/`            |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run deploy`          | Build and deploy to Cloudflare Workers           |
| `npm run astro ...`       | Run CLI commands like `astro add`                |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

See the [Astro getting started guide](https://docs.astro.build/en/getting-started/).
