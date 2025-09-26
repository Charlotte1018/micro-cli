import fs from 'fs';
import path from 'path';

const processCwd = process.cwd();

// 部署项目配置
const projectPath = path.join(processCwd, 'config', 'project.json');
const targetPath = path.join(processCwd, 'config', 'target.json');
// 包信息
const packageJSONPath = path.join(processCwd, 'package.json');
export const pkg = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
// 部署项目配置
export const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
// 部署目标配置
export const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

// 部署项目配置
export const projectKeys = Object.keys(projectData);
// 部署目标配置
export const targetKeys = Object.keys(targetData);
// 部署环境配置
export const envKeys = ['测试', '预发', '生产'];