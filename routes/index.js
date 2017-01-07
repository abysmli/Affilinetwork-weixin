var express = require('express');
var router = express.Router();
var nodeWeixinAuth = require('node-weixin-auth');
var nodeWeixinMenu = require('node-weixin-menu');
var nodeWeixinConfig = require("node-weixin-config");
var nodeWeixinSettings = require('node-weixin-settings');
var nodeWeixinMessage = require('node-weixin-message');

var errors = require('web-errors').errors;
var request = require('supertest');

var app = {
  id: 'wx499abe9f9831315b',
  secret: '391dbdd46e663f8e71f53850f6ce1585',
  token: 'allhaha'
};
// var app = {
//   id: 'wx616276dfaab6b39d',
//   secret: 'b129240e6a3f919b817f013ca37728a3',
//   token: 'allhaha'
// };
nodeWeixinConfig.app.init(app);

nodeWeixinSettings.registerSet(function () {

});

nodeWeixinSettings.registerGet(function () {

});

// 调整TIME_GAP来避免重复请求
// 默认是500秒，基本上不会出现失效的情况
nodeWeixinAuth.TIME_GAP = 60;

//手动得到accessToken
nodeWeixinAuth.tokenize(nodeWeixinSettings, app, function (error, json) {
  var accessToken = json.access_token;
});

// //自动获得accessToken，并发送需要accessToken的请求
// nodeWeixinAuth.determine(nodeWeixinSettings, app, function () {
//   //这里添加发送请求的代码
// });

// //获取服务器IP
// nodeWeixinAuth.ips(nodeWeixinSettings, app, function (error, data) {
//   //error == false
//   //data.ip_list获取IP列表
// });

router.get('/', function (req, res) {
  res.send("Hello! Willcome to weixin Affilinet！");
});



var menu = {
  "button": [
    {
      "type": "view",
      "name": "Allhaha官网",
      "url": "http://www.allhaha.com/",
      "sub_button": []
    },
    {
      "name": "功能菜单",
      "sub_button": [
        {
          "type": "scancode_waitmsg",
          "name": "扫一扫",
          "key": "rselfmenu_0_0",
          "sub_button": []
        },
        {
          "type": "scancode_push",
          "name": "扫一扫2",
          "key": "rselfmenu_0_1",
          "sub_button": []
        },
        {
          "type": "view",
          "name": "EAN录入",
          "url": "http://www.allhaha.com/EAN/",
          "sub_button": []
        },
        {
          "type": "view",
          "name": "EAN查询",
          "url": "http://www.allhaha.com/",
          "sub_button": []
        }
      ]
    }
  ]
};

nodeWeixinMenu.create(nodeWeixinSettings, app, menu, function (error, data) {
  //error === true
  console.log(data.errcode);
  console.log(data.errmsg);
  res.json({
    errcode: data.errcode,
    errmsg: data.errmsg
  });
  //data.errcode === 0
  //data.errmsg === 'ok'

  // nodeWeixinMenu.get(app, function (error, data) {
  //   //error === true
  //   //typeof data.menu
  //   //typeof data.menu.button
  // });

  // nodeWeixinMenu.customize(app, function (error, data) {
  //   //error === true
  //   //data.is_menu_open === 1
  //   //data.selfmenu_info
  //   //data.selfmenu_info.button
  // });

  // nodeWeixinMenu.remove(app, function (error, data) {
  //   //error === true
  //   //data.errcode
  //   //data.errmsg
  // });
});



// 微信服务器返回的ack信息是HTTP的GET方法实现的
router.get('/wx/auth/ack', function (req, res) {
  var data = nodeWeixinAuth.extract(req.query);
  nodeWeixinAuth.ack(app.token, data, function (error, data) {
    if (!error) {
      res.send(data);
      return;
    }
    switch (error) {
      case 1:
        res.send(errors.INPUT_INVALID);
        break;
      case 2:
        res.send(errors.SIGNATURE_NOT_MATCH);
        break;
      default:
        res.send(errors.UNKNOWN_ERROR);
        break;
    }
  });
});

//在http请求里的处理方式
router.post('/wx/auth/ack', function (req, res) {
  // var data = nodeWeixinAuth.extract(req.query);
  // console.log(1);
  // console.log(req.query);
  // console.log(2);
  // console.log(data);
  // console.log(3);
  // console.log(req.body);
  // console.log(4);
  // console.log(JSON.stringify(req));
  // nodeWeixinAuth.ack(app.token, data, function (error, data) {
  //   console.log(error);
  //   console.log(data);
  //   if (!error) {
  //     res.send(data);
  //     return;
  //   }
  // });
  var reply = nodeWeixinMessage.reply;
  var message = req.body;
  if (message.xml !== undefined) {
    if (message.xml.ScanCodeInfo !== undefined) {
      var scanCodes = message.xml.ScanCodeInfo.ScanResult.split(",");
      console.log(scanCode[1]);
      //回复图文
      var news = reply.news(message.xml.ToUserName, message.xml.FromUserName, [{
        title: '点击查找产品',
        description: '查询产品' + scanCode[1],
        picUrl: 'http://image5.tuku.cn/wallpaper/Fantasy%20Wallpapers/817_1440x900.jpg',
        url: 'http://allhaha.com'
      }]);
      return res.send(news);
    }
  }
  return res.send("抱歉，只能扫EAN13国际码！");

  




});

module.exports = router;
