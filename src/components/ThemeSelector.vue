<template>
  <div class="theme-selector">
    <label for="theme-select" class="theme-label">
      <span class="theme-icon">🎨</span>
      格式化结果高亮主题:
    </label>
    <select 
      id="theme-select"
      v-model="selectedTheme" 
      @change="handleThemeChange"
      class="theme-select"
    >
      <option 
        v-for="theme in themes" 
        :key="theme.value" 
        :value="theme.value"
      >
        {{ theme.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 定义主题选项
interface ThemeOption {
  value: string
  label: string
  cssFile: string
}

const themes: ThemeOption[] = [
  { value: 'atom-one-dark', label: 'Atom One Dark (深色)', cssFile: 'atom-one-dark.css' },
  { value: 'vs2015', label: 'VS2015 (深色)', cssFile: 'vs2015.css' },
  { value: 'github-dark', label: 'GitHub Dark (深色)', cssFile: 'github-dark.css' },
  { value: 'monokai', label: 'Monokai (深色)', cssFile: 'monokai.css' },
  { value: 'dracula', label: 'Dracula (深色)', cssFile: 'dracula.css' },
  { value: 'github', label: 'GitHub (浅色)', cssFile: 'github.css' },
  { value: 'default', label: 'Default (浅色)', cssFile: 'default.css' },
  { value: 'stackoverflow-light', label: 'Stack Overflow (浅色)', cssFile: 'stackoverflow-light.css' },
  { value: 'xcode', label: 'Xcode (浅色)', cssFile: 'xcode.css' },
  { value: 'intellij-light', label: 'IntelliJ (浅色)', cssFile: 'intellij-light.css' }
]

// 当前选中的主题
const selectedTheme = ref('atom-one-dark')

// 当前加载的样式元素
let currentStyleElement: HTMLLinkElement | null = null

// 加载主题样式
const loadThemeStyle = (themeName: string) => {
  const theme = themes.find(t => t.value === themeName)
  if (!theme) return

  // 移除旧的样式
  if (currentStyleElement) {
    currentStyleElement.remove()
  }

  // 创建新的样式链接
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme.cssFile}`
  link.id = 'highlight-theme'
  
  // 添加到head
  document.head.appendChild(link)
  currentStyleElement = link

  // 保存用户选择
  localStorage.setItem('promql-prettifier-theme', themeName)
}

// 处理主题变化
const handleThemeChange = () => {
  loadThemeStyle(selectedTheme.value)
}

// 组件挂载时初始化
onMounted(() => {
  // 从localStorage恢复用户选择的主题
  const savedTheme = localStorage.getItem('promql-prettifier-theme')
  if (savedTheme && themes.some(t => t.value === savedTheme)) {
    selectedTheme.value = savedTheme
  }
  
  // 加载初始主题
  loadThemeStyle(selectedTheme.value)
})
</script>

<style scoped>
.theme-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.theme-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  margin: 0;
}

.theme-icon {
  font-size: 16px;
}

.theme-select {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: #ffffff;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
}

.theme-select:hover {
  border-color: #764abc;
}

.theme-select:focus {
  outline: none;
  border-color: #764abc;
  box-shadow: 0 0 0 2px rgba(118, 74, 188, 0.2);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .theme-selector {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .theme-label {
    color: #e2e8f0;
  }
  
  .theme-select {
    background: #1a202c;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .theme-select:hover {
    border-color: #764abc;
  }
}
</style>