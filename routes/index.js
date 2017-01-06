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
  res.send("Hello! Willcome to weixin Affilinet");
});
// 微信服务器返回的ack信息是HTTP的GET方法实现的
router.get('/wx/setMenu', function (req, res) {
  var menu = {
    "button": [
      {
        "type": "view",
        "name": "Allhaha官网",
        "url": "http://www.allhaha.com/"
      },
      {
        "name": "功能菜单",
        "sub_button": [
          {
            "type": "scancode_waitmsg",
            "name": "扫一扫",
            "key": "rselfmenu_0_0"
          },
          {
            "type": "view",
            "name": "EAN录入",
            "url": "http://www.allhaha.com/EAN/"
          },
          {
            "type": "view",
            "name": "EAN查询",
            "url": "http://www.allhaha.com/"
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
  });

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
router.get('/weixin/text', function (req, res) {
  var messages = nodeWeixinMessage.messages;

  function text(message, res, callback, extra) {
    //message => 解析后的JSON
    //res => res
    //callback => callback
    //extra => 'some data',

    //Extra
    res.send(message);
  }

  //多次侦听相同的回调函数只会被调用一次
  messages.on.text(text);
  messages.on.text(text);
  messages.on.text(text);
  messages.onXML(req.body, res, function callback(message) {
    //After message handled.
  });

  //处理扫描带参数二维码事件
  messages.event.on.scan(function (message) {

  });
  //后面可以接系统允许的最大数量的参数，只要跟text的处理函数一一对应就可以了。
  //唯一不同的是req.body会被解析成JSON
  //,
  //'some data');

});

module.exports = router;
