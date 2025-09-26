#! /usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import { Command } from 'commander';
const program = new Command();
import { start, log } from '../lib/index.js';
import inquirer from 'inquirer';
import { projectData, targetData, pkg, projectKeys, targetKeys, envKeys } from '../config/const.js';
import { download } from '../lib/commands/download.js';
program.name("micro-cli").usage(`<command> [option]`);
program.version(`micro-cli ${pkg.version}`);

program.on("-h,--help", function () {
  // 前后两个空行调整格式，更舒适
  console.log();
  // // enter 入口文件
  console.log(
    // "\r\n" +
    figlet.textSync("MICRO-CLI", {
      font: "Ghost",
      horizontalLayout: "default",
      verticalLayout: "default",
      width: 80,
      whitespaceBreak: true,
    })
    + "\r\n"
  );

  console.log(
    `Run ${chalk.cyan(
      "char-cli <command> --help"
    )} for detailed usage of given command.`
  );
  console.log();
});

program.command("deploy")
  .description("开始构建")
  .action(async () => {
    
    const projectAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'project',
        message: '请选择部署的应用',
        choices: projectKeys
      }
    ])
    const envAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'env',
        message: '请选择部署环境',
        choices: envKeys
      }
    ])
    const buildData = {
      // 选择的项目和环境
      projectKey: projectAnswers.project,
      deployEnv: envAnswers.env,
    }

    start(buildData);

  });

program.command("download")
  .description("下载模版")
  .action(async () => {
    await download();
  });

// 解析用户执行时输入的参数
// process.argv 是 nodejs 提供的属性

program.parse(process.argv);