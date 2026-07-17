import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import mermaid from 'mermaid'
import './custom.css'

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    const render = async () => {
      await nextTick()
      try {
        await mermaid.run({ querySelector: '.mermaid' })
      } catch {
        /* ignore partial diagrams during HMR */
      }
    }
    onMounted(() => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
      })
      render()
    })
    watch(() => route.path, () => render())
  },
}
