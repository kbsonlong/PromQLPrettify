<template>
  <div class="promql-explainer">
    <div class="explainer-header">
      <h3 class="explainer-title">PromQL 查询解释</h3>
      <div class="explainer-actions">
        <button 
          class="explain-button"
          @click="explainQuery"
          :disabled="!query || isExplaining"
          :title="!query ? '请先输入查询' : '解释查询'"
        >
          {{ isExplaining ? '🔄 解释中...' : '🔍 解释查询' }}
        </button>
      </div>
    </div>
    
    <!-- 解释结果 -->
    <div v-if="explainResult" class="explain-content">
      <!-- 错误信息 -->
      <div v-if="!explainResult.success" class="explain-error">
        <h4>❌ 解释失败</h4>
        <p>{{ explainResult.error }}</p>
      </div>
      
      <!-- 成功结果 -->
      <div v-else class="explain-success">
        <!-- AST 可视化 -->
        <div class="explain-section">
          <h4 class="section-title">🌳 查询结构 (AST)</h4>
          <div class="ast-container">
            <ASTNode :node="explainResult.ast" :level="0" />
          </div>
        </div>
        
        <!-- 执行计划 -->
        <div class="explain-section">
          <h4 class="section-title">⚡ 执行计划</h4>
          <div class="execution-plan">
            <div 
              v-for="step in explainResult.execution" 
              :key="step.step"
              class="execution-step"
              :class="`cost-${step.cost}`"
            >
              <div class="step-number">{{ step.step }}</div>
              <div class="step-content">
                <div class="step-operation">{{ step.operation }}</div>
                <div class="step-description">{{ step.description }}</div>
              </div>
              <div class="step-cost" :title="`执行成本: ${step.cost}`">
                {{ getCostIcon(step.cost) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 性能分析 -->
        <div class="explain-section">
          <h4 class="section-title">📊 性能分析</h4>
          <div class="performance-analysis">
            <div class="performance-metrics">
              <div class="metric">
                <span class="metric-label">复杂度:</span>
                <span class="metric-value" :class="`complexity-${explainResult.performance.complexity}`">
                  {{ explainResult.performance.complexity }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">时间范围:</span>
                <span class="metric-value">{{ explainResult.performance.timeRange }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">基数:</span>
                <span class="metric-value">{{ explainResult.performance.cardinality }}</span>
              </div>
            </div>
            
            <!-- 瓶颈警告 -->
            <div v-if="explainResult.performance.bottlenecks?.length" class="bottlenecks">
              <h5>⚠️ 潜在瓶颈</h5>
              <ul>
                <li v-for="bottleneck in explainResult.performance.bottlenecks" :key="bottleneck">
                  {{ bottleneck }}
                </li>
              </ul>
            </div>
            
            <!-- 优化建议 -->
            <div v-if="explainResult.performance.suggestions?.length" class="suggestions">
              <h5>💡 优化建议</h5>
              <ul>
                <li v-for="suggestion in explainResult.performance.suggestions" :key="suggestion">
                  {{ suggestion }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!isExplaining" class="explain-empty">
      <div class="empty-icon">🔍</div>
      <p>输入PromQL查询并点击"解释查询"按钮来查看详细的执行分析</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-else class="explain-loading">
      <div class="loading-spinner">🔄</div>
      <p>正在分析查询...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { explainPromQL, FormatMode } from '../utils/promql-prettier'
import ASTNode from './ASTNode.vue'

// 组件属性
interface Props {
  query: string
}

const props = defineProps<Props>()

// 组件状态
const isExplaining = ref(false)
const explainResult = ref<any>(null)

// 解释查询
const explainQuery = async () => {
  if (!props.query || !props.query.trim()) {
    return
  }
  
  isExplaining.value = true
  explainResult.value = null
  
  try {
    const result = await explainPromQL(props.query, { 
      mode: FormatMode.WASM, 
      fallbackToJS: true 
    })
    explainResult.value = result
  } catch (error) {
    console.error('解释查询失败:', error)
    explainResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '解释查询时发生未知错误'
    }
  } finally {
    isExplaining.value = false
  }
}

// 获取成本图标
const getCostIcon = (cost: string) => {
  switch (cost) {
    case '低': return '🟢'
    case '中': return '🟡'
    case '高': return '🔴'
    default: return '⚪'
  }
}

// 监听查询变化，清空结果
watch(() => props.query, () => {
  explainResult.value = null
})
</script>

<style scoped>
.promql-explainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.explainer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.explainer-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.explain-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.explain-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

.explain-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.explain-content {
  flex: 1;
  overflow-y: auto;
}

.explain-error {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  padding: 16px;
  color: #c62828;
}

.explain-error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.explain-error p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.explain-success {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.explain-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.ast-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.execution-plan {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.execution-step {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s ease;
}

.execution-step:hover {
  border-color: #adb5bd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.execution-step.cost-低 {
  border-left: 4px solid #28a745;
}

.execution-step.cost-中 {
  border-left: 4px solid #ffc107;
}

.execution-step.cost-高 {
  border-left: 4px solid #dc3545;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #6c757d;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-operation {
  font-weight: 600;
  color: #495057;
  margin-bottom: 4px;
}

.step-description {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.step-cost {
  font-size: 16px;
  margin-left: 8px;
}

.performance-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.metric {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.metric-value.complexity-低 {
  color: #28a745;
}

.metric-value.complexity-中 {
  color: #ffc107;
}

.metric-value.complexity-高 {
  color: #dc3545;
}

.bottlenecks, .suggestions {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
}

.bottlenecks h5, .suggestions h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: 600;
}

.bottlenecks h5 {
  color: #dc3545;
}

.suggestions h5 {
  color: #17a2b8;
}

.bottlenecks ul, .suggestions ul {
  margin: 0;
  padding-left: 16px;
}

.bottlenecks li, .suggestions li {
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.bottlenecks li {
  color: #721c24;
}

.suggestions li {
  color: #0c5460;
}

.explain-empty, .explain-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  flex: 1;
}

.empty-icon, .loading-spinner {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.explain-empty p, .explain-loading p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  max-width: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .explainer-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
  
  .execution-step {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .step-number {
    margin-right: 0;
  }
}
</style>