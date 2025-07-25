<template>
  <button 
    :class="['copy-button', { copied: isCopied }]"
    @click="handleCopy"
    :disabled="!content || isDisabled"
    :title="isCopied ? '已复制!' : '复制到剪贴板'"
  >
    <span v-if="!isCopied">📋 复制</span>
    <span v-else>✅ 已复制!</span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 组件属性
interface Props {
  content: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// 组件状态
const isCopied = ref(false)
const copyTimeout = ref<number | null>(null)

// 计算属性
const isDisabled = computed(() => {
  return props.disabled || !props.content || !props.content.trim()
})

// 复制功能
const handleCopy = async () => {
  if (isDisabled.value) return

  try {
    // 使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.content)
    } else {
      // 降级方案：使用传统的document.execCommand
      fallbackCopyTextToClipboard(props.content)
    }

    // 显示复制成功状态
    isCopied.value = true

    // 清除之前的定时器
    if (copyTimeout.value) {
      clearTimeout(copyTimeout.value)
    }

    // 2秒后重置状态
    copyTimeout.value = window.setTimeout(() => {
      isCopied.value = false
      copyTimeout.value = null
    }, 2000)

  } catch (error) {
    console.error('复制失败:', error)
    // 可以在这里添加错误提示
  }
}

// 降级复制方案
const fallbackCopyTextToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = text
  
  // 避免滚动到底部
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (!successful) {
      throw new Error('execCommand 复制失败')
    }
  } catch (error) {
    console.error('降级复制方案失败:', error)
    throw error
  } finally {
    document.body.removeChild(textArea)
  }
}

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'

onUnmounted(() => {
  if (copyTimeout.value) {
    clearTimeout(copyTimeout.value)
  }
})
</script>

<style scoped>
.copy-button {
  padding: 6px 12px;
  background: #764abc;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  min-width: 80px;
  justify-content: center;
}

.copy-button:hover:not(:disabled) {
  background: #5a3a9a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(118, 74, 188, 0.3);
}

.copy-button:active:not(:disabled) {
  transform: translateY(0);
}

.copy-button.copied {
  background: #10b981;
}

.copy-button.copied:hover {
  background: #059669;
}

.copy-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .copy-button {
    font-size: 11px;
    padding: 5px 10px;
    min-width: 70px;
  }
}
</style>