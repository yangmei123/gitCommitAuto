'use strict';
const path = require('path');
const execSync = require('child_process').execSync;
const fs = require('fs');

/**
 * @param {Object} option 配置参数对象
 * @param {string} option.gitRemoteUrl 远程仓库地址必填
 * @param {string} option.remoteDir 远程仓库文件夹名称必填
 * @param {string} option.fileDir 打包成功后的文件夹路径必填
 * @param {string} option.filePath 要传送的文件路径不要包含根路径fileDir必填
 * @param {string} option.fileGitDir 多项目下远程仓库对应的文件夹，默认是提交static文件夹 非必填
 * @param {string} option.commitMessage 提交时的说明 必填
 * @description 自动上传文件到指定git插件
 * @returns {boolean} 文件已经正确上传到指定git
 */

 let userName = execSync('git config --get user.name').toString().trim(); //git姓名
 let userEmail = execSync('git config --get user.email').toString().trim(); // git邮箱

const option = {
  gitRemoteUrl: 'https://github.com/xxx/xxx.git',
  remoteDir: 'xxx',
  fileDir: './dist',
  filePath: '/static/img',
  fileGitDir: '',
  commitMessage: 'docs: 提交指定文件到远程仓库。',
  userName,
  userEmail
};
console.log(option);
const distRoot = `${option.fileDir}Upload/`;
const distUpload = `${distRoot}${option.remoteDir}`;

// 删除文件夹
function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      var curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
// 新建文件夹
function makeDir(dirpath, deleteDir = true) {
  if (!fs.existsSync(dirpath)) {
    var pathtmp;
    dirpath.split('/').forEach((dirname) => {
      if (pathtmp) {
        pathtmp = path.join(pathtmp, dirname);
      } else {
        if (dirname) {
          pathtmp = dirname;
        } else {
          pathtmp = '/';
        }
      }
      if (!fs.existsSync(pathtmp)) {
        if (!fs.mkdirSync(pathtmp)) {
          return false;
        }
      }
    });
  } else if (deleteDir) {
    deleteFolderRecursive(dirpath);
  }
  return true;
}
// 拷贝文件
function copyTemplates(targetRootPath, tempPath) {
  makeDir(targetRootPath, false);
  const files = fs.readdirSync(tempPath);
  files.forEach((file) => {
    const curPath = `${tempPath}/${file}`;
    const stat = fs.statSync(curPath);
    const filePath = `${targetRootPath}/${file}`;
    if (stat.isDirectory()) {
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath);
      }
      copyTemplates(`${targetRootPath}/${file}`, `${tempPath}/${file}`);
    } else {
      const readStream = fs.createReadStream(curPath);
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      // const contents = fs.readFileSync(curPath, 'utf8');
      // fs.writeFileSync(filePath, contents, 'utf8');
    }
  });
}
// 执行对应命令方法
const runCommand = (command, args, cwd = distUpload) => {
  const cp = require('child_process'); // 开启进程执行命令，安装依赖
  return new Promise((resolve, reject) => {
    // 执行要运行的命令
    const executedCommand = cp.spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    executedCommand.on('error', (error) => {
      reject(error);
    });

    executedCommand.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};
const GitCommitAuto = function(config = option) {
  const { gitRemoteUrl, fileDir, fileGitDir, filePath, userEmail, userName, commitMessage = option.commitMessage } = config;
  if (!gitRemoteUrl || !filePath || !fileDir) {
    console.error('\x1b[31m', '> 请完整填写对应的配置信息, gitRemoteUrl(远程仓库地址)、fileDir(打包成功后的根文件夹)、filePath(要传送的文件路径) ');
    return false;
  }
  if (fs.existsSync(distRoot)) {
    deleteFolderRecursive(distRoot);
  }
  makeDir(distUpload);
  runCommand('git', [`clone ${gitRemoteUrl}`], distRoot)
    .then(() => {
      copyTemplates(`${distUpload}${fileGitDir}${filePath}`, `${fileDir}${filePath}`);
      // return runCommand('git', [`branch newBranch`]);
    })
    // .then(() => {
    //   return runCommand('git', [`checkout newBranch`]);
    // })
    .then(() => {
      return runCommand('git', [`config user.name ${userName}`]);
    })
    .then(() => {
      return runCommand('git', [`config user.email ${userEmail}`]);
    })
    .then(() => {
      return runCommand('git', [`add -A .`]);
    })
    .then(() => {
      return runCommand('git', [`commit -m'${commitMessage}'`]);
    })
    // .then(() => {
    //   return runCommand('git', [`checkout master`]);
    // })
    // .then(() => {
    //   return runCommand('git', [`merge newBranch`]);
    // })
    .then(() => {
      return runCommand('git', [`remote rm origin`]);
    })
    .then(() => {
      return runCommand('git', [`remote add origin ${gitRemoteUrl}`]);
    })
    .then(() => {
      return runCommand('git', ['push -u origin master --force']);
    })
    .then(() => {
      deleteFolderRecursive(distRoot);
      console.log('\x1b[32m', '> 对应上传到七牛云空间的文件已传送完毕～');
    })
    .catch((error) => {
      deleteFolderRecursive(distRoot);
      if (error) {
        console.error('\x1b[31m', error);
        process.exitCode = 1;
      } else {
        console.error('\x1b[32m', '> 暂时没有需要提交的文件～');
      }
    });
};
GitCommitAuto();
module.exports = GitCommitAuto;
