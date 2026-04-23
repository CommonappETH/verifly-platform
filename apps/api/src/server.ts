import { createApp } from "./app";
import { loadEnv } from "./platform/local/secrets";

const env = loadEnv();
const port = Number(env.PORT);
const app = createApp({ env: env.APP_ENV, version: process.env.VERSION });

Bun.serve({ fetch: app.fetch, port });

console.log(`listening on :${port}`);
