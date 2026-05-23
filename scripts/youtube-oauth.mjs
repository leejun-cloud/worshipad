import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env.local');
loadEnv({ path: ENV_PATH });

const PORT = 3939;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ YOUTUBE_CLIENT_ID 또는 YOUTUBE_CLIENT_SECRET 가 .env.local 에 없습니다.');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces re-issuing of refresh_token
  scope: SCOPES,
});

const openInBrowser = (url) => {
  const platform = process.platform;
  const cmd =
    platform === 'darwin' ? `open "${url}"`
    : platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) {
      console.log('⚠️ 자동으로 브라우저를 열 수 없습니다. 아래 URL을 직접 열어주세요:');
      console.log(`\n  ${url}\n`);
    }
  });
};

const updateEnvFile = async (refreshToken) => {
  const content = await readFile(ENV_PATH, 'utf-8');
  let updated;
  if (content.match(/^YOUTUBE_REFRESH_TOKEN=/m)) {
    updated = content.replace(/^YOUTUBE_REFRESH_TOKEN=.*$/m, `YOUTUBE_REFRESH_TOKEN=${refreshToken}`);
  } else {
    updated = content + `\nYOUTUBE_REFRESH_TOKEN=${refreshToken}\n`;
  }
  await writeFile(ENV_PATH, updated);
};

const respondHtml = (res, body) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>OAuth</title>
<style>body{font-family:-apple-system,sans-serif;max-width:600px;margin:80px auto;padding:24px;line-height:1.6}</style>
</head><body>${body}</body></html>`);
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎬 YouTube OAuth 2.0 인증');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`로컬 서버 포트 ${PORT}에서 콜백을 기다립니다...`);
console.log('');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    if (reqUrl.pathname !== '/oauth2callback') {
      respondHtml(res, '<h1>404</h1>');
      return;
    }

    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');
    if (error) {
      respondHtml(res, `<h1>❌ 인증 실패</h1><p>${error}</p>`);
      console.error(`❌ OAuth error: ${error}`);
      server.close();
      process.exit(1);
    }
    if (!code) {
      respondHtml(res, '<h1>❌ code 누락</h1>');
      server.close();
      process.exit(1);
    }

    console.log('✅ 인증 코드 수신');
    console.log('🔄 Refresh Token 교환 중...');
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      console.error('❌ Refresh Token이 응답에 없습니다.');
      console.error('   해결: GCP 콘솔에서 이 OAuth 클라이언트의 동의를 한 번 취소한 뒤 다시 실행하세요.');
      console.error('   취소 방법: https://myaccount.google.com/permissions 에서 해당 앱 제거');
      respondHtml(res, '<h1>❌ Refresh Token 없음</h1><p>터미널 안내를 확인하세요.</p>');
      server.close();
      process.exit(1);
    }

    await updateEnvFile(tokens.refresh_token);
    console.log('✅ .env.local 의 YOUTUBE_REFRESH_TOKEN 업데이트 완료');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 모든 인증 완료! 이제 자동 업로드 사용 가능합니다.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    respondHtml(
      res,
      `<h1>✅ YouTube 인증 완료!</h1>
       <p>이 창은 닫으셔도 됩니다. 터미널로 돌아가세요.</p>
       <p style="color:#888;font-size:14px;margin-top:32px">
         <code>YOUTUBE_REFRESH_TOKEN</code>이 .env.local에 저장되었습니다.
       </p>`
    );
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  } catch (e) {
    console.error('❌ Error:', e.message);
    respondHtml(res, `<h1>❌ 에러</h1><pre>${e.message}</pre>`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log('브라우저를 자동으로 엽니다...');
  console.log(`만약 안 열리면 이 URL을 직접 여세요:\n  ${authUrl}\n`);
  openInBrowser(authUrl);
});

setTimeout(() => {
  console.error('⏱️  5분 타임아웃 — 인증이 완료되지 않았습니다.');
  server.close();
  process.exit(1);
}, 5 * 60 * 1000);
