var express = require('express');
var router = express.Router();
var request = require('request');
var nodeWeixinAuth = require('node-weixin-auth');
var nodeWeixinMenu = require('node-weixin-menu');
var nodeWeixinConfig = require("node-weixin-config");
var nodeWeixinSettings = require('node-weixin-settings');
var nodeWeixinMessage = require('node-weixin-message');

var errors = require('web-errors').errors;
var app = {
  id: 'wx020b144fd5f4b67c',
  secret: '4b4c5ad9298320588a0158209deeea59',
  token: 'aokchina'
};

nodeWeixinConfig.app.init(app);

nodeWeixinSettings.registerSet(function () { });

nodeWeixinSettings.registerGet(function () { });

// 调整TIME_GAP来避免重复请求
// 默认是500秒，基本上不会出现失效的情况
nodeWeixinAuth.TIME_GAP = 60;

//手动得到accessToken
nodeWeixinAuth.tokenize(nodeWeixinSettings, app, function (error, json) {
  var accessToken = json.access_token;
});

router.get('/', function (req, res) {
  res.send("Hello! Willcome to AOK China!");
});

var menu = {
  "button": [
    {
      "type": "scancode_waitmsg",
      "name": "扫码比价",
      "key": "rselfmenu_0_0",
      "sub_button": []
    }
  ]
};

nodeWeixinMenu.create(nodeWeixinSettings, app, menu, function (error, data) {
  //data.errcode === 0
  //data.errmsg === 'ok'
});



// 微信服务器返回的ack信息是HTTP的GET方法实现的
router.get('/auth', function (req, res) {
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
router.post('/auth', function (req, res) {
  var reply = nodeWeixinMessage.reply;
  var message = req.body;
  console.log("Message: ");
  console.log(message);
});


module.exports = router;
