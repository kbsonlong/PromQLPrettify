<template>
  <div class="promql-editor">
    <div class="editor-header">
      <h3 class="editor-title">输入PromQL/MetricsQL</h3>
      <div class="editor-actions">
        <button 
          class="example-button"
          @click="showExamples = !showExamples"
          :title="showExamples ? '隐藏示例' : '显示示例'"
        >
          {{ showExamples ? '隐藏示例' : '📝 示例' }}
        </button>
        <button 
          class="clear-button"
          @click="clearInput"
          :disabled="!modelValue"
          title="清空输入"
        >
          🗑️ 清空
        </button>
      </div>
    </div>
    
    <!-- 示例查询 -->
    <div v-if="showExamples" class="examples-container">
      <h4 class="examples-title">示例查询：</h4>
      <div class="examples-list">
        <button
          v-for="(example, index) in examples"
          :key="index"
          class="example-item"
          @click="loadExample(example)"
          :title="`点击加载: ${example}`"
        >
          {{ example }}
        </button>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-container">
      <textarea
        ref="textareaRef"
        class="input-textarea"
        :value="modelValue"
        @input="handleInput"
        @keydown="handleKeydown"
        placeholder="在此粘贴您的PromQL或MetricsQL查询语句...\n\n示例：\nrate(http_requests_total[5m])\nsum(rate(cpu_usage[1m])) by (instance)"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />
      
      <!-- 字符计数 -->
      <div class="input-info">
        <span class="char-count">{{ charCount }} 字符</span>
        <span v-if="lineCount > 1" class="line-count">{{ lineCount }} 行</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { getExampleQueries, FormatMode } from '../utils/promql-prettier'

// 组件属性
interface Props {
  modelValue: string
}

// 组件事件
interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件状态
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const showExamples = ref(false)
const examples = ref<string[]>([])

// 计算属性
const charCount = computed(() => {
  return props.modelValue ? props.modelValue.length : 0
})

const lineCount = computed(() => {
  return props.modelValue ? props.modelValue.split('\n').length : 1
})

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + A 全选
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault()
    const textarea = event.target as HTMLTextAreaElement
    textarea.select()
    return
  }
  
  // Ctrl/Cmd + Enter 可以触发格式化（如果需要的话）
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    // 这里可以添加快捷格式化功能
    return
  }
  
  // Tab 键插入空格而不是切换焦点
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const newValue = value.substring(0, start) + '  ' + value.substring(end)
    
    emit('update:modelValue', newValue)
    
    // 恢复光标位置
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2
    })
  }
}

// 清空输入
const clearInput = () => {
  emit('update:modelValue', '')
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 加载示例
const loadExample = (example: string) => {
  emit('update:modelValue', example)
  showExamples.value = false
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 聚焦到输入框
const focus = () => {
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 初始化示例查询
onMounted(async () => {
  try {
    // 优先使用WASM模式获取示例
    examples.value = await getExampleQueries({ mode: FormatMode.WASM, fallbackToJS: true })
  } catch (error) {
    console.error('获取示例查询失败:', error)
    // 如果失败，使用默认示例
    examples.value = [
      'up',
      'rate(http_requests_total[5m])',
      'sum(rate(http_requests_total[5m])) by (job)'
    ]
  }
})

// 暴露方法给父组件
defineExpose({
  focus
})
</script>

<style scoped>
.promql-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.example-button,
.clear-button {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-button:hover,
.clear-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.clear-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 示例容器 */
.examples-container {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.examples-title {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin: 0 0 8px 0;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.example-item {
  padding: 6px 8px;
  font-size: 12px;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #1e293b;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  word-break: break-all;
}

.example-item:hover {
  background: #764abc;
  color: white;
  border-color: #764abc;
}

/* 输入容器 */
.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.input-textarea {
  flex: 1;
  width: 100%;
  min-height: 400px;
  padding: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
  background-color: #ffffff;
  tab-size: 2;
}

.input-textarea:focus {
  border-color: #764abc;
  box-shadow: 0 0 0 3px rgba(118, 74, 188, 0.1);
}

.input-textarea::placeholder {
  color: #9ca3af;
  font-style: italic;
  line-height: 1.6;
}

/* 输入信息 */
.input-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
  font-size: 12px;
  color: #6b7280;
}

.char-count,
.line-count {
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .editor-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .input-textarea {
    min-height: 250px;
    font-size: 13px;
    padding: 12px;
  }
  
  .examples-container {
    padding: 8px;
  }
  
  .example-item {
    font-size: 11px;
    padding: 4px 6px;
  }
}

@media (max-width: 480px) {
  .input-textarea {
    font-size: 12px;
    padding: 10px;
  }
  
  .editor-title {
    font-size: 14px;
  }
  
  .example-button,
  .clear-button {
    font-size: 11px;
    padding: 3px 6px;
  }
}
</style>