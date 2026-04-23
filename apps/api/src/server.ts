import { createApp } from "./app";

const port = Number(process.env.PORT ?? 8787);
const app = createApp({ env: "dev" });

Bun.serve({ fetch: app.fetch, port });

console.log(`listening on :${port}`);
