# 🍴 Fork-Ready 配置说明

本项目已配置为 **Fork-Ready**,所有硬编码的仓库地址和镜像名称都已改为可配置,fork 后无需手动修改代码即可使用。

---

## ✅ 已实现的 Fork-Ready 功能

### 1. **GitHub Actions 自动适配** ✨

所有 GitHub Actions 工作流已配置为使用动态变量:
- `${{ github.repository }}` - 自动使用当前仓库名称
- `${{ github.repository_owner }}` - 自动使用当前仓库所有者
- Docker 镜像自动推送到你的 GHCR: `ghcr.io/<your-username>/claude-relay-service`
- Changelog 中的链接自动指向你的仓库

**文件**: `.github/workflows/auto-release-pipeline.yml`

### 2. **scripts/manage.sh 可配置仓库地址** 🔧

`crs` 命令脚本现在支持环境变量配置:

```bash
# 方法 1: 设置环境变量(临时)
export REPO_URL="https://github.com/your-username/claude-relay-service.git"
crs update

# 方法 2: 修改脚本中的默认值(永久)
# 编辑 scripts/manage.sh 第25行:
DEFAULT_REPO_URL="https://github.com/your-username/claude-relay-service.git"
```

**修改位置**:
- 第 23-26 行: 添加了 `REPO_URL` 环境变量配置
- 第 417, 483, 686, 1220 行: 使用 `$REPO_URL` 替代硬编码地址

### 3. **config/pricingSource.js 自动适配** 📊

定价数据源自动适配 fork 仓库:

```javascript
// 优先级:
// 1. process.env.PRICE_MIRROR_REPO (手动设置)
// 2. process.env.GITHUB_REPOSITORY (GitHub Actions 自动)
// 3. 'Wei-Shaw/claude-relay-service' (默认fallback)
```

**在 GitHub Actions 中**: 自动使用 `GITHUB_REPOSITORY` 环境变量
**本地运行**: 可设置 `PRICE_MIRROR_REPO` 环境变量

### 4. **docker-compose.yml 带注释说明** 🐳

Docker Compose 文件已添加 fork 用户配置说明:

```yaml
# Fork 用户: 修改为你的 Docker Hub 用户名或使用 GHCR
# image: <your-dockerhub-username>/claude-relay-service:latest
# 或使用 GitHub Container Registry:
# image: ghcr.io/<your-github-username>/claude-relay-service:latest
image: weishaw/claude-relay-service:latest  # 默认(保持兼容性)
```

### 5. **check-deployment-status.sh 可配置用户名** 🔍

部署状态检查脚本支持环境变量:

```bash
# 使用你自己的用户名运行
export GITHUB_USER="your-github-username"
export DOCKER_USER="your-dockerhub-username"
bash scripts/check-deployment-status.sh
```

**默认值**:
- `GITHUB_USER=wayfind` (当前fork所有者)
- `DOCKER_USER=weishaw` (原作者,保持兼容)

### 6. **README 添加 Fork 说明** 📖

两个 README 文件都添加了明显的 Fork 说明:
- 中文版 (README.md): 指向 FORK_SETUP_GUIDE.md
- 英文版 (README_EN.md): 指向 FORK_SETUP_GUIDE.md

---

## 📋 Fork 后的使用步骤

### 第一次 Fork 后

1. **无需修改代码** - 所有配置已自动适配 ✅

2. **可选配置 Docker Hub**:
   ```bash
   # GitHub → Settings → Secrets → Actions
   # 添加两个 secrets:
   DOCKERHUB_USERNAME=your-dockerhub-username
   DOCKERHUB_TOKEN=your-docker-hub-token
   ```

3. **推送触发构建**:
   ```bash
   git commit -m "feat: 触发首次构建"
   git push origin main
   ```

4. **检查构建结果**:
   - GitHub Actions: `https://github.com/<your-username>/claude-relay-service/actions`
   - GHCR 镜像: `ghcr.io/<your-username>/claude-relay-service`
   - GitHub Release: `https://github.com/<your-username>/claude-relay-service/releases`

### 更新已有安装到 Fork 版本

如果你之前通过原始仓库安装了服务,想迁移到 fork 版本:

**详细步骤**: 见 [MIGRATION_FROM_UPSTREAM.md](./MIGRATION_FROM_UPSTREAM.md)

**快速命令**:
```bash
cd ~/claude-relay-service/app  # crs install 安装方式
git remote set-url origin https://github.com/<your-username>/claude-relay-service.git
git fetch --tags
git checkout <your-latest-tag>
npm install && npm run build:web && crs restart
```

### 配置 `crs update` 使用 Fork 仓库

**选项 1: 环境变量** (推荐,无需修改脚本):
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export REPO_URL="https://github.com/<your-username>/claude-relay-service.git"
```

**选项 2: 修改脚本** (永久):
```bash
# 找到 crs 脚本位置
which crs  # 通常在 /usr/local/bin/crs

# 编辑脚本
sudo nano /usr/local/bin/crs

# 找到 DEFAULT_REPO_URL,修改为你的仓库地址
DEFAULT_REPO_URL="https://github.com/<your-username>/claude-relay-service.git"
```

---

## 🔧 环境变量参考

### GitHub Actions (自动设置)
- `GITHUB_REPOSITORY` - 格式: `owner/repo`
- `github.repository_owner` - 仓库所有者用户名

### 本地/服务器环境 (可选设置)
```bash
# Git 仓库地址
export REPO_URL="https://github.com/<your-username>/claude-relay-service.git"

# Docker 镜像用户名
export GITHUB_USER="<your-github-username>"
export DOCKER_USER="<your-dockerhub-username>"

# 定价数据源
export PRICE_MIRROR_REPO="<your-username>/claude-relay-service"
```

---

## 📂 修改文件清单

### 核心配置文件
- [x] `.github/workflows/auto-release-pipeline.yml` - GitHub Actions 动态适配
- [x] `scripts/manage.sh` - 添加 `REPO_URL` 环境变量支持
- [x] `config/pricingSource.js` - 添加注释说明优先级
- [x] `docker-compose.yml` - 添加 fork 用户配置注释
- [x] `scripts/check-deployment-status.sh` - 添加环境变量支持

### 文档文件
- [x] `README.md` - 添加 Fork 说明
- [x] `README_EN.md` - 添加 Fork 说明
- [x] `.github/FORK_SETUP_GUIDE.md` - Fork 配置指南
- [x] `MIGRATION_FROM_UPSTREAM.md` - 迁移指南
- [x] `FORK_READY.md` - 本文档

---

## 🎯 设计原则

1. **向后兼容** - 所有修改保持与原项目的兼容性
2. **环境变量优先** - 优先使用环境变量,fallback 到硬编码默认值
3. **零配置使用** - Fork 后推送即可触发构建,无需修改代码
4. **清晰文档** - 详细的注释和文档说明每个配置选项
5. **可选配置** - 所有个性化配置都是可选的,不强制修改

---

## 💡 最佳实践

### Fork 后立即做的事

1. ✅ 触发一次构建验证配置正确
2. ✅ 检查 GHCR 镜像是否成功推送
3. ✅ 更新 docker-compose.yml 镜像地址(如需使用)
4. ✅ 配置 crs 命令使用你的仓库(如需更新)

### 保持与上游同步

```bash
# 添加原始仓库为 upstream
git remote add upstream https://github.com/Wei-Shaw/claude-relay-service.git

# 定期拉取上游更新
git fetch upstream
git merge upstream/main

# 推送到你的 fork
git push origin main
```

---

## 📚 相关文档

- [Fork 配置指南](.github/FORK_SETUP_GUIDE.md) - 首次 fork 后的配置
- [构建验证清单](.github/BUILD_VERIFICATION_CHECKLIST.md) - 验证构建是否成功
- [从原始仓库迁移](MIGRATION_FROM_UPSTREAM.md) - 迁移现有安装
- [工作流使用说明](.github/WORKFLOW_USAGE.md) - GitHub Actions 使用

---

## 🤝 贡献

如果你发现任何硬编码的地址或可以改进的配置,欢迎提交 Pull Request!

**原始项目**: [Wei-Shaw/claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service)
