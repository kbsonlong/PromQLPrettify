import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

// 导入 highlight.js 核心库和 Vue 插件
import hljs from 'highlight.js/lib/core'
import hljsVuePlugin from '@highlightjs/vue-plugin'

// 注册常用语言
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import sql from 'highlight.js/lib/languages/sql'

// 导入自定义 PromQL 语言定义
import promqlLanguage from './utils/promql-language'

// 注册语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('promql', promqlLanguage)

const app = createApp(App)
app.use(hljsVuePlugin)
app.mount('#app')