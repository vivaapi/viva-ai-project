# Fork仓库同步&配置管理规范
## 核心原则
上游维护**业务主代码**（不碰配置文件），下游仅改**专属配置文件**，自动化同步上游更新，下游配置永久保留。

## 1. 文件职责
### 上游主仓库（vivaapi/ViVa-AI-v1.0）
- 维护：所有业务代码（功能、页面、样式等，除`src/app_config.ts`）
- 禁止：**任何操作`src/app_config.ts`**（含修改、注释、格式调整）

### 下游Fork仓库
- 自定义：仅修改`src/app_config.ts`（应用名、BASE URL、价格系数等站点配置）
- 禁止：非必要修改上游业务代码，避免同步冲突

## 2. 代码同步规则
- 自动同步：每日UTC 0点（北京时间8点）自动拉取上游main分支最新代码
- 手动触发：仓库「Actions」中执行`Sync ViVa-AI-v1.0 Upstream`立即同步
- 同步效果：上游业务代码更新生效，下游`src/app_config.ts`配置**完全保留，不被覆盖**

## 3. 分支规范
- 上游/下游统一以**main分支**作为主分支，用于同步、开发、部署
- 禁止在非main分支执行同步/部署操作

## 4. 部署规范（阿里云服务器）
本项目为纯静态前端应用，部署到阿里云服务器步骤如下：

### 首次部署
```bash
# 1. 在服务器上克隆仓库
git clone https://github.com/你的用户名/你的仓库名.git /var/www/viva-ai

# 2. 进入项目目录，安装依赖并构建
cd /var/www/viva-ai
npm install
npm run build

# 3. 配置 Nginx（参考项目根目录 nginx.conf.example）
# 将 dist/ 目录设为 Nginx 静态文件根目录
```

### 日常更新（同步上游后手动部署）
```bash
# SSH 登录服务器后执行
cd /var/www/viva-ai
git pull origin main
npm install       # 依赖有变化时执行，否则可跳过
npm run build
# Nginx 无需重启，静态文件直接生效
```

### Nginx 配置
参考项目根目录的 `nginx.conf.example` 文件进行配置。

## 5. 合并冲突处理（仅`src/app_config.ts`可能触发）
1. 本地拉取：`git pull origin main`
2. 拉取上游：`git fetch upstream`
3. 手动合并：`git merge upstream/main`
4. 解决冲突：打开`src/app_config.ts`，**保留自身配置**，删除冲突标记（<<<<<<<、=======、>>>>>>>）
5. 提交推送：`git add src/app_config.ts` → `git commit -m "解决app_config.ts冲突，保留站点配置"` → `git push origin main`
6. 重新同步：仓库「Actions」手动触发同步工作流

## 6. 注意事项
1. 上游新增配置项需**提前通知下游**，统一规划后执行
2. 下游需修改业务代码时，先与上游沟通，避免同步覆盖
3. 同步失败优先排查`src/app_config.ts`冲突，按上述步骤处理，**不会丢失站点配置**
4. 所有操作基于main分支，禁止私自更换主分支
5. 服务器部署后，`dist/` 目录为构建产物，无需上传 GitHub（已在 .gitignore 中排除）
