//go:build wasm
// +build wasm

package main

import (
	"syscall/js"

	"github.com/VictoriaMetrics/metricsql"
)

// FormatResult represents the result of formatting operation
type FormatResult struct {
	Success   bool   `json:"success"`
	Formatted string `json:"formatted"`
	Error     string `json:"error,omitempty"`
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

func main() {
	// Register functions to be called from JavaScript
	js.Global().Set("formatPromQLWasm", js.FuncOf(formatPromQL))
	js.Global().Set("validatePromQLWasm", js.FuncOf(validatePromQL))
	js.Global().Set("getExampleQueriesWasm", js.FuncOf(getExampleQueries))

	// Signal that WASM is ready
	if wasmReady := js.Global().Get("wasmReady"); !wasmReady.IsUndefined() {
		wasmReady.Invoke()
	}

	// Keep the program running
	select {}
}