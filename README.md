# 自动上传文件到指定git仓库

 * @param {Object} option 配置参数对象
 * @param {string} option.gitRemoteUrl 远程仓库地址
 * @param {string} option.remoteDir 远程仓库文件夹名称
 * @param {string} option.fileDir 打包成功后的文件夹路径
 * @param {string} option.filePath 要传送的文件路径不要包含根路径fileDir
 * @param {string} option.fileGitDir 多项目下远程仓库对应的文件夹，默认是提交static文件夹
 * @param {string} option.commitMessage 提交时的说明
 * @description 自动上传文件到指定git插件
 * @returns {boolean} 文件已经正确上传到指定git
 
 ## 使用方法

 * 将该文件放到项目的指定位置；
 * 在package.json文件添加指定命令；

    ```js
    "scripts": {
        "upload:qiniu": "node build/gitCommitAuto.js --preview"
    }
    // 这里build/gitCommitAuto.js就是项目的文件存放路径
    ```

* 最后在控制台运行以下命令即可

    ```js
    npm run upload:qiniu

    ```