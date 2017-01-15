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
  id: 'wx499abe9f9831315b',
  secret: '391dbdd46e663f8e71f53850f6ce1585',
  token: 'allhaha'
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
          "type": "view",
          "name": "EAN查询录入",
          "url": "http://www.allhaha.com/EAN/",
          "sub_button": []
        }
      ]
    }
  ]
};

nodeWeixinMenu.create(nodeWeixinSettings, app, menu, function (error, data) {
  //data.errcode === 0
  //data.errmsg === 'ok'
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
  var reply = nodeWeixinMessage.reply;
  var message = req.body;
  if (message.xml !== undefined) {
    if (message.xml.ScanCodeInfo !== undefined) {
      var scanCodes = message.xml.ScanCodeInfo.ScanResult.split(",");
      if (scanCodes[0] != "EAN_13") {
        var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "抱歉，只能扫EAN13国际码！");
        return res.send(text);
      } else {
        //回复图文
        request('http://allhaha.com/weixin/prerequest?value=' + scanCodes[1], function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var result = JSON.parse(body);
            console.log(result);
            if (result.Result == 'success') {
              var news = reply.news(message.xml.ToUserName, message.xml.FromUserName, [{
                title: result.Title,
                description: '品牌： ' + result.Brand + '\n' + '参考价格： ' + result.Price + ' 欧元\n' + '产品EAN代码： ' + scanCodes[1],
                picUrl: result.Image,
                url: 'http://allhaha.com/weixin/ean?value=' + scanCodes[1] + '&from=' + message.xml.FromUserName + '&type=barcode',
              }]);
              return res.send(news);
            } else {
              var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "产品未找到，我们将及时添加!");
              return res.send(text);
            }
          }
        });
      }
    } else {
      var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "请扫描产品条码！");
      return res.send(text);
    }
  } else {
    var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "请扫描产品条码！");
    return res.send(text);
  }
});

module.exports = router;
