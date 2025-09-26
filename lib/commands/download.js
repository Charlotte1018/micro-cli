import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from "node:fs";
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { template } from '../../config/template.js';
import { log } from '../index.js';

const execAsync = promisify(exec);

const processCwd = process.cwd();
const templateKeys = template.map(item => item.name);
export const download = async () => {
  const templateAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: '请选择模版',
      choices: templateKeys
    }
  ])
  const selectedTemplate = template.find(item => item.name === templateAnswers.template);
  
  if (!selectedTemplate) {
    log('未找到选中的模板', 'error');
    return;
  }
  
  const templatePath = selectedTemplate.gitPath;
  const templateDir = path.join(processCwd, 'template', selectedTemplate.name);
  
  log(`开始下载模板: ${selectedTemplate.name}`);
  log(`模板路径: ${templatePath}`);
  log(`目标目录: ${templateDir}`);
  
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }
  
  const cloneCommand = `git clone ${templatePath} ${templateDir}`;
  log(`执行命令: ${cloneCommand}`);
  
  try {
    await execAsync(cloneCommand);
    log(`模板下载成功: ${selectedTemplate.name}`);
  } catch (error) {
    log(`模板下载失败: ${error.message}`, 'error');
  }
}