# Micro-CLI

一个多项目发版工具，用于自动化构建和部署多个前端项目。

## 功能特性

- 🚀 **多项目管理**：支持管理多个前端项目的构建和部署
- 🔄 **自动化流程**：自动克隆/更新代码、切换分支、构建、部署
- 🌍 **多环境支持**：支持测试、预发、生产等多环境部署
- 📦 **模板下载**：提供项目模板快速下载功能
- 🎨 **友好界面**：命令行交互式界面，操作简单直观

## 安装

### 全局安装

```bash
npm install -g micro-cli
```

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd micro-cli

# 安装依赖
npm install

# 链接到全局命令
npm link
```

## 使用方法

### 基本命令

```bash
# 查看帮助信息
micro-cli --help

# 查看版本信息
micro-cli --version
```

### 部署项目

```bash
# 开始部署流程
micro-cli deploy
```

执行后会进入交互式界面：
1. 选择要部署的项目
2. 选择部署环境（测试/预发/生产）
3. 自动执行构建和部署流程

### 下载模板

```bash
# 下载项目模板
micro-cli download
```

支持下载以下模板：
- 微前端基座
- React 子应用
- Vue 子应用

## 配置说明

### 项目配置 (config/project.json)

定义需要构建和部署的项目信息：

```json
{
  "项目名称": {
    "gitPath": "git@github.com:user/repo.git",
    "buildDir": "dist",
    "description": "项目描述",
    "targetDir": "deploy-dir",
    "gitDir": "/path/to/local/project",
    "targetConfigs": [
      {
        "name": "测试",
        "branch": "dev",
        "buildCommand": "npm run build",
        "targetBranch": "test",
        "targetDir": "deploy-dir"
      }
    ]
  }
}
```

### 目标配置 (config/target.json)

定义部署目标仓库信息：

```json
{
  "目标仓库标识": {
    "path": "/path/to/target/repo",
    "description": "目标仓库描述"
  }
}
```

### 模板配置 (config/template.js)

定义可下载的项目模板：

```javascript
export const template = [
  {
    "name": "微前端基座",
    "description": "微前端基座模版",
    "gitPath": "git@github.com:user/base-template.git"
  }
]
```

## 工作流程

1. **项目准备**：根据配置克隆或更新项目代码
2. **分支切换**：切换到指定环境的分支
3. **依赖安装**：检查并安装项目依赖
4. **项目构建**：执行构建命令生成部署文件
5. **文件复制**：将构建产物复制到目标仓库
6. **代码提交**：提交更改并推送到远程分支

## 项目结构

```
micro-cli/
├── bin/
│   └── main.js              # 命令行入口文件
├── config/
│   ├── project.json         # 项目配置文件
│   ├── target.json          # 目标仓库配置
│   ├── template.js          # 模板配置
│   └── const.js             # 常量定义
├── lib/
│   ├── commands/
│   │   ├── start.js         # 部署命令实现
│   │   └── download.js      # 下载命令实现
│   └── index.js             # 库入口文件
└── package.json
```

## 依赖项

- **chalk**: 终端颜色输出
- **commander**: 命令行参数解析
- **figlet**: ASCII 艺术字
- **inquirer**: 交互式命令行界面
- **ora**: 加载动画

## 环境要求

- Node.js >= 14.0.0
- Git
- npm 或 yarn

## 注意事项

1. **权限要求**：确保对 Git 仓库和本地目录有相应的读写权限
2. **路径格式**：配置文件中的路径建议使用绝对路径
3. **分支管理**：确保配置的分支在远程仓库中存在
4. **构建命令**：确保构建命令在项目根目录下可以正常执行

## 故障排除

### 常见问题

- **Git 克隆失败**：检查网络连接和 SSH 密钥配置
- **分支切换失败**：确认分支在远程仓库中存在
- **构建失败**：检查构建命令和项目依赖
- **文件复制失败**：检查目标目录权限和路径正确性

### 调试建议

- 查看命令行输出的详细日志信息
- 检查配置文件格式是否正确（JSON 格式）
- 验证所有路径和命令的有效性
- 确保 Git 仓库状态正常，无未提交的更改

## 开发

### 添加新项目

1. 在 `config/project.json` 中添加项目配置
2. 在 `config/target.json` 中添加目标仓库配置
3. 确保项目 Git 仓库可访问

### 添加新模板

1. 在 `config/template.js` 中添加模板配置
2. 确保模板仓库可访问

## 许可证

MIT License

## 作者

charlotte
