#!/bin/bash

# PromQL Prettify 部署脚本
# 用于将项目部署到 GitHub Pages

set -e

echo "🚀 开始部署 PromQL Prettify 到 GitHub Pages..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  警告: 有未提交的更改，建议先提交所有更改"
    read -p "是否继续部署? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# 部署到 GitHub Pages
echo "🌐 部署到 GitHub Pages..."
npm run deploy

echo "🎉 部署完成!"
echo "📱 您的网站将在几分钟内在以下地址可用:"
echo "   https://yourusername.github.io/promql-prettify/"
echo ""
echo "💡 提示:"
echo "   - 请将 'yourusername' 替换为您的 GitHub 用户名"
echo "   - 确保在 GitHub 仓库设置中启用了 GitHub Pages"
echo "   - 首次部署可能需要几分钟才能生效"