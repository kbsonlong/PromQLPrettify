<template>
  <div class="prettier-output">
    <div class="output-header">
      <h3 class="output-title">格式化结果</h3>
      <div class="output-actions">
        <CopyButton 
          :content="formattedContent" 
          :disabled="!formattedContent || hasError"
        />
      </div>
    </div>
    
    <div class="output-container">
      <!-- 正常输出 -->
      <div v-if="!hasError && formattedContent" class="success-output">
        <pre class="code-pre">{{ formattedContent }}</pre>
      </div>
      
      <!-- 错误输出 -->
      <div v-else-if="hasError" class="error-container">
        <div class="error-header">
          <span class="error-icon">⚠️</span>
          <span class="error-title">格式化错误</span>
        </div>
        <pre class="error-message">{{ errorMessage }}</pre>
        <div class="error-help">
          <p>常见问题：</p>
          <ul>
            <li>检查括号是否匹配</li>
            <li>检查引号是否正确闭合</li>
            <li>确认函数名称拼写正确</li>
            <li>验证操作符使用是否正确</li>
          </ul>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-title">等待输入</p>
        <p class="empty-description">
          在左侧输入框中粘贴您的PromQL或MetricsQL查询语句，<br>
          格式化结果将在这里实时显示。
        </p>
        <div class="empty-tips">
          <h4>支持的查询类型：</h4>
          <ul>
            <li><strong>PromQL</strong> - Prometheus查询语言</li>
            <li><strong>MetricsQL</strong> - VictoriaMetrics查询语言</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- 输出信息 -->
    <div v-if="formattedContent && !hasError" class="output-info">
      <span class="output-stats">
        {{ lineCount }} 行，{{ charCount }} 字符
      </span>
      <span class="format-time" v-if="formatTime">
        格式化耗时: {{ formatTime }}ms
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from './CopyButton.vue'

// 组件属性
interface Props {
  content: string
  error: string | null
  formatTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  formatTime: undefined
})

// 计算属性
const hasError = computed(() => {
  return !!props.error
})

const formattedContent = computed(() => {
  return hasError.value ? '' : props.content
})

const errorMessage = computed(() => {
  return props.error || ''
})

const lineCount = computed(() => {
  return formattedContent.value ? formattedContent.value.split('\n').length : 0
})

const charCount = computed(() => {
  return formattedContent.value ? formattedContent.value.length : 0
})
</script>

<style scoped>
.prettier-output {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.output-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.output-actions {
  display: flex;
  gap: 8px;
}

/* 输出容器 */
.output-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background-color: #ffffff;
  overflow: hidden;
  min-height: 400px;
}

/* 成功输出 */
.success-output {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.code-pre {
  flex: 1;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow: auto;
  white-space: pre;
  margin: 0;
  tab-size: 2;
}

/* 语法高亮样式 */
.code-pre {
  /* PromQL关键字 */
  --keyword-color: #569cd6;
  /* 函数名 */
  --function-color: #dcdcaa;
  /* 字符串 */
  --string-color: #ce9178;
  /* 数字 */
  --number-color: #b5cea8;
  /* 操作符 */
  --operator-color: #d4d4d4;
  /* 注释 */
  --comment-color: #6a9955;
}

/* 错误容器 */
.error-container {
  flex: 1;
  padding: 16px;
  background-color: #fef2f2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 18px;
}

.error-title {
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
}

.error-message {
  color: #991b1b;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  margin: 0;
  padding: 12px;
  background: #fee2e2;
  border-radius: 4px;
  border-left: 4px solid #ef4444;
}

.error-help {
  color: #7f1d1d;
  font-size: 13px;
}

.error-help p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.error-help ul {
  margin: 0;
  padding-left: 20px;
}

.error-help li {
  margin-bottom: 4px;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 24px 0;
  max-width: 300px;
}

.empty-tips {
  text-align: left;
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.empty-tips h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
}

.empty-tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
}

.empty-tips li {
  margin-bottom: 4px;
}

.empty-tips strong {
  color: #764abc;
}

/* 输出信息 */
.output-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
  font-size: 12px;
  color: #6b7280;
}

.output-stats,
.format-time {
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
}

.format-time {
  color: #10b981;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .output-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .output-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .output-container {
    min-height: 250px;
  }
  
  .code-pre {
    font-size: 13px;
    padding: 12px;
  }
  
  .error-container {
    padding: 12px;
  }
  
  .error-message {
    font-size: 12px;
    padding: 10px;
  }
  
  .empty-state {
    padding: 20px 16px;
  }
  
  .empty-icon {
    font-size: 36px;
  }
  
  .empty-title {
    font-size: 16px;
  }
  
  .empty-description {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .code-pre {
    font-size: 12px;
    padding: 10px;
  }
  
  .output-title {
    font-size: 14px;
  }
  
  .error-message {
    font-size: 11px;
  }
  
  .empty-tips {
    padding: 12px;
  }
}

/* 滚动条样式 */
.code-pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-pre::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.code-pre::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.code-pre::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>