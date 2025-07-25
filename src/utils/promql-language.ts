// PromQL语言定义，用于highlight.js
export default function promql(hljs: any) {
  const KEYWORDS = [
    'and', 'or', 'unless', 'by', 'without', 'on', 'ignoring', 
    'group_left', 'group_right', 'offset', 'bool'
  ]

  const FUNCTIONS = [
    'abs', 'absent', 'absent_over_time', 'ceil', 'changes',
    'clamp_max', 'clamp_min', 'delta', 'deriv', 'exp',
    'floor', 'histogram_quantile', 'holt_winters', 'idelta', 'increase', 'irate',
    'label_join', 'label_replace', 'ln', 'log10', 'log2',
    'predict_linear', 'rate', 'resets', 'round', 'scalar', 'sort', 'sort_desc', 'sqrt',
    'time', 'timestamp', 'vector', 'year', 'month', 'day_of_month', 'day_of_week',
    'hour', 'minute', 'days_in_month'
  ]

  const AGGREGATION_OPS = [
    'sum', 'min', 'max', 'avg', 'group', 'stddev', 'stdvar', 'count', 'count_values',
    'bottomk', 'topk', 'quantile', 'count_over_time', 'avg_over_time', 'max_over_time',
    'min_over_time', 'stddev_over_time', 'sum_over_time', 'quantile_over_time'
  ]

  return {
    name: 'promql',
    case_insensitive: false,
    keywords: {
      keyword: KEYWORDS,
      built_in: [...FUNCTIONS, ...AGGREGATION_OPS]
    },
    contains: [
      // 注释
      hljs.COMMENT('#', '$'),
      
      // 字符串
      {
        className: 'string',
        variants: [
          { begin: '"', end: '"', contains: [hljs.BACKSLASH_ESCAPE] },
          { begin: "'", end: "'", contains: [hljs.BACKSLASH_ESCAPE] }
        ]
      },
      
      // 数字（包括浮点数和科学计数法）
      {
        className: 'number',
        variants: [
          { begin: '\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b' },
          { begin: '\\b0x[0-9a-fA-F]+\\b' }
        ]
      },
      
      // 时间范围
      {
        className: 'string',
        begin: '\\[\\s*\\d+[smhdwy]\\s*\\]',
        relevance: 10
      },
      
      // 标签选择器
      {
        className: 'attr',
        begin: '{',
        end: '}',
        contains: [
          {
            className: 'string',
            variants: [
              { begin: '"', end: '"' },
              { begin: "'", end: "'" }
            ]
          },
          {
            className: 'operator',
            begin: '(=~|!~|!=|=)'
          }
        ]
      },
      
      // 操作符
      {
        className: 'operator',
        begin: '(==|!=|<=|>=|<|>|\\+|-|\\*|/|%|\\^)'
      },
      
      // 指标名称
      {
        className: 'variable',
        begin: '\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*[{\\[]|\\s*$)',
        relevance: 5
      },
      
      // 聚合操作符（特殊高亮）
      {
        className: 'title.function',
        begin: '\\b(' + AGGREGATION_OPS.join('|') + ')(?=\\s*\\()',
        relevance: 10
      },
      
      // 函数调用
      {
        className: 'title.function',
        begin: '\\b(' + FUNCTIONS.join('|') + ')(?=\\s*\\()',
        relevance: 8
      }
    ]
  }
}