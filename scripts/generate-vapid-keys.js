#!/usr/bin/env node
/**
 * generate-vapid-keys.js — generate a fresh VAPID keypair and write it to
 * the project's .env file (creating one if it doesn't exist).
 *
 * Run with:  node scripts/generate-vapid-keys.js
 *
 * After running, restart the backend. The new keys will be picked up and
 * Web Push will be enabled.
 */
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();
console.log('Generated VAPID keypair:');
console.log('  Public: ', keys.publicKey);
console.log('  Private:', keys.privateKey);

const envPath = path.join(__dirname, '..', '.env');
let env = '';
if (fs.existsSync(envPath)) {
  env = fs.readFileSync(envPath, 'utf8');
}

const setOrReplace = (key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm');
  const newLine = `${key}=${value}`;
  if (re.test(env)) {
    env = env.replace(re, newLine);
  } else {
    env = env.trimEnd() + '\n' + newLine + '\n';
  }
};

setOrReplace('VAPID_PUBLIC_KEY', keys.publicKey);
setOrReplace('VAPID_PRIVATE_KEY', keys.privateKey);
setOrReplace('PUSH_ENABLED', 'true');

fs.writeFileSync(envPath, env);
console.log(`\nWrote keys to ${envPath}`);
console.log('Restart the backend to enable Web Push.');
