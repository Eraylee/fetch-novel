const cheerio = require('cheerio');
const request = require('superagent');
const fs = require('fs');
require('superagent-charset')(request);

const ARGV = process.argv;
// const BASE_URL = 'https://www.88dush.com/xiaoshuo/70/70714/';
const DIRNAME = __dirname + '/static';
const BASE_URL = ARGV[2];

if (ARGV.length <= 2) {
  console.log('请输入url： -url');
  return;
}

//入口程序
const start = async url => {
  const menuHtml = await fetch(url);
  const $ = cheerio.load(menuHtml);
  const title = $('.jieshao .rt h1').text();
  const author = $('.jieshao .rt .msg em:nth-child(1)')
    .text()
    .split('：')[1]
    .replace(' ', '');
  const menuList = toArr($('.mulu li a'));
  const fileName = `《${title}》${author}-${Date.now()}.txt`;
  const chaptersHtml = await Promise.all(
    menuList.map(async v => await fetch(v))
  );
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
      .end((err, res) => {
        if (err) {
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
  console.log('=================开始写入文件================');
  //检查文件是否存在
  fs.exists(DIRNAME, exists => {
    if (!exists) {
      fs.mkdir(DIRNAME, err => {
        if (!err) {
          console.log('================新建文件夹成功==============', err);
          writeFile(text, fileName);
        } else {
          console.log('================新建文件夹失败==============', err);
        }
      });
    } else {
      writeFile(text, fileName);
    }
  });
};

//写入文件
const writeFile = (text, fileName) => {
  fs.writeFile(`${DIRNAME}/${fileName}`, text, function(err) {
    if (err) {
      console.log('=================写入失败===========', err);
    } else {
      console.log('===============写入成功============' + fileName);
    }
  });
};

start(BASE_URL);
