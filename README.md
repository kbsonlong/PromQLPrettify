# PromQL Prettify - Vue.js版本

一个基于Vue.js开发的PromQL和MetricsQL在线美化工具，可以将复杂的查询语句格式化为易读的形式。

## 功能特性

- 🎯 **PromQL美化**: 支持Prometheus查询语言的格式化
- 📊 **MetricsQL美化**: 支持VictoriaMetrics查询语言的格式化
- 🎨 **实时预览**: 输入即时显示格式化结果
- 📋 **一键复制**: 快速复制格式化后的查询语句
- 📱 **响应式设计**: 支持桌面和移动设备
- 🌙 **深色主题**: 提供舒适的代码阅读体验
- ⚡ **零依赖**: 纯前端实现，无需后端服务
- 🚀 **智能格式化**: 参考[promql-metricsql-prettify](https://github.com/laixintao/promql-metricsql-prettify)的格式化风格，减少不必要的换行，提供更美观的输出
- 🔧 **WASM模式**: 集成VictoriaMetrics/metricsql的Go WASM模块，提供更精确的格式化和验证

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: CSS3 + Flexbox
- **WASM模块**: Go + VictoriaMetrics/metricsql
- **部署**: GitHub Pages

## 项目结构

```
promql-prettify/
├── public/
│   ├── index.html
│   ├── promql-formatter.wasm     # Go WASM模块
│   └── wasm_exec.js             # Go WASM执行支持文件
├── src/
│   ├── components/
│   │   ├── PromqlEditor.vue      # PromQL输入编辑器
│   │   ├── PrettierOutput.vue    # 格式化结果显示
│   │   └── CopyButton.vue        # 复制按钮组件
│   ├── utils/
│   │   ├── promql-prettier.ts    # PromQL格式化核心逻辑
│   │   └── wasm-formatter.ts     # WASM格式化器
│   ├── styles/
│   │   └── main.css             # 全局样式
│   ├── App.vue                  # 主应用组件
│   └── main.ts                  # 应用入口
├── wasm/
│   ├── go.mod                   # Go模块定义
│   ├── go.sum                   # Go依赖锁定
│   └── main.go                  # Go WASM源码
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 使用方法

1. **输入查询**: 在左侧文本框中粘贴您的PromQL或MetricsQL查询语句
2. **实时格式化**: 右侧会实时显示格式化后的结果
3. **复制结果**: 点击"复制"按钮将格式化后的查询复制到剪贴板
4. **错误提示**: 如果查询语法有误，会显示相应的错误信息
5. **WASM模式**: 自动优先使用WASM模式进行格式化，提供更精确的结果

## 格式化模式

### WASM模式 (推荐)
- 使用VictoriaMetrics/metricsql的Go实现
- 提供最精确的PromQL/MetricsQL解析和格式化
- 支持完整的语法验证
- 自动回退到JavaScript模式（如果WASM加载失败）

### JavaScript模式 (备用)
- 纯JavaScript实现的格式化逻辑
- 轻量级，兼容性好
- 基本的语法验证和格式化功能

## 示例

**输入**:
```
count(sum(label_replace(node_uname_info, "kernel", "$1", "release", "([0-9]+.[0-9]+.[0-9]+).*")) by (kernel)) > 1
```

**输出**:
```
count(
  sum(
    label_replace(
      node_uname_info,
      "kernel",
      "$1",
      "release",
      "([0-9]+.[0-9]+.[0-9]+).*"
    )
  ) by(kernel)
)
  >
1
```

### 格式化特点

- **智能换行**: 只在必要时换行，避免过度分割
- **层次缩进**: 清晰的层次结构，便于理解查询逻辑
- **操作符对齐**: 比较操作符独立成行，突出查询条件
- **函数参数**: 复杂函数参数自动换行和缩进
- **聚合子句**: `by` 和 `without` 子句智能格式化

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 开发服务器地址
- 开发环境: http://localhost:3000/promql-prettify/
- 预览环境: http://localhost:4173/promql-prettify/

### 构建说明
- 项目已配置好TypeScript和Vue 3
- 使用Vite作为构建工具，支持热重载
- 生产构建会自动进行代码分割和压缩
- 构建输出在`dist`目录，可直接部署到静态服务器

## 部署到GitHub Pages

### 自动部署 (推荐)

本项目已配置GitHub Actions自动部署:

1. **推送代码**: 将代码推送到`main`分支
2. **自动构建**: GitHub Actions会自动构建项目
3. **部署到docs分支**: 构建结果会自动推送到`docs`分支
4. **GitHub Pages设置**: 在仓库设置中将GitHub Pages源设置为`docs`分支

### 手动部署

如果需要手动部署:

1. 构建项目: `npm run build`
2. 将`dist`目录内容推送到`docs`分支
3. 在GitHub仓库设置中启用GitHub Pages，选择`docs`分支作为源

### 部署配置说明

- **GitHub Actions工作流**: `.github/workflows/deploy.yml`
- **触发条件**: 推送到`main`分支或手动触发
- **部署分支**: `docs`分支
- **构建输出**: 所有静态文件直接放在`docs`分支根目录

## 致谢

本项目灵感来源于:
- [promql-metricsql-prettify](https://github.com/laixintao/promql-metricsql-prettify)
- [promql-prettier](https://github.com/jiacai2050/promql-prettier)

## 许可证

MIT License