// Usage: node scripts/with-server.mjs <command...>
// Starts the API server (the natalis-server checkout next to this repository, or
// $NATALIS_SERVER_DIR; `npm run dev`) unless one already answers on
// $API_PORT (3000), then runs the given command with the terminal attached so
// Expo's interactive keys and prompts keep working. Stops the server on exit.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = process.env.API_PORT ?? '3000';
const serverDir =
  process.env.NATALIS_SERVER_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../../natalis-server');
const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('usage: with-server.mjs <command...>');
  process.exit(1);
}

const healthy = () =>
  fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(1000) })
    .then((r) => r.ok)
    .catch(() => false);

let server;
if (await healthy()) {
  console.log(`[server] already running on :${port}`);
} else if (!existsSync(serverDir)) {
  console.error(
    `[server] not found at ${serverDir}. Clone https://github.com/Al-x-R/natalis-server there, ` +
      'or set NATALIS_SERVER_DIR / EXPO_PUBLIC_API_URL. Starting the app without it.',
  );
} else {
  server = spawn('npm', ['run', 'dev'], {
    cwd: serverDir,
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true, // own process group, so the whole tree can be stopped
  });
  const prefix = (chunk) =>
    process.stdout.write(
      chunk
        .toString()
        .split('\n')
        .filter(Boolean)
        .map((l) => `[server] ${l}\n`)
        .join(''),
    );
  server.stdout.on('data', prefix);
  server.stderr.on('data', prefix);
  server.on('exit', (code) => code && console.error(`[server] exited with code ${code}`));

  for (let i = 0; i < 40 && !(await healthy()); i++) await new Promise((r) => setTimeout(r, 250));
  console.log((await healthy()) ? `[server] ready on :${port}` : '[server] not responding yet, starting app anyway');
}

const stopServer = () => {
  if (server?.pid && server.exitCode === null) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {}
  }
};

const app = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, EXPO_PUBLIC_API_PORT: port } });
app.on('exit', (code) => {
  stopServer();
  process.exit(code ?? 0);
});
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopServer();
    app.kill(sig);
  });
}
