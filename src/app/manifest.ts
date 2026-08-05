import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QTS Technology',
    short_name: 'QTS',
    description: 'Website doanh nghiệp và QTS Portal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f8fb',
    theme_color: '#071a2e',
    lang: 'vi',
  }
}
