import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from "node:fs";
import ora from 'ora';
import chalk from 'chalk';
import { projectData, targetData } from '../../config/const.js';

const execAsync = promisify(exec);

const processCwd = process.cwd();
// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 打印带颜色的消息
const addLog = (message, type = 'info') => {
  let color = 'blue';
  switch (type) {
    case 'error':
      color = 'red';
      break;
    case 'warning':
      color = 'yellow';
      break;
    case 'info':
      color = 'blue';
      break;
    case 'success':
      color = 'green';
      break;
    default:
      color = 'blue';
  }
  console.log(`${colors[color]}[${type.toUpperCase()}] ${message}${colors.reset}`);
};

// 安全的 Git 操作函数
const safeGitOperation = async (command) => {
  try {
    addLog(`执行命令: ${command}`, 'info');
    await execAsync(command);
    return true;
  } catch (error) {
    addLog(`命令执行失败: ${error.message}`, 'warning');
    return false;
  }
};

// 获取当前分支最后一次提交记录的函数
const getLastCommitInfo = async (projectDir) => {
  try {
    // 获取当前分支名
    const getCurrentBranchCommand = `cd ${projectDir} && git rev-parse --abbrev-ref HEAD`;
    addLog(`执行命令: ${getCurrentBranchCommand}`, 'info');
    const { stdout: currentBranch } = await execAsync(getCurrentBranchCommand);
    const branch = currentBranch.trim();

    // 获取最后一次提交的详细信息
    const getLastCommitCommand = `cd ${projectDir} && git log -1 --pretty=format:"%H|%s|%an|%ad" --date=iso`;
    addLog(`执行命令: ${getLastCommitCommand}`, 'info');
    const { stdout: commitInfo } = await execAsync(getLastCommitCommand);

    const [hash, message, author, date] = commitInfo.trim().split('|');

    return {
      branch,
      hash: hash.substring(0, 8), // 只取前8位
      message,
      author,
      date: new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  } catch (error) {
    addLog(`获取提交信息失败: ${error.message}`, 'warning');
    return {
      branch: 'unknown',
      hash: 'unknown',
      message: '获取失败',
      author: 'unknown',
      date: new Date().toLocaleString('zh-CN')
    };
  }
};

// 安全的 Git 分支切换函数
const safeGitCheckout = async (projectDir, branch) => {
  // 1. 先尝试清理工作目录
  await safeGitOperation(`cd ${projectDir} && git clean -fd`);

  // 2. 重置到 HEAD
  await safeGitOperation(`cd ${projectDir} && git reset --hard HEAD`);

  // 3. 尝试切换分支
  const checkoutSuccess = await safeGitOperation(`cd ${projectDir} && git checkout ${branch}`);

  if (!checkoutSuccess) {
    // 如果切换失败，尝试强制切换
    addLog(`分支切换失败，尝试强制切换: ${branch}`, 'warning');
    await safeGitOperation(`cd ${projectDir} && git checkout -f ${branch}`);
  }

  // 4. 拉取最新代码
  await safeGitOperation(`cd ${projectDir} && git pull origin ${branch}`);
};
const startBuildProcess = async (buildData) => {
  try {
    // 读取配置
    // const projectPath = path.join(processCwd, 'config', 'project.json');
    // const targetPath = path.join(processCwd, 'config', 'target.json');

    // const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
    // const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    // console.log('projectData, projectData', projectData, targetData)
    addLog('开始构建...');

    // 项目名称
    const projectKey = buildData.projectKey;
    // 部署目标
    // const deployTarget = buildData.deployTarget;
    const deployEnv = buildData.deployEnv;
    // 项目配置
    const project = projectData[projectKey];
    const target = targetData[projectKey];
    const targetConfigs = project.targetConfigs;
    // 目标配置, 根据部署环境，获取目标配置,其中branch是部署环境
    const targetConfig = targetConfigs.find(config => config.name === deployEnv);


    if (!project || !target || !targetConfig) {
      addLog('项目或目标配置不存在', 'error');
      return;
    }

    // 选择项目的地址
    const projectDir = project.gitDir;
    // 项目打包后，复制到部署项目地址
    const gitTarget = target.path;
    // 项目打包后，推送的git仓库地址
    const gitPath = project.gitPath;

    // 1. 确保选择项目的地址目录存在
    if (!fs.existsSync(projectDir)) {
      addLog(`创建目录: ${projectDir}`, 'info');
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // 2. 克隆或更新项目
    if (!fs.existsSync(projectDir)) {
      addLog(`执行命令: 项目${projectKey}不存在，开始克隆...`, 'warning');
      const cloneCommand = `git clone ${gitPath} ${projectDir}`;
      addLog(`执行命令: ${cloneCommand}`, 'info');
      await execAsync(cloneCommand);
      addLog(`执行成功: 项目${projectKey}已下载`, 'success');
      addLog(`执行命令: cd ${projectDir} && npm install --registry=http://registry.m.jd.com/n`, 'info');
      // await execAsync(`cd ${projectDir} && npm install --registry=http://registry.m.jd.com/`);
      await execAsync(`cd ${projectDir} && npm install`);
      addLog(`执行命令: 依赖安装成功`, 'success');
    } else {
      const fetchCommand = `cd ${projectDir} && git fetch --all`;
      addLog(`执行命令: ${fetchCommand}`, 'info');
      await execAsync(fetchCommand);
    }

    // 3. 切换到指定分支
    await safeGitCheckout(projectDir, targetConfig.branch);

    // 4. 依赖判断是否需要安装
    const shouldInstallDeps = async () => {

      // 检查node_modules目录是否存在
      const nodeModulesPath = path.join(projectDir, 'node_modules');
      const hasNodeModules = fs.existsSync(nodeModulesPath);

      if (hasNodeModules) {
        addLog('检测到node_modules目录，跳过依赖安装', 'info');
        return false;
      } else {
        addLog('未检测到node_modules目录，请手动安装依赖', 'info');
        return true;
      }
    };
    const needInstallDeps = await shouldInstallDeps();
    if (needInstallDeps) {
      const npmInstallCommand = `cd ${projectDir} && npm install`;
      addLog(`执行命令: ${npmInstallCommand}`, 'info');
      await execAsync(npmInstallCommand);
    }

    // 5. 执行构建命令
    const buildCommand = `cd ${projectDir} && ${targetConfig.buildCommand}`;
    addLog(`构建部署: ${buildCommand}`, 'info');
    const spinner = ora(chalk.blue(`开始构建: ${buildCommand}`)).start();
    try {
      await execAsync(buildCommand);
    } catch (error) {
      spinner.fail(chalk.blue("构建失败"));
      throw error;
    }
    spinner.succeed(chalk.blue("构建成功"));
    // 6. 检查目标本地目录是否存在
    if (!fs.existsSync(target.path)) {
      addLog(`目标目录不存在: ${target.path}`, 'error');
      throw new Error(`目标目录不存在: ${target.path}`);
    }

    addLog(`使用本地目标目录: ${target.path}`, 'info');

    // 7. 切换到目标分支
    await safeGitCheckout(target.path, targetConfig.targetBranch);

    // 8. 拷贝构建文件
    const sourceBuildDir = path.join(projectDir, project.buildDir);
    const targetBuildDir = path.join(target.path, targetConfig.targetDir || project.targetDir);

    addLog(`拷贝构建文件: ${sourceBuildDir} -> ${targetBuildDir}`, 'info');
    if (!fs.existsSync(targetBuildDir)) {
      addLog(`创建目录: ${targetBuildDir}`, 'info');
      fs.mkdirSync(targetBuildDir, { recursive: true });
    }
    // 拷贝文件
    try {
      const copyCommand = `cp -r ${sourceBuildDir}/* ${targetBuildDir}/`;
      addLog(`执行命令: ${copyCommand}`, 'info');
      await execAsync(copyCommand);
    } catch (copyError) {
      addLog(`拷贝文件失败: ${copyError.message}`, 'error');
      throw copyError;
    }

    // 9. 获取当前分支最后一次提交信息/自定义提交信息
    addLog('获取当前分支最后一次提交信息...', 'info');
    const lastCommitInfo = await getLastCommitInfo(projectDir);
    const commitMessage = `自动构建: ${lastCommitInfo.message}`;

    // 10. 提交更改
    // git add.
    const gitAddCommand = `cd ${target.path} && git add .`;
    addLog(`执行命令: ${gitAddCommand}`, 'info');
    await execAsync(gitAddCommand);
    // git commit
    const gitCommitCommand = `cd ${target.path} && git commit -m "${commitMessage}"`;
    addLog(`执行命令: ${gitCommitCommand}`, 'info');
    await execAsync(gitCommitCommand);
    // git push origin
    const gitPushCommand = `cd ${target.path} && git push origin ${targetConfig.targetBranch}`;
    addLog(`执行命令: ${gitPushCommand}`, 'info');
    await execAsync(gitPushCommand);

    addLog('构建和部署完成！', 'success');

  } catch (error) {
    console.error('构建失败:', error);
    addLog('构建失败', 'error');
  }
}
export default {
  start: startBuildProcess,
  log: addLog,
}