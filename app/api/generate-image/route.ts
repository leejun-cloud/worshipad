import { NextRequest, NextResponse } from 'next/server';
import playwright from 'playwright';

export async function POST(request: NextRequest) {
  let browser = null;
  
  try {
    const { html } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: '유효한 HTML이 필요합니다' },
        { status: 400 }
      );
    }

    console.log('[v0] Starting Playwright browser...');
    
    // Playwright 브라우저 초기화
    browser = await playwright.chromium.launch({
      headless: true,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // HTML 콘텐츠 설정
    await page.setContent(html, { waitUntil: 'networkidle' });

    // 1080x1080 크기로 스크린샷 캡처
    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1080 },
    });

    await context.close();
    await browser.close();

    // Base64로 인코딩하여 반환
    const base64 = screenshot.toString('base64');

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    console.error('[v0] Error in generate-image API:', error);
    if (browser) {
      await browser.close();
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : '이미지 생성 실패',
      },
      { status: 500 }
    );
  }
}
