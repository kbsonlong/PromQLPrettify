<template>
  <div class="main-container">
    <!-- 头部 -->
    <header class="main-header">
      <h1>PromQL Online Prettifier</h1>
      <p>让您的PromQL和MetricsQL查询更加美观易读</p>
    </header>
    
    <!-- 主题选择器 -->
    <div class="theme-selector-container">
      <ThemeSelector />
    </div>
    
    <!-- 主要内容区域 -->
    <main class="interactive-area">
      <!-- 输入区域 -->
      <div class="interactive-block">
        <PromqlEditor 
          v-model="rawInput" 
          @update:modelValue="handleInputChange"
        />
      </div>
      
      <!-- 输出区域 -->
      <div class="interactive-block">
        <PrettierOutput 
          :content="prettierOutput" 
          :error="formatError"
          :format-time="formatTime"
        />
      </div>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <p>
        <a href="https://github.com/kbsonlong/PromQLPrettify" target="_blank" rel="noopener">
          GitHub
        </a> | 
        <a href="https://prometheus.io/docs/prometheus/latest/querying/basics/" target="_blank" rel="noopener">
          PromQL文档
        </a> | 
        <a href="https://docs.victoriametrics.com/metricsql/" target="_blank" rel="noopener">
          MetricsQL文档
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import PromqlEditor from './components/PromqlEditor.vue'
import PrettierOutput from './components/PrettierOutput.vue'
import ThemeSelector from './components/ThemeSelector.vue'
import { formatPromQL, validatePromQL, FormatMode } from './utils/promql-prettier'

// 应用状态
const rawInput = ref('')
const prettierOutput = ref('')
const formatError = ref<string | null>(null)
const formatTime = ref<number | undefined>(undefined)

// 处理输入变化
const handleInputChange = (input: string) => {
  rawInput.value = input
}

// 格式化PromQL
const formatQuery = async (query: string) => {
  const startTime = performance.now()
  
  try {
    // 如果输入为空，清空输出
    if (!query || !query.trim()) {
      prettierOutput.value = ''
      formatError.value = null
      formatTime.value = undefined
      return
    }
    
    // 首先验证语法（优先使用WASM）
    const validation = await validatePromQL(query, { mode: FormatMode.WASM, fallbackToJS: true })
    if (!validation.isValid) {
      prettierOutput.value = ''
      formatError.value = validation.error
      formatTime.value = undefined
      return
    }
    
    // 执行格式化（优先使用WASM）
    const result = await formatPromQL(query, { mode: FormatMode.WASM, fallbackToJS: true })
    
    if (result.error) {
      prettierOutput.value = ''
      formatError.value = result.error
      formatTime.value = undefined
    } else {
      prettierOutput.value = result.formatted
      formatError.value = null
      formatTime.value = Math.round(performance.now() - startTime)
    }
  } catch (error) {
    console.error('格式化过程中发生错误:', error)
    prettierOutput.value = ''
    formatError.value = error instanceof Error ? error.message : '格式化时发生未知错误'
    formatTime.value = undefined
  }
}

// 监听输入变化，实时格式化
watch(rawInput, async (newInput: string) => {
  await formatQuery(newInput)
}, { immediate: true })

// 页面加载时的初始化
import { onMounted } from 'vue'

onMounted(() => {
  // 可以在这里添加一些初始化逻辑
  console.log('PromQL Prettifier 已加载')
  
  // 如果URL中有查询参数，可以自动加载
  const urlParams = new URLSearchParams(window.location.search)
  const queryParam = urlParams.get('q')
  if (queryParam) {
    try {
      const decodedQuery = decodeURIComponent(queryParam)
      rawInput.value = decodedQuery
    } catch (error) {
      console.warn('无法解析URL查询参数:', error)
    }
  }
})

// 错误处理
const handleError = (error: Error) => {
  console.error('应用错误:', error)
  formatError.value = '应用发生错误，请刷新页面重试'
}

// 全局错误处理
window.addEventListener('error', (event) => {
  handleError(new Error(event.message))
})

window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason))
})
</script>

<style>
/* 全局样式已在 main.css 中定义 */

/* 组件特定样式 */
.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  padding: 20px;
  text-align: center;
  background: linear-gradient(135deg, #764abc 0%, #5a3a9a 100%);
  color: #ffffff;
  font-size: 28px;
  font-weight: 700;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(118, 74, 188, 0.3);
  margin-bottom: 20px;
}

.main-header h1 {
  margin: 0;
  font-size: inherit;
}

.main-header p {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

.theme-selector-container {
  padding: 0 20px;
  margin-bottom: 10px;
}

.interactive-area {
  display: flex;
  gap: 20px;
  padding: 0 20px;
  flex: 1;
  min-height: 0;
}

.interactive-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}

.footer {
  margin-top: 40px;
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #e1e5e9;
}

.footer a {
  color: #764abc;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interactive-area {
    flex-direction: column;
    padding: 0 16px;
  }
  
  .main-header {
    font-size: 24px;
    padding: 16px;
  }
  
  .main-header p {
    font-size: 14px;
  }
  
  .interactive-block {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .main-header {
    font-size: 20px;
    padding: 12px;
  }
  
  .interactive-area {
    padding: 0 12px;
  }
}

/* 加载动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-container {
  animation: fadeIn 0.3s ease-out;
}

/* 焦点管理 */
.interactive-area:focus-within .interactive-block:not(:focus-within) {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

/* 打印样式 */
@media print {
  .main-header,
  .footer {
    display: none;
  }
  
  .interactive-area {
    flex-direction: column;
    gap: 10px;
  }
  
  .interactive-block {
    break-inside: avoid;
  }
}
</style>