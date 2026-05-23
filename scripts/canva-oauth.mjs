// One-time Canva OAuth 2.0 PKCE flow to obtain CANVA_ACCESS_TOKEN.
// Run: npx tsx scripts/canva-oauth.mjs
// Requires: CANVA_CLIENT_ID in .env.local

import { config as loadEnv } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(__dirname, '..', '.env.local') });

const CLIENT_ID = process.env.CANVA_CLIENT_ID;
if (!CLIENT_ID) {
  console.error('❌ CANVA_CLIENT_ID is not set in .env.local');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3333/callback';
const SCOPE = 'asset:read';

// PKCE helpers
const base64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const codeVerifier = base64url(crypto.randomBytes(32));
const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
const state = base64url(crypto.randomBytes(16));

const authUrl =
  `https://www.canva.com/api/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&state=${state}` +
  `&code_challenge=${codeChallenge}` +
  `&code_challenge_method=S256`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎨 Canva OAuth 설정');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('1. Canva Developer Portal에서 앱 생성 후 Redirect URI 추가:');
console.log(`   ${REDIRECT_URI}`);
console.log('');
console.log('2. 아래 URL을 브라우저에서 열어 인증하세요:');
console.log('');
console.log(`   ${authUrl}`);
console.log('');
console.log('인증 완료되면 자동으로 토큰을 받아 .env.local에 저장합니다...');

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3333');
  if (url.pathname !== '/callback') {
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (!code || returnedState !== state) {
    res.end('Error: invalid state or missing code');
    server.close();
    return;
  }

  try {
    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      res.end(`Error: ${JSON.stringify(tokens)}`);
      server.close();
      return;
    }

    // Append to .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    let envContent = '';
    try { envContent = await readFile(envPath, 'utf-8'); } catch { /* first time */ }

    const lines = envContent.split('\n').filter((l) => !l.startsWith('CANVA_ACCESS_TOKEN=') && !l.startsWith('CANVA_REFRESH_TOKEN='));
    lines.push(`CANVA_ACCESS_TOKEN=${tokens.access_token}`);
    if (tokens.refresh_token) lines.push(`CANVA_REFRESH_TOKEN=${tokens.refresh_token}`);
    await writeFile(envPath, lines.join('\n') + '\n', 'utf-8');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>✅ Canva 인증 완료! 이 탭을 닫아도 됩니다.</h2>');
    console.log('');
    console.log('✅ 토큰 저장 완료! .env.local에 CANVA_ACCESS_TOKEN이 추가되었습니다.');
    server.close();
  } catch (err) {
    res.end(`Error: ${err.message}`);
    server.close();
  }
});

server.listen(3333, () => {
  console.log('  (콜백 서버: http://localhost:3333)');
});
