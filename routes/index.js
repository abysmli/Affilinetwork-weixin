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
  console.log("Message: ");
  console.log(message);
  if (message.xml !== undefined) {
    if (message.xml.ScanCodeInfo !== undefined) {
      try {
        var scanCodes = message.xml.ScanCodeInfo.ScanResult.split(",");
      } catch (err) {
        var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "请扫描产品条码！");
        return res.send(text);
      }

      console.time("HTTPRequest:");
      var eanCode = scanCodes[1].length == 12 ? "0" + scanCodes[1] : scanCodes[1];
      request('http://allhaha.com/weixin/prerequest?value=' + eanCode, function (error, response, body) {
        console.timeEnd("HTTPRequest:");
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          console.log("Result: ");
          console.log(result);
          if (result.Result == 'success') {
            console.log('Success');
            var description = result.Brand === "" ? "" : '品牌： ' + result.Brand + '\n';
            description += result.Price === "" ? "" : '参考价格： ' + result.Price + ' 欧元\n';
            description += '产品EAN代码： ' + eanCode;
            var news = reply.news(message.xml.ToUserName, message.xml.FromUserName, [{
              title: result.Title,
              description: description,
              picUrl: result.Image,
              url: 'http://allhaha.com/weixin/ean?value=' + eanCode + '&from=' + message.xml.FromUserName + '&type=barcode',
            }]);
            return res.send(news);
          } else {
            console.log('Failed');
            var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, "产品未找到，我们将及时添加!");
            return res.send(text);
          }
        }
      });

    } else if (message.xml.Event == 'subscribe') {
      var text = reply.text(message.xml.ToUserName, message.xml.FromUserName, '欢迎来到"欧哈哈"购物王国，欧哈哈，为您发现最低！\n"欧哈哈"比价网www.allhaha.com为欧洲第一款全中文商品比价网站。齐全的商品信息，中文的介绍评论，清晰的价格对比，简明的购物链接，"欧哈哈"为您打造在欧洲最便捷的中文比价服务和线上购物体验。在这里，您可以了解到欧洲任何一款产品最低的价格信息和购买链接；在这里，只为您发现最低。当然，我们的微信公众号“欧哈哈”也同步上线，并于新春佳节推出了"扫码比价"功能，欧洲所有商品一扫即出，中文的服务，便捷的操作，价格一目了然。\n现我们推出新年大抽奖，请扫如下活动码进入商品页面，点击用户评论即可参与赢取该商品活动。');
      return res.send(text);
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
