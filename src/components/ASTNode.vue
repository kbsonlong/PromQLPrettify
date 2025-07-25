<template>
  <div class="ast-node" :class="`level-${level}`">
    <div class="node-header" @click="toggleExpanded">
      <span class="node-toggle" v-if="hasChildren">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span class="node-type" :class="`type-${node.type.toLowerCase()}`">
        {{ node.type }}
      </span>
      <span v-if="node.value" class="node-value">
        {{ formatValue(node.value) }}
      </span>
      <span v-if="node.operator" class="node-operator">
        {{ node.operator }}
      </span>
    </div>
    
    <div v-if="hasChildren && isExpanded" class="node-children">
      <ASTNode 
        v-for="(child, index) in node.children" 
        :key="index"
        :node="child" 
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// AST节点接口
interface ASTNodeData {
  type: string
  value?: string
  operator?: string
  children?: ASTNodeData[]
}

// 组件属性
interface Props {
  node: ASTNodeData
  level: number
}

const props = defineProps<Props>()

// 组件状态
const isExpanded = ref(true)

// 计算属性
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

// 切换展开状态
const toggleExpanded = () => {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value
  }
}

// 格式化节点值
const formatValue = (value: string) => {
  if (!value) return ''
  
  // 限制显示长度
  if (value.length > 50) {
    return value.substring(0, 47) + '...'
  }
  
  return value
}
</script>

<style scoped>
.ast-node {
  margin: 2px 0;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
  line-height: 1.4;
}

.node-header:hover {
  background-color: #f1f3f4;
}

.node-toggle {
  width: 12px;
  text-align: center;
  font-size: 10px;
  color: #666;
  user-select: none;
}

.node-type {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 不同节点类型的颜色 */
.type-metricexpr {
  background-color: #e3f2fd;
  color: #1565c0;
}

.type-binaryopexpr {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-aggrfuncexpr {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.type-funcexpr {
  background-color: #fff3e0;
  color: #ef6c00;
}

.type-rollupexpr {
  background-color: #fce4ec;
  color: #c2185b;
}

.type-number {
  background-color: #f1f8e9;
  color: #558b2f;
}

.type-string {
  background-color: #fff8e1;
  color: #f57f17;
}

.type-parentheses {
  background-color: #f5f5f5;
  color: #616161;
}

.type-unknown {
  background-color: #ffebee;
  color: #d32f2f;
}

.node-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  color: #495057;
  font-size: 12px;
  border: 1px solid #e9ecef;
}

.node-operator {
  font-weight: 700;
  color: #dc3545;
  background-color: #fff5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid #fed7d7;
}

.node-children {
  margin-left: 16px;
  border-left: 2px solid #e9ecef;
  padding-left: 8px;
  margin-top: 4px;
}

/* 不同层级的样式 */
.level-0 .node-header {
  font-weight: 600;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
}

.level-1 .node-children {
  border-left-color: #adb5bd;
}

.level-2 .node-children {
  border-left-color: #ced4da;
}

.level-3 .node-children {
  border-left-color: #dee2e6;
}

/* 深层级使用虚线 */
.level-4 .node-children,
.level-5 .node-children,
.level-6 .node-children {
  border-left-style: dashed;
  border-left-color: #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .node-header {
    font-size: 12px;
    padding: 3px 6px;
    gap: 4px;
  }
  
  .node-type {
    font-size: 10px;
    padding: 1px 4px;
  }
  
  .node-value,
  .node-operator {
    font-size: 11px;
    padding: 1px 4px;
  }
  
  .node-children {
    margin-left: 12px;
    padding-left: 6px;
  }
}

/* 动画效果 */
.node-children {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 选中状态 */
.node-header:active {
  background-color: #e9ecef;
  transform: translateY(1px);
}

/* 工具提示样式 */
.node-header[title] {
  position: relative;
}

.node-header[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 4px;
}

.node-header[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #333;
  z-index: 1000;
}
</style>