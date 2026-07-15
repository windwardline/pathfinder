import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';

const verifier = new URL('./verify_production_health.mjs', import.meta.url);

async function runVerifier(healthResponse) {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(healthResponse));
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, 'object');

  const child = spawn(process.execPath, [verifier.pathname], {
    env: {
      ...process.env,
      HEALTH_URL: `http://127.0.0.1:${address.port}/api/health`,
    },
  });

  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', chunk => {
    stdout += chunk;
  });
  child.stderr.setEncoding('utf8').on('data', chunk => {
    stderr += chunk;
  });

  const [exitCode] = await once(child, 'close');
  server.close();
  await once(server, 'close');

  return { exitCode, stdout, stderr };
}

test('reports ready only when the public health contract is complete', async () => {
  const result = await runVerifier({
    status: 'ready',
    checks: {
      application: true,
      database: true,
      configuration: true,
      route_engine: true,
    },
    versions: {
      application: '1.2.0',
      commit: 'abc1234',
      schema: 'release-1',
      engine: '1.2.0',
      rule_set: 'release-1',
    },
    correlation_id: '00000000-0000-4000-8000-000000000000',
  });

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).outcome, 'ready');
});

test('fails cleanly when release identity is incomplete', async () => {
  const result = await runVerifier({
    status: 'ready',
    checks: {
      application: true,
      database: true,
      configuration: true,
      route_engine: true,
    },
    versions: { application: '1.2.0' },
    correlation_id: '00000000-0000-4000-8000-000000000000',
  });

  assert.equal(result.exitCode, 1);
  assert.doesNotMatch(result.stderr, /SyntaxError/);
  assert.equal(JSON.parse(result.stderr).outcome, 'failed');
});
