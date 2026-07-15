export const APP_VERSION = '1.2.0';
export const SCHEMA_VERSION = '0004_unknown_diamondback';

/** Safe build identity for release verification and incident correlation. */
export function releaseIdentity() {
  return {
    application: APP_VERSION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    deployment: process.env.VERCEL_DEPLOYMENT_ID ?? 'local',
    schema: SCHEMA_VERSION,
  };
}
