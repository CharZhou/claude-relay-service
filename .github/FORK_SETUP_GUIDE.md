# 🍴 Fork 仓库配置指南

## 概述

如果你从原仓库 fork 了这个项目，GitHub Actions 工作流已经配置为**自动适应你的仓库**，无需手动修改代码！

所有构建产物（Docker 镜像、GitHub Release）都会发布到**你自己的账户**下。

---

## 🚀 快速开始

### 1. Fork 仓库后的必要配置

#### **方式 A: 使用 Docker Hub（推荐）**

如果你想将镜像推送到 Docker Hub，需要配置两个 secrets：

1. 进入你的 GitHub 仓库 → **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**，添加以下两个 secret：

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 | 你的 Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub 访问令牌 | [Docker Hub → Account Settings → Security → New Access Token](https://hub.docker.com/settings/security) |

#### **方式 B: 仅使用 GitHub Container Registry（无需额外配置）**

如果你不想使用 Docker Hub，可以只使用 GitHub Container Registry (ghcr.io)，**无需配置任何 secrets**！

工作流会自动使用 GitHub 的 `GITHUB_TOKEN` 推送镜像到 `ghcr.io/<your-username>/claude-relay-service`。

---

### 2. 可选配置：Telegram 通知

如果你想在版本发布时接收 Telegram 通知：

1. 创建 Telegram Bot 并获取 Token（参考 [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)）
2. 在仓库 secrets 中添加：
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

---

## 📦 自动化功能

### ✅ 已自动适配的配置

以下配置会**自动使用你的 GitHub 账户信息**，无需手动修改：

| 配置项 | 自动适配行为 |
|-------|------------|
| **Docker Hub 镜像名称** | `$DOCKERHUB_USERNAME/claude-relay-service`<br/>如果未配置 secret，使用 `${{ github.repository_owner }}/claude-relay-service` |
| **GitHub Container Registry** | `ghcr.io/${{ github.repository_owner }}/claude-relay-service` |
| **GitHub Release** | 自动在你的仓库中创建 Release |
| **Changelog 链接** | 自动使用 `${{ github.repository }}` 生成链接 |
| **Issue 链接** | Changelog 中的 Issue 链接自动指向你的仓库 |
| **前端构建分支** | 自动推送到你仓库的 `web-dist` 分支 |

---

## 🐳 使用你的镜像

### 推送到 main 分支后，镜像会自动构建并推送到：

#### **Docker Hub**（如果配置了 secrets）
```bash
docker pull <your-dockerhub-username>/claude-relay-service:latest
docker pull <your-dockerhub-username>/claude-relay-service:v1.0.0
```

#### **GitHub Container Registry**（始终可用）
```bash
docker pull ghcr.io/<your-github-username>/claude-relay-service:latest
docker pull ghcr.io/<your-github-username>/claude-relay-service:v1.0.0
```

---

## 🔍 验证配置

### 1. 测试构建流程

推送代码到 `main` 分支（确保有代码变更，不只是文档）：

```bash
git add .
git commit -m "feat: test auto-release pipeline"
git push origin main
```

### 2. 检查 GitHub Actions

1. 进入你的仓库 → **Actions** 标签
2. 查看 **Auto Release Pipeline** 工作流运行状态
3. 查看日志中的镜像名称是否正确：
   ```
   docker_image=<your-username>/claude-relay-service
   ghcr_image=ghcr.io/<your-username>/claude-relay-service
   ```

### 3. 验证发布产物

构建成功后，检查：

- ✅ **GitHub Release**: 仓库的 Releases 页面应该有新版本
- ✅ **Docker 镜像**: Docker Hub 或 ghcr.io 应该有新镜像
- ✅ **前端构建**: `web-dist` 分支应该有更新

---

## 🛠️ 高级配置

### 自定义 Docker 镜像名称

如果你想使用不同的镜像名称（而不是默认的 `claude-relay-service`），需要修改：

1. `.github/workflows/auto-release-pipeline.yml`:
   ```yaml
   DOCKER_IMAGE=$(echo "${DOCKER_USERNAME}/your-custom-name" | tr '[:upper:]' '[:lower:]')
   GHCR_IMAGE=$(echo "ghcr.io/${{ github.repository_owner }}/your-custom-name" | tr '[:upper:]' '[:lower:]')
   ```

2. `Dockerfile` 的 LABEL:
   ```dockerfile
   LABEL description="Your Custom Service Name"
   ```

---

## ❓ 常见问题

### Q: 我需要修改代码中的仓库链接吗？

**不需要！** 所有仓库链接都会自动使用 `${{ github.repository }}` 变量，指向你的仓库。

### Q: 如果我不配置 Docker Hub secrets 会怎样？

镜像会自动推送到 **GitHub Container Registry** (`ghcr.io/<your-username>/claude-relay-service`)，仍然可以正常使用。

只有当你想推送到 Docker Hub 时，才需要配置 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`。

### Q: 如何禁用某些自动化功能？

- **禁用自动 Docker 构建**: 删除 `.github/workflows/auto-release-pipeline.yml` 中的 Docker 构建步骤
- **禁用 PR 检查**: 删除 `.github/workflows/pr-lint-check.yml` 文件
- **禁用价格同步**: 删除 `.github/workflows/sync-model-pricing.yml` 文件

### Q: 如何跳过某次构建？

在 commit 消息中添加 `[skip ci]`:

```bash
git commit -m "docs: update README [skip ci]"
```

### Q: 镜像命名规则是什么？

每次发布会创建多个标签：

- `v1.0.0`: 完整版本号（带 v 前缀）
- `1.0.0`: 版本号（不带 v 前缀）
- `latest`: 最新版本

---

## 📚 相关文档

- [自动发布完整指南](./AUTO_RELEASE_GUIDE.md)
- [Docker Hub 配置](./DOCKER_HUB_SETUP.md)
- [Telegram 通知配置](./TELEGRAM_SETUP.md)
- [工作流使用说明](./WORKFLOW_USAGE.md)

---

## 🎉 完成！

配置完成后，每次推送到 `main` 分支，GitHub Actions 会自动：

1. ✅ 检测代码变更
2. ✅ 自动递增版本号
3. ✅ 构建前端并推送到 `web-dist` 分支
4. ✅ 生成 Changelog
5. ✅ 构建多平台 Docker 镜像（amd64 + arm64）
6. ✅ 推送镜像到 Docker Hub 和/或 ghcr.io
7. ✅ 创建 GitHub Release
8. ✅ 清理旧版本（保留最近 50 个）
9. ✅ 发送 Telegram 通知（如果配置了）

现在你可以专注于代码开发，所有发布流程都自动化了！🚀
