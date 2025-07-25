/**
 * PromQL 格式化工具
 * 基于简单的语法解析实现PromQL和MetricsQL的格式化
 */

// PromQL操作符和关键字
const OPERATORS = [
  // 算术操作符
  '+', '-', '*', '/', '%', '^',
  // 比较操作符
  '==', '!=', '>', '<', '>=', '<=',
  // 逻辑操作符
  'and', 'or', 'unless',
  // 集合操作符
  'group_left', 'group_right'
];

const FUNCTIONS = [
  'abs', 'absent', 'absent_over_time', 'avg', 'avg_over_time',
  'ceil', 'changes', 'clamp_max', 'clamp_min', 'count', 'count_over_time',
  'delta', 'deriv', 'exp', 'floor', 'histogram_quantile',
  'holt_winters', 'idelta', 'increase', 'irate', 'label_join',
  'label_replace', 'ln', 'log10', 'log2', 'max', 'max_over_time',
  'min', 'min_over_time', 'predict_linear', 'quantile', 'quantile_over_time',
  'rate', 'resets', 'round', 'scalar', 'sort', 'sort_desc',
  'sqrt', 'stddev', 'stddev_over_time', 'sum', 'sum_over_time',
  'time', 'timestamp', 'vector', 'year', 'month', 'day_of_month',
  'day_of_week', 'hour', 'minute', 'days_in_month'
];

const AGGREGATION_OPERATORS = [
  'sum', 'min', 'max', 'avg', 'group', 'stddev', 'stdvar',
  'count', 'count_values', 'bottomk', 'topk', 'quantile'
];

/**
 * 格式化PromQL查询语句
 * @param query - 原始PromQL查询字符串
 * @returns 格式化后的查询字符串和可能的错误信息
 */
export function formatPromQL(query: string): { formatted: string; error: string | null } {
  try {
    if (!query || !query.trim()) {
      return { formatted: '', error: null };
    }

    // 移除多余的空白字符
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    
    // 简单的格式化逻辑
    let formatted = cleanQuery;
    let indentLevel = 0;
    const indentSize = 2;
    
    // 处理括号和缩进
    formatted = formatBrackets(formatted);
    
    // 处理操作符周围的空格
    formatted = formatOperators(formatted);
    
    // 处理函数调用
    formatted = formatFunctions(formatted);
    
    return { formatted: formatted.trim(), error: null };
  } catch (error) {
    return {
      formatted: '',
      error: error instanceof Error ? error.message : '格式化时发生未知错误'
    };
  }
}

/**
 * 格式化括号和缩进
 */
function formatBrackets(query: string): string {
  let result = '';
  let indentLevel = 0;
  const indentSize = 2;
  let i = 0;
  
  while (i < query.length) {
    const char = query[i];
    
    if (char === '(') {
      result += char;
      indentLevel++;
      
      // 检查下一个字符，如果不是空格或换行，添加换行和缩进
      if (i + 1 < query.length && query[i + 1] !== ' ' && query[i + 1] !== '\n') {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
    } else if (char === ')') {
      indentLevel--;
      
      // 在右括号前添加换行和缩进
      if (result[result.length - 1] !== '\n' && result[result.length - 1] !== ' ') {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
      result += char;
    } else if (char === ',') {
      result += char;
      
      // 在逗号后添加换行和缩进
      if (i + 1 < query.length && query[i + 1] !== ' ' && query[i + 1] !== '\n') {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
    } else {
      result += char;
    }
    
    i++;
  }
  
  return result;
}

/**
 * 格式化操作符周围的空格
 */
function formatOperators(query: string): string {
  let result = query;
  
  // 为比较操作符添加空格
  const comparisonOps = ['==', '!=', '>=', '<=', '>', '<'];
  comparisonOps.forEach(op => {
    const regex = new RegExp(`\\s*${escapeRegex(op)}\\s*`, 'g');
    result = result.replace(regex, `\n  ${op}\n`);
  });
  
  // 为逻辑操作符添加空格
  const logicalOps = ['and', 'or', 'unless'];
  logicalOps.forEach(op => {
    const regex = new RegExp(`\\s+${op}\\s+`, 'gi');
    result = result.replace(regex, ` ${op} `);
  });
  
  return result;
}

/**
 * 格式化函数调用
 */
function formatFunctions(query: string): string {
  let result = query;
  
  // 处理聚合函数的 by 子句
  result = result.replace(/\)\s*by\s*\(/g, '\n) by(');
  result = result.replace(/\)\s*without\s*\(/g, '\n) without(');
  
  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 验证PromQL语法（简单验证）
 */
export function validatePromQL(query: string): { isValid: boolean; error: string | null } {
  try {
    if (!query || !query.trim()) {
      return { isValid: true, error: null };
    }

    // 检查括号是否匹配
    const brackets = query.match(/[()]/g) || [];
    let openCount = 0;
    
    for (const bracket of brackets) {
      if (bracket === '(') {
        openCount++;
      } else {
        openCount--;
        if (openCount < 0) {
          return { isValid: false, error: '括号不匹配：多余的右括号' };
        }
      }
    }
    
    if (openCount > 0) {
      return { isValid: false, error: '括号不匹配：缺少右括号' };
    }
    
    // 检查引号是否匹配
    const quotes = query.match(/["\']/g) || [];
    if (quotes.length % 2 !== 0) {
      return { isValid: false, error: '引号不匹配' };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : '语法验证时发生未知错误'
    };
  }
}

/**
 * 获取示例PromQL查询
 */
export function getExampleQueries(): string[] {
  return [
    'up',
    'rate(http_requests_total[5m])',
    'sum(rate(http_requests_total[5m])) by (job)',
    'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
    'count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1',
    'avg_over_time(cpu_usage_percent[1h]) > 80',
    'sum by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) * 100'
  ];
}