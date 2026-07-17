import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'UniZ',
  description: 'UniZ system documentation — architecture, services, deploy, APIs',
  base: '/docs/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/node_modules/**', 'README.md', 'AGENTS.md', 'CONTRIBUTING.md', '_sidebar.md'],
  themeConfig: {
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
