//go:build wasm
// +build wasm

package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"syscall/js"

	"github.com/VictoriaMetrics/metricsql"
)

// FormatResult represents the result of formatting operation
type FormatResult struct {
	Success   bool   `json:"success"`
	Formatted string `json:"formatted"`
	Error     string `json:"error,omitempty"`
}

// ASTNode represents a node in the Abstract Syntax Tree
type ASTNode struct {
	Type        string      `json:"type"`
	Value       string      `json:"value,omitempty"`
	Children    []ASTNode   `json:"children,omitempty"`
	Properties  map[string]interface{} `json:"properties,omitempty"`
}

// ExecutionStep represents a step in query execution
type ExecutionStep struct {
	Step        int    `json:"step"`
	Operation   string `json:"operation"`
	Description string `json:"description"`
	Cost        string `json:"cost"`
}

// PerformanceAnalysis represents performance analysis of the query
type PerformanceAnalysis struct {
	Complexity    string   `json:"complexity"`
	TimeRange     string   `json:"timeRange"`
	Cardinality   string   `json:"cardinality"`
	Bottlenecks   []string `json:"bottlenecks"`
	Suggestions   []string `json:"suggestions"`
}

// ExplainResult represents the complete explanation of a PromQL query
type ExplainResult struct {
	Success     bool                 `json:"success"`
	AST         ASTNode              `json:"ast,omitempty"`
	Execution   []ExecutionStep      `json:"execution,omitempty"`
	Performance PerformanceAnalysis  `json:"performance,omitempty"`
	Error       string               `json:"error,omitempty"`
}

// formatPromQL formats a PromQL query using VictoriaMetrics metricsql
func formatPromQL(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"success": false,
			"error":   "Expected exactly one argument",
		}
	}

	query := args[0].String()
	if query == "" {
		return map[string]interface{}{
			"success":   true,
			"formatted": "",
		}
	}

	// Use VictoriaMetrics metricsql to format the query
	formatted, err := metricsql.Prettify(query)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	return map[string]interface{}{
		"success":   true,
		"formatted": formatted,
	}
}

// validatePromQL validates a PromQL query
func validatePromQL(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"valid": false,
			"error": "Expected exactly one argument",
		}
	}

	query := args[0].String()
	if query == "" {
		return map[string]interface{}{
			"valid": true,
		}
	}

	// Try to parse the query to validate it
	_, err := metricsql.Parse(query)
	if err != nil {
		return map[string]interface{}{
			"valid": false,
			"error": err.Error(),
		}
	}

	return map[string]interface{}{
		"valid": true,
	}
}

// getExampleQueries returns example PromQL queries
func getExampleQueries(this js.Value, args []js.Value) interface{} {
	examples := []string{
		"up",
		"rate(http_requests_total[5m])",
		"sum(rate(http_requests_total[5m])) by (job)",
		"histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
		"avg_over_time(cpu_usage[1h])",
		"increase(http_requests_total{status=~\"5..\"}[1h])",
		"topk(10, sum by (instance) (rate(node_cpu_seconds_total[5m])))",
		"label_replace(up, \"instance\", \"$1\", \"instance\", \"([^:]+):.*\")",
	}

	// Convert to JavaScript array
	result := make([]interface{}, len(examples))
	for i, example := range examples {
		result[i] = example
	}

	return result
}

// analyzeAST converts metricsql.Expr to our ASTNode structure
func analyzeAST(expr metricsql.Expr) ASTNode {
	if expr == nil {
		return ASTNode{Type: "null"}
	}

	switch e := expr.(type) {
	case *metricsql.MetricExpr:
		node := ASTNode{
			Type:       "MetricSelector",
			Value:      "metric",
			Properties: make(map[string]interface{}),
		}
		if len(e.LabelFilterss) > 0 && len(e.LabelFilterss[0]) > 0 {
			node.Value = e.LabelFilterss[0][0].Value
			if len(e.LabelFilterss[0]) > 1 {
				filters := make([]string, 0)
				for _, filter := range e.LabelFilterss[0][1:] {
					op := "="
					if filter.IsNegative && filter.IsRegexp {
						op = "!~"
					} else if filter.IsNegative {
						op = "!="
					} else if filter.IsRegexp {
						op = "=~"
					}
					filters = append(filters, fmt.Sprintf("%s%s%s", filter.Label, op, filter.Value))
				}
				node.Properties["filters"] = filters
			}
		}
		return node

	case *metricsql.FuncExpr:
		node := ASTNode{
			Type:     "Function",
			Value:    e.Name,
			Children: make([]ASTNode, 0),
		}
		for _, arg := range e.Args {
			node.Children = append(node.Children, analyzeAST(arg))
		}
		return node

	case *metricsql.AggrFuncExpr:
		node := ASTNode{
			Type:       "Aggregation",
			Value:      e.Name,
			Children:   make([]ASTNode, 0),
			Properties: make(map[string]interface{}),
		}
		if len(e.Modifier.Args) > 0 {
			node.Properties["grouping"] = e.Modifier.Args
			node.Properties["modifier"] = e.Modifier.Op
		}
		for _, arg := range e.Args {
			node.Children = append(node.Children, analyzeAST(arg))
		}
		return node

	case *metricsql.BinaryOpExpr:
		node := ASTNode{
			Type:     "BinaryOperation",
			Value:    e.Op,
			Children: make([]ASTNode, 0),
		}
		node.Children = append(node.Children, analyzeAST(e.Left))
		node.Children = append(node.Children, analyzeAST(e.Right))
		return node

	case *metricsql.RollupExpr:
		node := ASTNode{
			Type:       "Rollup",
			Value:      "range_query",
			Children:   make([]ASTNode, 0),
			Properties: make(map[string]interface{}),
		}
		if e.Expr != nil {
			node.Children = append(node.Children, analyzeAST(e.Expr))
		}
		if e.Window != nil {
			node.Properties["window"] = fmt.Sprintf("%v", e.Window)
		}
		return node

	case *metricsql.NumberExpr:
		return ASTNode{
			Type:  "Number",
			Value: fmt.Sprintf("%g", e.N),
		}

	case *metricsql.StringExpr:
		return ASTNode{
			Type:  "String",
			Value: e.S,
		}

	default:
		return ASTNode{
			Type:  "Unknown",
			Value: fmt.Sprintf("%T", expr),
		}
	}
}

// generateExecutionPlan creates execution steps for the query
func generateExecutionPlan(expr metricsql.Expr) []ExecutionStep {
	steps := make([]ExecutionStep, 0)
	stepCounter := 1

	switch e := expr.(type) {
	case *metricsql.MetricExpr:
		metricName := "unknown_metric"
		if len(e.LabelFilterss) > 0 && len(e.LabelFilterss[0]) > 0 {
			metricName = e.LabelFilterss[0][0].Value
		}
		steps = append(steps, ExecutionStep{
			Step:        stepCounter,
			Operation:   "数据检索",
			Description: fmt.Sprintf("从时序数据库检索指标 %s", metricName),
			Cost:        "低",
		})

	case *metricsql.FuncExpr:
		steps = append(steps, ExecutionStep{
			Step:        stepCounter,
			Operation:   "函数计算",
			Description: fmt.Sprintf("执行 %s 函数", e.Name),
			Cost:        "中",
		})

	case *metricsql.AggrFuncExpr:
		steps = append(steps, ExecutionStep{
			Step:        stepCounter,
			Operation:   "聚合计算",
			Description: fmt.Sprintf("执行 %s 聚合", e.Name),
			Cost:        "高",
		})
		if len(e.Modifier.Args) > 0 {
			stepCounter++
			steps = append(steps, ExecutionStep{
				Step:        stepCounter,
				Operation:   "分组",
				Description: fmt.Sprintf("按标签分组: %s", strings.Join(e.Modifier.Args, ", ")),
				Cost:        "中",
			})
		}

	case *metricsql.RollupExpr:
		steps = append(steps, ExecutionStep{
			Step:        stepCounter,
			Operation:   "时间范围查询",
			Description: "执行时间范围查询操作",
			Cost:        "中",
		})
	}

	return steps
}

// analyzePerformance provides performance analysis
func analyzePerformance(expr metricsql.Expr) PerformanceAnalysis {
	analysis := PerformanceAnalysis{
		Complexity:  "低",
		TimeRange:   "未指定",
		Cardinality: "未知",
		Bottlenecks: make([]string, 0),
		Suggestions: make([]string, 0),
	}

	switch e := expr.(type) {
	case *metricsql.AggrFuncExpr:
		analysis.Complexity = "中"
		if len(e.Modifier.Args) > 3 {
			analysis.Bottlenecks = append(analysis.Bottlenecks, "过多的分组标签可能影响性能")
			analysis.Suggestions = append(analysis.Suggestions, "考虑减少分组标签数量")
		}

	case *metricsql.FuncExpr:
		if e.Name == "rate" || e.Name == "increase" {
			analysis.Suggestions = append(analysis.Suggestions, "确保时间范围足够大以获得准确的速率计算")
		}
		analysis.Complexity = "中"

	case *metricsql.RollupExpr:
		analysis.Complexity = "中"
		analysis.Suggestions = append(analysis.Suggestions, "时间范围查询可能消耗较多资源")

	case *metricsql.BinaryOpExpr:
		analysis.Complexity = "高"
		analysis.Suggestions = append(analysis.Suggestions, "二元操作可能需要大量计算资源")
	}

	return analysis
}

// explainPromQL provides comprehensive explanation of a PromQL query
func explainPromQL(this js.Value, args []js.Value) interface{} {
	if len(args) != 1 {
		return map[string]interface{}{
			"success": false,
			"error":   "Expected exactly one argument",
		}
	}

	query := args[0].String()
	if query == "" {
		return map[string]interface{}{
			"success": false,
			"error":   "Query cannot be empty",
		}
	}

	// Parse the query
	expr, err := metricsql.Parse(query)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}
	}

	// Generate explanation
	result := ExplainResult{
		Success:     true,
		AST:         analyzeAST(expr),
		Execution:   generateExecutionPlan(expr),
		Performance: analyzePerformance(expr),
	}

	// Convert to map for JavaScript
	jsonData, err := json.Marshal(result)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   "Failed to serialize result",
		}
	}

	var resultMap map[string]interface{}
	err = json.Unmarshal(jsonData, &resultMap)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   "Failed to convert result",
		}
	}

	return resultMap
}

func main() {
	// Register functions to be called from JavaScript
	js.Global().Set("formatPromQLWasm", js.FuncOf(formatPromQL))
	js.Global().Set("validatePromQLWasm", js.FuncOf(validatePromQL))
	js.Global().Set("getExampleQueriesWasm", js.FuncOf(getExampleQueries))
	js.Global().Set("explainPromQLWasm", js.FuncOf(explainPromQL))

	// Signal that WASM is ready
	js.Global().Call("wasmReady")

	// Keep the program running
	select {}
}
