import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zenith — Life OS',
    short_name: 'Zenith',
    description: 'منصة إنتاجية متكاملة — تخطيط، معرفة، تركيز، عادات، وذكاء اصطناعي بدون paywall.',
    start_url: '/',
    display: 'standalone',
    /** Phase 00 invariant: theme_color & background_color MUST be #0a0a0a */
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'any',
    scope: '/',
    lang: 'ar',
    dir: 'rtl',
    categories: ['productivity', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'اليوم',
        short_name: 'Today',
        description: 'افتح عرض اليوم',
        url: '/today',
        icons: [{ src: '/icons/shortcut-today.png', sizes: '96x96' }],
      },
      {
        name: 'الملاحظات',
        short_name: 'Notes',
        description: 'افتح الملاحظات',
        url: '/notes',
        icons: [{ src: '/icons/shortcut-notes.png', sizes: '96x96' }],
      },
      {
        name: 'المهام',
        short_name: 'Tasks',
        description: 'افتح المهام',
        url: '/tasks',
        icons: [{ src: '/icons/shortcut-tasks.png', sizes: '96x96' }],
      },
    ],
  };
}
