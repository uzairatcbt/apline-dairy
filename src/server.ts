import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

// Track start time for health endpoint
process.env.STARTED_AT = Date.now().toString();

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
