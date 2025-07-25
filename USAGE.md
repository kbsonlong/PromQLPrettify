# PromQL Prettify 使用指南

## 🎯 项目简介

PromQL Prettify 是一个基于 Vue.js 开发的在线 PromQL 和 MetricsQL 美化工具。它可以将复杂的查询语句格式化为易读的形式，帮助开发者更好地理解和维护监控查询。

## 🚀 快速开始

### 在线使用

1. 访问在线版本：`https://yourusername.github.io/promql-prettify/`
2. 在左侧输入框中粘贴您的 PromQL 或 MetricsQL 查询
3. 右侧会实时显示格式化后的结果
4. 点击"复制"按钮将结果复制到剪贴板

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/promql-prettify.git
cd promql-prettify

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000/promql-prettify/
```

## 📝 功能特性

### 1. 实时格式化
- 输入即时显示格式化结果
- 支持 PromQL 和 MetricsQL 语法
- 智能缩进和换行

### 2. 语法验证
- 括号匹配检查
- 引号匹配验证
- 错误提示和建议

### 3. 示例查询
点击"示例"按钮可以快速加载常用的查询模板：

```promql
# 基础指标查询
up

# 速率计算
rate(http_requests_total[5m])

# 聚合查询
sum(rate(http_requests_total[5m])) by (job)

# 分位数查询
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

### 4. 便捷功能
- 一键复制格式化结果
- 清空输入内容
- 字符和行数统计
- 格式化耗时显示

## 🎨 界面说明

### 输入区域（左侧）
- **输入框**：粘贴或输入您的查询语句
- **示例按钮**：显示/隐藏示例查询列表
- **清空按钮**：清除所有输入内容
- **统计信息**：显示字符数和行数

### 输出区域（右侧）
- **格式化结果**：显示美化后的查询语句
- **复制按钮**：将结果复制到剪贴板
- **错误提示**：显示语法错误和修复建议
- **性能信息**：显示格式化耗时

## 🔧 支持的查询类型

### PromQL (Prometheus Query Language)
- 基础指标查询：`up`, `cpu_usage`
- 函数调用：`rate()`, `sum()`, `avg()`
- 聚合操作：`by()`, `without()`
- 时间范围：`[5m]`, `[1h]`
- 比较操作：`>`, `<`, `==`, `!=`
- 逻辑操作：`and`, `or`, `unless`

### MetricsQL (VictoriaMetrics Query Language)
- 兼容所有 PromQL 语法
- 扩展函数支持
- 高级聚合操作

## 📱 响应式设计

项目采用响应式设计，支持多种设备：

- **桌面端**：双栏布局，左右分屏显示
- **平板端**：自适应布局调整
- **手机端**：上下布局，优化触摸操作

## 🛠️ 部署指南

### GitHub Pages 自动部署

1. Fork 或克隆此项目到您的 GitHub 账户
2. 修改 `vite.config.ts` 中的 `base` 路径为您的仓库名
3. 修改 `package.json` 中的 `homepage` 字段
4. 推送代码到 `main` 分支
5. GitHub Actions 会自动构建和部署

### 手动部署

```bash
# 构建项目
npm run build

# 部署到 GitHub Pages
npm run deploy

# 或使用部署脚本
./deploy.sh
```

### 自定义域名

1. 在 `public` 目录下创建 `CNAME` 文件
2. 文件内容为您的域名，如：`promql.yourdomain.com`
3. 在域名 DNS 设置中添加 CNAME 记录指向 `yourusername.github.io`

## 🔍 故障排除

### 常见问题

**Q: 格式化结果显示错误**
A: 检查输入的查询语法是否正确，特别注意括号和引号的匹配

**Q: 复制功能不工作**
A: 确保浏览器支持剪贴板 API，或在 HTTPS 环境下使用

**Q: 页面加载缓慢**
A: 检查网络连接，或尝试刷新页面

**Q: 部署后页面显示 404**
A: 检查 GitHub Pages 设置，确保选择了正确的分支和目录

### 调试模式

在浏览器开发者工具中可以查看详细的错误信息和性能数据。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [promql-metricsql-prettify](https://github.com/laixintao/promql-metricsql-prettify) - 原始项目灵感
- [Vue.js](https://vuejs.org/) - 前端框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Prometheus](https://prometheus.io/) - 监控系统
- [VictoriaMetrics](https://victoriametrics.com/) - 时序数据库