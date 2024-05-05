import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';

// 获取当前模块文件的 URL
const __filename = fileURLToPath(import.meta.url);

// 解析当前模块文件的目录路径
const __dirname = path.dirname(__filename);

// 获取父级目录路径
const parentDir1 = path.dirname(__dirname);
const parentDir2 = path.dirname(parentDir1);

// 使用相对路径拼接资源目录路径
const resource = path.resolve(parentDir2, 'server', 'resource');

// 创建 Express 应用
const app = express();

app.use(cors());
// 使用 body-parser 中间件来解析请求体中的数据
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/resource', express.static(resource));

// 获取当前服务器的主机名和端口号
const hostname = 'localhost';
const port = 3000; // 选择一个合适的端口

//@ts-ignore
// 定义一个简单的 GET 请求处理器，返回一个 JSON 对象
app.get('/api/hello', (req: any, res: any) => {
  res.json({ message: 'Hello from the backend!' });
});

// 定义路由，当访问 /hrc 路径时，读取 .hrc 文件并将其内容返回给前端
// @ts-ignore
app.get('/api/song', (req: any, res: any) => {
  const lrc = path.join(resource, 'lrc', '清空.lrc');

  // 读取 .hrc 文件
  fs.readFile(lrc, 'utf8', (err, data) => {
    if (err) {
      // 发生错误时返回错误信息给前端
      res.status(500).send('Error reading .hrc file');
      return;
    }

    // 将读取到的 .hrc 文件内容发送给前端
    res.send(data);
  });
});

// 处理音频文件请求
// @ts-ignore
app.get('/api/getOneSong/:fileName', (req, res) => {
  const fileName = req.params.fileName;

  console.log('File name:', fileName);

  const audioFilePath = path.join(resource, 'music', fileName);
  // 读取指定目录下的所有文件
  fs.readdir(audioFilePath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    // 遍历文件列表
    files.forEach((file) => {
      // 检查文件是否以 '.mp3' 后缀结尾
      if (file.endsWith('.mp3')) {
        // 构建完整的文件路径
        const filePath = path.join(audioFilePath, file);
        // 使用 fs.createReadStream() 创建可读流
        const stream = fs.createReadStream(filePath);

        // 将流式数据传输给响应对象
        stream.pipe(res);
      }
    });
  });
});

// 获取全部音频文件
// @ts-ignore
app.get('/api/getAllSong', (req, res) => {
  // 指定音乐路径
  const musicPath = path.join(resource, 'music');

  // 读取目录中的文件列表
  fs.readdir(musicPath, (err, folders) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).json({ error: 'Error reading directory' });
    }

    const songArrayName: any = [];

    // 定义一个 Promise 包装的异步函数，用于读取 .lrc 文件内容
    function readLrcFile(lrcPath: any) {
      return new Promise((resolve, reject) => {
        fs.readFile(lrcPath, 'utf8', (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }

    // 递归遍历文件夹
    function readFilesInFolders(index: any) {
      if (index >= folders.length) {
        // 所有文件夹遍历完成，发送响应
        res.json(songArrayName);
        return;
      }

      const folder = folders[index];
      const folderPath = path.join(musicPath, folder);

      // 获取文件夹的状态信息
      fs.stat(folderPath, (err, stats) => {
        if (err) {
          console.error('Error getting folder stats:', err);
          return readFilesInFolders(index + 1); // 继续处理下一个文件夹
        }

        // 检查文件夹是否是文件夹
        if (!stats.isDirectory()) {
          return readFilesInFolders(index + 1); // 继续处理下一个文件夹
        }

        let obj = {
          uuid: folder,
          name: '',
          imgPath: '',
          lrc: '',
        };

        // 读取文件夹中的文件列表
        fs.readdir(folderPath, (err, files) => {
          if (err) {
            console.error('Error reading directory:', err);
            return readFilesInFolders(index + 1); // 继续处理下一个文件夹
          }

          if (files.length === 0) {
            return readFilesInFolders(index + 1);
          }

          // 使用 Promise.all() 来等待所有的 fs.readFile() 操作都完成后再发送响应
          Promise.all(
            files.map((file) => {
              if (file.endsWith('.mp3')) {
                obj.name = file;
              } else if (file.endsWith('.lrc')) {
                const lrcPath = path.join(folderPath, file);
                // 使用 Promise 来读取 .lrc 文件内容
                return readLrcFile(lrcPath)
                  .then((data) => {
                    obj.lrc = data as string;
                  })
                  .catch((err) => {
                    console.error('Error reading .lrc file:', err);
                  });
              } else {
                // 将绝对路径转换为相对路径
                const relativePath = path.relative(
                  path.resolve(parentDir2, 'server'),
                  path.join(folderPath, file),
                );

                // 构造相应的 URL
                const imgUrl = `http://${hostname}:${port}/${relativePath}`;
                obj.imgPath = imgUrl;
              }
            }),
          ).then(() => {
            // 将对象推送到数组中
            songArrayName.push(obj);

            // 处理下一个文件夹
            readFilesInFolders(index + 1);
          });
        });
      });
    }

    // 开始递归遍历文件夹
    readFilesInFolders(0);
  });
});

// 启动服务器，监听指定的端口
app.listen(port, () => {
  console.log(`Server is running on http://${hostname}:${port}`);
});
