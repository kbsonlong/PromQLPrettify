/**
 * PromQL 格式化工具
 * 基于简单的语法解析实现PromQL和MetricsQL的格式化
 * 支持WASM模式使用VictoriaMetrics/metricsql进行高精度格式化
 */

import WasmFormatter from './wasm-formatter';
import type { WasmFormatResult, WasmValidateResult, WasmExplainResult } from './wasm-formatter';

// WASM格式化器实例
let wasmFormatter: WasmFormatter | null = null;

/**
 * 格式化模式
 */
export enum FormatMode {
  JAVASCRIPT = 'javascript', // 使用JavaScript实现的格式化
  WASM = 'wasm'              // 使用WASM模式的格式化
}

/**
 * 格式化选项
 */
export interface FormatOptions {
  mode?: FormatMode;
  fallbackToJS?: boolean; // WASM失败时是否回退到JavaScript模式
}

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
 * @param options - 格式化选项
 * @returns 格式化后的查询字符串和可能的错误信息
 */
export async function formatPromQL(
  query: string, 
  options: FormatOptions = { mode: FormatMode.WASM, fallbackToJS: true }
): Promise<{ formatted: string; error: string | null }> {
  try {
    if (!query || !query.trim()) {
      return { formatted: '', error: null };
    }

    // 优先使用WASM模式
    if (options.mode === FormatMode.WASM || options.mode === undefined) {
      try {
        // 初始化WASM格式化器
         if (!wasmFormatter) {
           wasmFormatter = new WasmFormatter();
           await wasmFormatter.waitForInit();
         }
        
        // 使用WASM格式化
        const wasmResult = await wasmFormatter.formatPromQL(query);
        if (wasmResult.success && wasmResult.formatted) {
          return { formatted: wasmResult.formatted, error: null };
        } else if (!options.fallbackToJS) {
          return { formatted: '', error: wasmResult.error || 'WASM格式化失败' };
        }
        // 如果WASM失败且允许回退，继续使用JavaScript模式
      } catch (wasmError) {
        if (!options.fallbackToJS) {
          return {
            formatted: '',
            error: wasmError instanceof Error ? wasmError.message : 'WASM格式化时发生错误'
          };
        }
        // 如果WASM失败且允许回退，继续使用JavaScript模式
      }
    }

    // JavaScript模式格式化
    const cleanQuery = query.trim().replace(/\s+/g, ' ');
    let formatted = formatPromQLAdvanced(cleanQuery);
    formatted = cleanupFormatting(formatted);
    
    return { formatted: formatted.trim(), error: null };
  } catch (error) {
    return {
      formatted: '',
      error: error instanceof Error ? error.message : '格式化时发生未知错误'
    };
  }
}

/**
 * 高级PromQL格式化函数
 * 参考 https://github.com/laixintao/promql-metricsql-prettify 的格式化风格
 */
function formatPromQLAdvanced(query: string): string {
  let result = '';
  let indentLevel = 0;
  const indentSize = 2;
  let i = 0;
  let inString = false;
  let stringChar = '';
  
  while (i < query.length) {
    const char = query[i];
    const nextChar = i + 1 < query.length ? query[i + 1] : '';
    const prevChar = i > 0 ? query[i - 1] : '';
    
    // 处理字符串
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      result += char;
      i++;
      continue;
    }
    
    if (inString) {
      result += char;
      i++;
      continue;
    }
    
    // 处理左括号
    if (char === '(') {
      result += char;
      indentLevel++;
      
      // 检查是否需要换行：如果括号内容较复杂则换行
      const contentUntilClosing = getContentUntilClosingBracket(query, i + 1);
      if (shouldBreakAfterOpenBracket(contentUntilClosing)) {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      }
    }
    // 处理右括号
    else if (char === ')') {
      indentLevel--;
      
      // 如果前一个字符不是空格且不在同一行，添加换行
      if (result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
        const lastNewlineIndex = result.lastIndexOf('\n');
        const currentLineContent = lastNewlineIndex === -1 ? result : result.substring(lastNewlineIndex + 1);
        if (currentLineContent.trim().length > 0 && shouldBreakBeforeCloseBracket(currentLineContent)) {
          result += '\n' + ' '.repeat(indentLevel * indentSize);
        }
      }
      result += char;
      
      // 处理 by 和 without 子句
       const remainingQuery = query.substring(i + 1);
       const byWithoutMatch = remainingQuery.match(/^\s*(by|without)\s*\(/);
       if (byWithoutMatch) {
         result += '\n) ' + byWithoutMatch[1] + '(';
         i += byWithoutMatch[0].length;
         indentLevel++;
         continue;
       }
    }
    // 处理逗号
    else if (char === ',') {
      result += char;
      
      // 在逗号后添加换行和缩进（仅在函数参数列表中）
      if (indentLevel > 0) {
        result += '\n' + ' '.repeat(indentLevel * indentSize);
      } else {
        result += ' ';
      }
    }
    // 处理比较操作符
     else if (isComparisonOperator(query, i)) {
       const op = getComparisonOperator(query, i);
       // 在操作符前后添加适当的空格和换行
       if (result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
         result += '\n';
       }
       result += ' '.repeat(indentLevel * indentSize) + op;
       if (i + op.length < query.length) {
         result += '\n' + ' '.repeat(indentLevel * indentSize);
       }
       i += op.length - 1;
     }
    // 处理其他字符
    else {
      result += char;
    }
    
    i++;
  }
  
  return result;
}

/**
 * 获取括号内的内容
 */
function getContentUntilClosingBracket(query: string, startIndex: number): string {
  let depth = 1;
  let i = startIndex;
  let content = '';
  
  while (i < query.length && depth > 0) {
    const char = query[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if (depth > 0) content += char;
    i++;
  }
  
  return content;
}

/**
 * 判断是否应该在左括号后换行
 */
function shouldBreakAfterOpenBracket(content: string): boolean {
  // 如果内容包含逗号、复杂函数调用或长度超过阈值，则换行
  return content.includes(',') || 
         content.length > 30 || 
         /\w+\s*\(/.test(content) ||
         /[><=!]=?/.test(content);
}

/**
 * 判断是否应该在右括号前换行
 */
function shouldBreakBeforeCloseBracket(currentLineContent: string): boolean {
  // 如果当前行内容较长或包含复杂表达式，则在右括号前换行
  return currentLineContent.trim().length > 40 || 
         currentLineContent.includes(',');
}

/**
 * 检查是否是比较操作符
 */
function isComparisonOperator(query: string, index: number): boolean {
  const comparisonOps = ['==', '!=', '>=', '<=', '>', '<'];
  return comparisonOps.some(op => query.substring(index, index + op.length) === op);
}

/**
 * 获取比较操作符
 */
function getComparisonOperator(query: string, index: number): string {
  const comparisonOps = ['==', '!=', '>=', '<=', '>', '<'];
  for (const op of comparisonOps) {
    if (query.substring(index, index + op.length) === op) {
      return op;
    }
  }
  return '';
}

/**
 * 清理多余的空行和空格
 */
function cleanupFormatting(query: string): string {
  return query
    .replace(/\n\s*\n\s*\n/g, '\n\n') // 移除多余的空行
    .replace(/\n\s*\n/g, '\n') // 移除双空行
    .replace(/\s+$/gm, '') // 移除行尾空格
    .replace(/^\s+/gm, (match) => {
      // 保持缩进，但移除多余空格
      const spaces = match.length;
      return ' '.repeat(Math.floor(spaces / 2) * 2);
    });
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 验证PromQL语法
 * @param query - PromQL查询字符串
 * @param options - 验证选项
 * @returns 验证结果
 */
export async function validatePromQL(
  query: string,
  options: FormatOptions = { mode: FormatMode.WASM, fallbackToJS: true }
): Promise<{ isValid: boolean; error: string | null }> {
  try {
    if (!query || !query.trim()) {
      return { isValid: true, error: null };
    }

    // 优先使用WASM模式
    if (options.mode === FormatMode.WASM || options.mode === undefined) {
      try {
        // 初始化WASM格式化器
        if (!wasmFormatter) {
          wasmFormatter = new WasmFormatter();
          await wasmFormatter.waitForInit();
        }
        
        // 使用WASM验证
        const wasmResult = await wasmFormatter.validatePromQL(query);
        return { isValid: wasmResult.valid, error: wasmResult.error || null };
      } catch (wasmError) {
        if (!options.fallbackToJS) {
          return {
            isValid: false,
            error: wasmError instanceof Error ? wasmError.message : 'WASM验证时发生错误'
          };
        }
        // 如果WASM失败且允许回退，继续使用JavaScript模式
      }
    }

    // JavaScript模式验证
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
 * 解释PromQL查询
 * @param query - PromQL查询字符串
 * @param options - 格式化选项
 * @returns 查询解释结果
 */
export async function explainPromQL(
  query: string,
  options: FormatOptions = { mode: FormatMode.WASM, fallbackToJS: true }
): Promise<WasmExplainResult> {
  try {
    if (!query || !query.trim()) {
      return {
        success: false,
        error: '查询不能为空'
      };
    }

    // 优先使用WASM模式
    if (options.mode === FormatMode.WASM || options.mode === undefined) {
      try {
        // 初始化WASM格式化器
        if (!wasmFormatter) {
          wasmFormatter = new WasmFormatter();
          await wasmFormatter.waitForInit();
        }
        
        // 使用WASM解释
        const wasmResult = await wasmFormatter.explainPromQL(query);
        if (wasmResult.success) {
          return wasmResult;
        } else if (!options.fallbackToJS) {
          return wasmResult;
        }
        // 如果WASM失败且允许回退，继续使用JavaScript模式
      } catch (wasmError) {
        if (!options.fallbackToJS) {
          return {
            success: false,
            error: wasmError instanceof Error ? wasmError.message : 'WASM解释时发生错误'
          };
        }
        // 如果WASM失败且允许回退，继续使用JavaScript模式
      }
    }

    // JavaScript模式的简单解释（回退方案）
    return {
      success: true,
      ast: {
        type: 'SimpleQuery',
        value: query,
        children: []
      },
      execution: [
        {
          step: 1,
          operation: '查询解析',
          description: '解析PromQL查询语法',
          cost: '低'
        }
      ],
      performance: {
        complexity: '未知',
        timeRange: '未指定',
        cardinality: '未知',
        bottlenecks: [],
        suggestions: ['建议使用WASM模式获得更详细的分析']
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '解释查询时发生未知错误'
    };
  }
}

/**
 * 获取示例PromQL查询
 * @param options - 获取选项
 * @returns 示例查询列表
 */
export async function getExampleQueries(
  options: FormatOptions = { mode: FormatMode.WASM, fallbackToJS: true }
): Promise<string[]> {
  // 优先使用WASM模式
  if (options.mode === FormatMode.WASM || options.mode === undefined) {
    try {
      // 初始化WASM格式化器
      if (!wasmFormatter) {
        wasmFormatter = new WasmFormatter();
        await wasmFormatter.waitForInit();
      }
      
      // 使用WASM获取示例
      const wasmExamples = await wasmFormatter.getExampleQueries();
      if (wasmExamples.length > 0) {
        return wasmExamples;
      }
    } catch (wasmError) {
      if (!options.fallbackToJS) {
        console.error('WASM获取示例失败:', wasmError);
        return [];
      }
      // 如果WASM失败且允许回退，继续使用JavaScript模式
    }
  }

  // JavaScript模式的默认示例
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