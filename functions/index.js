const functions = require('firebase-functions');
const cheerio = require('cheerio');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');


function infoForPath(path) {
  var dir = path.split(/\//);
  if (dir.length > 1) {
    var info = {};  
    dir.forEach( d => {
      if (d.length) {
        var components = d.split(":");
        console.log(components)
        var key = components.shift()
        info[key] = decodeURIComponent(components.join(":"));  
      }
    })
    return info;
  } else {
    return undefined;
  }
}

exports.index = functions.https.onRequest((req, res) => {
  console.log(req.path)
  var error;
  var info = infoForPath(req.path);
  if (info) {
    var url = info.link ? new URL(info.link) : undefined;
    var title = `to:${info.to}, from:${info.from}`;

    try {
      res.status(200).send(`<!doctype html>
<head>
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=block" rel="stylesheet">
<link rel="stylesheet" type="text/css" href="/gift.css">
<title>tiny.gifts</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
<meta property="og:title" content="${title}">
<meta property="og:description" content="${"a tiny.gift"}">
<meta property="og:type" content="website">
<meta property="og:image" content="/og?to=${info.to}&from=${info.from}">
<script src="/mithril.js"></script>
</head>

<script> window.giftData = ${JSON.stringify(info)} </script>
<div id="main-container"></div>
<script src="/gift.js"></script>
</html>`);
      return;
    } catch (e) {
      error = e;
    }
  }

  res.status(200).send(`<!doctype html>
    <head>
      <link rel="stylesheet" type="text/css" href="/index.css">
      <title>tiny.gifts</title>
    </head>
    <body style="font-family:sans-serif">
    <div class="content">
    <h1>tiny.gifts</h1>
    This site lets you share a gift with someone.
    <br>When you send these via Slack, SMS, and other modern chat clients,

    <div class="error">${error ? error.message : ""}</div>
    </div>
    </body>
    </html>`);

});

exports.image = functions.https.onRequest((req, res) => {
  https.get(req.query.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0' } }, function(res2) {
    console.log("data-url", req.query.url)
    res2.setEncoding('utf8')  
    var data = ""
    res2.on("data", function(chunk) { data += chunk; });
    res2.on("end", function() { 
      console.log("data", data)
      var $ = cheerio.load(data);
      var result = $('meta[property="og:image"]').attr('content')
                || $('meta[property="og:image:secure_url"]').attr('content');
      res.redirect(302, result);
      res.end();
     });    
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    res.status(403).send(e.message)
    res.end();
  });
});


var roundRect = function (ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  return ctx;
}
exports.og = functions.https.onRequest((req, res) => {
  const info = req.query;
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  var width = canvas.width;
  var height = canvas.height;

  if (info) {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    
    var grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, "#009FFF");
    grd.addColorStop(1, "rgba(47, 236, 145, 1.0)");
    ctx.fillStyle = grd
    ctx.fill();


    var cardW = 856 / 1.5;
    var cardH = 540 / 1.5;


    ctx.rotate(-3 * Math.PI / 180);
    ctx.translate(0,cardH/50);
    var x = (width - cardW) / 2;
    var y = (height - cardH) / 2;
    ctx.fillStyle = "white"

ctx.save();
ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
ctx.shadowOffsetY = cardH / 20;
ctx.shadowBlur = 15;
//ctx.globalCompositeOperation = "hard-light"

roundRect(ctx, x, y, cardW, cardH, 33).fill();
ctx.restore();

    var size = cardH/5;
  ctx.font = `700 ${size}px Helvetica`;
  ctx.fillStyle = "black";
  
  ctx.fillText("A tiny.gift\nfor you", x + size/2, y + size *1.5);
  ctx.font = `700 ${size/2}px Helvetica`;
  if (info.from && info.from != "undefined") ctx.fillText("—" + info.from, x + size/2, y + cardH - size/2);


  } else {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fill();
      
  }

  // loadImage('favicon.png').then((image) => {
    // ctx.drawImage(image, 50, 0, 70, 70)  
    
    res.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
    res.writeHead(200, {'Content-Type': 'image/png'});
    canvas.createJPEGStream().pipe(res);
  // })
});
