import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

// The recovery drill went red on 2026-11-15 when ubuntu-latest moved to
// Ubuntu 26.04: the runner's own pg_dump was newer than the postgres:16
// service, so the dump carried `SET transaction_timeout` and pg_restore
// against 16 rejected it. These tests hold the two invariants that fix it.

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

const CLIENT_BINARIES = ['psql', 'pg_dump', 'pg_restore', 'createdb', 'dropdb'];

function productionMajor() {
  const match = read('docs/10-operations/backup-recovery.md').match(
    /Production runs PostgreSQL (\d+)/,
  );
  assert.ok(match, 'backup-recovery.md must state "Production runs PostgreSQL <major>"');
  return Number(match[1]);
}

function postgresServiceImages() {
  const dir = new URL('.github/workflows/', root);
  const images = [];
  for (const name of readdirSync(dir).filter((file) => /\.ya?ml$/.test(file))) {
    for (const match of read(`.github/workflows/${name}`).matchAll(
      /^\s*image:\s*["']?postgres:([^\s"']+)/gm,
    )) {
      images.push({ workflow: name, tag: match[1] });
    }
  }
  return images;
}

export function hostClientInvocations(workflowText) {
  const pattern = new RegExp(`(^|[\\s;&|(\`"$])(${CLIENT_BINARIES.join('|')})(?=\\s|$)`);
  return workflowText
    .split('\n')
    .map((line, index) => ({ line: line.replace(/(^|\s)#.*$/, ''), number: index + 1 }))
    .filter(({ line }) => pattern.test(line) && !/\bdocker exec\b/.test(line));
}

test('every Postgres service container runs the production major version', () => {
  const major = productionMajor();
  const images = postgresServiceImages();
  assert.ok(images.length > 0, 'no postgres service images found; the check examined nothing');
  for (const { workflow, tag } of images) {
    assert.equal(
      Number.parseInt(tag, 10),
      major,
      `${workflow} uses postgres:${tag}; production runs PostgreSQL ${major}`,
    );
  }
});

test('the recovery drill runs Postgres client tools inside the service container', () => {
  const drill = read('.github/workflows/recovery-drill.yml');
  assert.match(drill, /docker exec/, 'the drill must invoke client tools through docker exec');
  assert.deepEqual(
    hostClientInvocations(drill),
    [],
    'a host-installed client follows the runner image, not the server, and can emit settings the server rejects',
  );
});

test('the host-invocation detector catches the forms that broke the drill', () => {
  const broken = [
    'run: pg_dump "$POSTGRES_URL" --format=custom',
    '  pg_restore \\',
    'createdb --host=localhost pathfinder_restore',
    'run: test "$(psql postgres://x --tuples-only)" = "0"',
  ].join('\n');
  assert.equal(hostClientInvocations(broken).length, 4);
  assert.deepEqual(
    hostClientInvocations('run: docker exec "$PG" pg_dump -U postgres # pg_restore later'),
    [],
  );
});
