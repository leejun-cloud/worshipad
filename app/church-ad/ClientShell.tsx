'use client';

// Client-side mount of the editor. SSR is intentionally disabled because
// browser extensions (Grammarly / Arc / Comet) inject style attrs on the
// server-rendered HTML and trigger React 19's hydration mismatch error.
// We don't need SSR for this page anyway — Remotion Player wouldn't run on
// the server, and this is an authoring tool with no SEO surface.

import dynamic from 'next/dynamic';

const ChurchAdEditor = dynamic(
  () =>
    import('@/components/church-ad/ChurchAdEditor').then((m) => m.ChurchAdEditor),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0d12',
          color: '#a4adba',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        ⏳ 에디터 로딩 중…
      </div>
    ),
  }
);

export default function ClientShell() {
  return <ChurchAdEditor />;
}
