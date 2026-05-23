import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Font loading (Edge friendly)
const pretendardBold = fetch(
  new URL('../../../public/fonts/Pretendard-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const pretendardRegular = fetch(
  new URL('../../../public/fonts/Pretendard-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataString = searchParams.get('data');
    if (!dataString) {
      return new Response('Missing data parameter', { status: 400 });
    }

    const { templateId, data } = JSON.parse(decodeURIComponent(Buffer.from(dataString, 'base64').toString('utf-8')));

    const fontBold = await pretendardBold;
    const fontRegular = await pretendardRegular;

    let content;

    // Satori-compatible simplified templates for OG Image
    if (templateId === 'impact') {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '1080px', height: '1080px', background: 'linear-gradient(to bottom right, #2563eb, #1e40af)', alignItems: 'center', justifyContent: 'center', padding: '120px', color: 'white', fontFamily: 'Pretendard' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '72px', fontWeight: 700, lineHeight: 1.2, marginBottom: '60px' }}>
              {data.key.split('\\n').map((line: string, i: number) => (
                <div key={i} style={{ display: 'flex' }}>{line}</div>
              ))}
            </div>
            
            <div style={{ fontSize: '36px', fontWeight: 700, opacity: 0.9, marginBottom: '80px', display: 'flex' }}>
              {data.question}
            </div>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {data.implementation.map((item: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.2)', padding: '24px 36px', borderRadius: '16px', border: '2px solid rgba(255,255,255,0.3)', fontSize: '28px', fontWeight: 700 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (templateId === 'list') {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '1080px', height: '1080px', backgroundColor: 'white', padding: '100px', fontFamily: 'Pretendard' }}>
          <div style={{ display: 'flex', borderBottom: '6px solid #2563eb', paddingBottom: '30px', marginBottom: '50px' }}>
            <div style={{ fontSize: '56px', fontWeight: 700, color: '#0f172a' }}>{data.key}</div>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#eff6ff', borderRadius: '24px', padding: '40px', marginBottom: '60px', borderLeft: '12px solid #2563eb' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e3a8a' }}>{data.question}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '60px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>핵심 내용</div>
            <div style={{ fontSize: '28px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.character}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '30px' }}>실행 방법</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {data.implementation.map((item: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 700, borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: '28px', color: '#334155', paddingTop: '8px' }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (templateId === 'story') {
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '1080px', height: '1080px', background: 'linear-gradient(to bottom, #0f172a, #1e293b)', padding: '100px', color: 'white', fontFamily: 'Pretendard', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '12px 30px', borderRadius: '30px', fontSize: '24px', fontWeight: 700, alignSelf: 'flex-start', marginBottom: '40px' }}>Story</div>
            <div style={{ fontSize: '64px', fontWeight: 700, lineHeight: 1.3 }}>{data.key}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '30px', color: '#93c5fd' }}>어떻게 되나요?</div>
            <div style={{ fontSize: '32px', color: '#cbd5e1', lineHeight: 1.6 }}>{data.character}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '2px solid #334155', paddingTop: '40px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#93c5fd', marginBottom: '20px' }}>핵심 질문</div>
            <div style={{ fontSize: '40px', fontWeight: 700, marginBottom: '30px' }}>{data.question}</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              {data.implementation.map((item: string, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#334155', padding: '16px 30px', borderRadius: '40px', fontSize: '24px', fontWeight: 700 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      content = (
         <div style={{ display: 'flex', flexDirection: 'column', width: '1080px', height: '1080px', backgroundColor: 'white', fontFamily: 'Pretendard' }}>
          <div style={{ display: 'flex', background: 'linear-gradient(to right, #ef4444, #2563eb)', color: 'white', padding: '60px 80px', fontSize: '48px', fontWeight: 700 }}>
            {data.key}
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
             <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#fef2f2', padding: '80px', justifyContent: 'center', borderRight: '2px solid #fecaca' }}>
                <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 30px', borderRadius: '30px', fontWeight: 700, alignSelf: 'center', marginBottom: '40px', fontSize: '28px' }}>Before</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#7f1d1d', marginBottom: '40px', textAlign: 'center' }}>{data.character.split('\\n')[0]}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {data.implementation.slice(0, 2).map((item: string, idx: number) => (
                     <div key={idx} style={{ display: 'flex', fontSize: '24px', color: '#991b1b', gap: '16px' }}>
                       <span style={{ color: '#dc2626', fontWeight: 700 }}>X</span> {item}
                     </div>
                   ))}
                </div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#eff6ff', padding: '80px', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '12px 30px', borderRadius: '30px', fontWeight: 700, alignSelf: 'center', marginBottom: '40px', fontSize: '28px' }}>After</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#1e3a8a', marginBottom: '40px', textAlign: 'center' }}>{data.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {data.implementation.map((item: string, idx: number) => (
                     <div key={idx} style={{ display: 'flex', fontSize: '24px', color: '#1e40af', gap: '16px' }}>
                       <span style={{ color: '#2563eb', fontWeight: 700 }}>O</span> {item}
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      );
    }

    return new ImageResponse(content, {
      width: 1080,
      height: 1080,
      fonts: [
        {
          name: 'Pretendard',
          data: fontRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Pretendard',
          data: fontBold,
          style: 'normal',
          weight: 700,
        },
      ],
    });

  } catch (error) {
    console.error('OG Image Generation Error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
