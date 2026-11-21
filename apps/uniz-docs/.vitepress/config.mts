import { defineConfig } from 'vitepress'

const SITE = 'https://api-uniz.rguktong.in/docs'
const OG_IMAGE = `${SITE}/og.png`

export default defineConfig({
  title: 'uniZ',
  description: 'uniZ system documentation — architecture, services, deploy, APIs',
  base: '/docs/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/docs/favicon-32.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/docs/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/docs/manifest.webmanifest' }],
    ['meta', { name: 'theme-color', content: '#0b1b3a' }],
    ['meta', { property: 'og:site_name', content: 'uniZ Docs' }],
    ['meta', { property: 'og:locale', content: 'en_IN' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { property: 'og:image:alt', content: 'uniZ Docs — RGUKT Ongole' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
  ],
  transformHead(context) {
    const pageTitle = context.pageData.title
      ? `${context.pageData.title} | uniZ`
      : 'uniZ Docs'
    const description =
      context.pageData.description ||
      'uniZ system documentation — architecture, services, deploy, APIs'
    const relative = context.pageData.relativePath
      .replace(/\.md$/, '')
      .replace(/(^|\/)index$/, '')
      .replace(/\/$/, '')
    const url = relative ? `${SITE}/${relative}` : `${SITE}/`
    return [
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: description }],
      ['link', { rel: 'canonical', href: url }],
    ]
  },
  cleanUrls: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/node_modules/**', 'README.md', 'AGENTS.md', 'CONTRIBUTING.md', '_sidebar.md'],
  themeConfig: {
    logo: {
      light: "/logo.svg",
      dark: "/logo-white.svg",
    },
    nav: [
      { text: 'Documentation', link: '/' },
      { text: 'API Reference', link: '/api/platform/gateway' },
      {
        text: 'GitHub',
        link: 'https://github.com/uniz-rguktong/uniz-master',
      },
    ],
    search: { provider: 'local' },
    sidebar: {
      '/': [
        {
          text: 'Get Started',
          items: [
            { text: 'Introduction', link: '/introduction' },
            { text: 'Quick Start', link: '/quickstart' },
            { text: 'Roles', link: '/roles' },
            { text: 'Search index', link: '/search-index' },
          ],
        },
        {
          text: 'System Architecture',
          items: [
            { text: 'System overview', link: '/system/overview' },
            { text: 'Production topology', link: '/system/topology' },
            { text: 'Request flow', link: '/system/request-flow' },
            { text: 'Action flows', link: '/system/action-flows' },
            { text: 'Data stores', link: '/system/data-stores' },
            { text: 'Security model', link: '/system/security' },
          ],
        },
        {
          text: 'Services',
          items: [
            { text: 'Gateway', link: '/services/gateway' },
            { text: 'Auth service', link: '/services/auth' },
            { text: 'User service', link: '/services/user' },
            { text: 'Academics service', link: '/services/academics' },
            { text: 'Notifications', link: '/services/notifications' },
            { text: 'Landing', link: '/services/landing' },
            { text: 'Docs service (VitePress)', link: '/services/docs' },
            { text: 'Parked & folded', link: '/services/parked' },
          ],
        },
        {
          text: 'Deploy & Ops',
          items: [
            { text: 'VPS deploy', link: '/ops/deploy' },
            { text: 'Cloudflare Pages', link: '/ops/cloudflare-pages' },
            { text: 'Feature flags', link: '/ops/feature-flags' },
            { text: 'Runbooks', link: '/ops/runbooks' },
            { text: 'Health', link: '/health' },
          ],
        },
        {
          text: 'How it works / How to change',
          items: [
            { text: 'Find anything', link: '/howto/find-anything' },
            { text: 'Add an API route', link: '/howto/add-api-route' },
            { text: 'Change frontend', link: '/howto/change-frontend' },
            { text: 'Database migrations', link: '/howto/database-migrations' },
            { text: 'Scale and HPA', link: '/howto/scale-and-hpa' },
            { text: 'Revive outpass', link: '/howto/revive-outpass' },
          ],
        },
        {
          text: 'Student Guide',
          items: [
            { text: 'Login', link: '/students/login' },
            { text: 'Academics', link: '/students/academics' },
            { text: 'Profile', link: '/students/profile' },
            { text: 'Outpass', link: '/students/outpass' },
          ],
        },
        {
          text: 'Admin Guide',
          items: [
            { text: 'Overview', link: '/admin/overview' },
            { text: 'Approvals', link: '/admin/approvals' },
            { text: 'Semester registration', link: '/admin/semester-registration' },
            { text: 'Academics', link: '/admin/academics' },
            { text: 'Security', link: '/admin/security' },
          ],
        },
        {
          text: 'Faculty Guide',
          items: [
            { text: 'Grades', link: '/faculty/grades' },
            { text: 'Attendance', link: '/faculty/attendance' },
          ],
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Gateway map', link: '/api/platform/gateway' },
            { text: 'Health', link: '/api/platform/health' },
            { text: 'Auth login', link: '/api/auth/login' },
            { text: 'Auth OTP', link: '/api/auth/otp' },
            { text: 'Auth password', link: '/api/auth/password' },
            { text: 'Grades', link: '/api/academics/grades' },
            { text: 'Attendance', link: '/api/academics/attendance' },
            { text: 'Subjects', link: '/api/academics/subjects' },
            { text: 'Registration', link: '/api/academics/registration' },
            { text: 'Student profile', link: '/api/profile/student' },
            { text: 'Faculty profile', link: '/api/profile/faculty' },
            { text: 'Admin profile', link: '/api/profile/admin' },
            { text: 'CMS notices', link: '/api/cms/notices' },
            { text: 'Notifications', link: '/api/comms/notifications' },
            { text: 'Mail', link: '/api/comms/mail' },
            { text: 'Files', link: '/api/comms/files' },
            { text: 'Grievances', link: '/api/requests/grievances' },
            { text: 'Outpass', link: '/api/requests/outpass' },
            { text: 'Outing', link: '/api/requests/outing' },
            { text: 'Approvals', link: '/api/requests/approvals' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/uniz-rguktong/uniz-master' },
    ],
  },
  markdown: {
    config(md) {
      const defaultFence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`
        }
        return defaultFence(tokens, idx, options, env, self)
      }
    },
  },
})
