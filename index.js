const cheerio = require('cheerio');
const request = require('superagent');
const fs = require('fs');
require('superagent-charset')(request);

const ARGV = process.argv;
// const BASE_URL = 'https://www.88dush.com/xiaoshuo/70/70714/';
const DIRNAME = __dirname + '/static';
const BASE_URL = ARGV[2];

// 替换 console
const { log, warn, info } = console;
Object.assign(global.console, {
  log: (...args) => log('[log]', ...args),
  warn: (...args) => warn('\x1b[33m%s\x1b[0m', '[warn]', ...args),
  info: (...args) => info('\x1b[34m%s\x1b[0m', '[info]', ...args),
  error: (...args) => info('\x1b[31m%s\x1b[0m', '[error]', ...args)
});

if (ARGV.length <= 2) {
  console.error('请输入url');
  return;
}
//入口程序
const start = async url => {
  console.info('开始获取目录');
  const menuHtml = await fetch(url);
  console.info('获取目录成功');
  const $ = cheerio.load(menuHtml);
  const title = $('.jieshao .rt h1').text();
  const author = $('.jieshao .rt .msg em:nth-child(1)')
    .text()
    .split('：')[1]
    .replace(' ', '');
  const menuList = toArr($('.mulu li a'));
  const fileName = `《${title}》${author}-${Date.now()}.txt`;
  console.info('开始获取文章');
  const chaptersHtml = await Promise.all(
    menuList.map(async v => await fetch(v))
  );
  console.info('获取文章成功');
  const chapters = chaptersHtml.map(v => joint(v));
  const novelText = chapters.join('\n');
  write(novelText, fileName);
};
//获取
const fetch = async url => {
  return new Promise((resolve, reject) => {
    request
      .get(url)
      .charset('gbk')
      .buffer(true)
      .end((err, res) => {
        if (err) {
          console.error('获取失败');
          reject(err);
        }
        resolve(res.text);
      });
  });
};

//处理数据
const toArr = menuList => {
  let arr = [];
  for (let i in menuList) {
    const item = menuList[i];
    if (item.type === 'tag') {
      arr.push(BASE_URL + item.attribs.href);
    }
  }
  return arr;
};

//拼接文章
const joint = html => {
  const $ = cheerio.load(html);
  let text = '';
  text += $('.novel h1').text();
  text += $('.novel .yd_text2').text();
  return text;
};

//文件夹处理
const write = (text, fileName) => {
  console.info('开始下载文件');
  //检查文件是否存在
  fs.exists(DIRNAME, exists => {
    if (!exists) {
      fs.mkdir(DIRNAME, err => {
        if (!err) {
          console.info('新建文件夹成功', err);
          writeFile(text, fileName);
        } else {
          console.info('新建文件夹失败', err);
        }
      });
    } else {
      writeFile(text, fileName);
    }
  });
};

//写入文件
const writeFile = (text, fileName) => {
  fs.writeFile(`${DIRNAME}/${fileName}`, text, err => {
    if (err) {
      console.info('下载失败', err);
    } else {
      console.info('下载成功');
      console.info(fileName);
    }
  });
};

start(BASE_URL);
