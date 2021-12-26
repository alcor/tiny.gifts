const functions = require('firebase-functions');
const cheerio = require('cheerio');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

function infoForPath(path) {
  if (path.length > 1) {
    var dir = path.split(/\//);
    var info = {};  
    dir.forEach( d => {
      if (d.length) {
        var components = d.split(":");
        var key = components.shift();
        var value = components.join(":");
        value = value.replace(/__/g, "\n").replace(/_/g, " ");
        info[key] = decodeURIComponent(value);  
      }
    })
    return info;
  } else {
    return undefined;
  }
}

function cleanText(t) {
  if (!t) return "";
  t = t.replace(/__/g, "\n").replace(/_/g, " ");
  return encodeURIComponent(t);
}

exports.index = functions.https.onRequest((req, res) => {
  var title = "tiny.gifts";
  var pageTitle = title;
  var description = "a tiny.gift";

  var info = infoForPath(req.path);
  var image = ""
  if (info) {
    if (info.to) title = `to:${info.to}, from:${info.from}`;
    if (info.re) {
      description = pageTitle = info.re;
    }
    image = `${req.protocol}://${req.get('host')}/og?to=${cleanText(info.to)}&from=${cleanText(info.from)}&re=${cleanText(info.re)}`;
  }
  res.status(200).send(`<!doctype html>
<head>
  <title>${title}</title>
  <meta name="theme-color" content="#2d2d2d">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${image}">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=block" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=block" rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="/gift.css">
  <script src="/mithril.js"></script>
  <style id="theme"></style>
</head>
<body class="default loading"><div id="main-container"></div></body>
<script src="/gift.js"></script>
</html>`);
});

exports.image = functions.https.onRequest((req, res) => {
  https.get(req.query.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0' } }, function(res2) {
    res2.setEncoding('utf8')  
    var data = ""
    res2.on("data", function(chunk) { data += chunk; });
    res2.on("end", function() { 
      var $ = cheerio.load(data);
      var result = $('meta[property="og:image"]').attr('content')
                || $('meta[property="og:image:secure_url"]').attr('content');
      res.redirect(302, result);
      res.end();
     });    
  }).on('error', function(e) {
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
  const canvas = createCanvas(720, 720);
  const ctx = canvas.getContext('2d');

  loadImage('img/stripes.svg').then((image) => {

  var width = canvas.width;
  var height = canvas.height;

  if (info) {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
  
    var cardW = 856 / 1.6;
    var cardH = 540 / 1.6;
    ctx.fillStyle = "rgba(220,220,220,0.4)"
    ctx.fill(); 

    ctx.save()
    ctx.globalAlpha = 0.05;
    ctx.drawImage(image, 0, 0, width, height) 
    ctx.restore();

    // var radial = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.hypot(canvas.width/2, canvas.height/2))
    // radial.addColorStop(0, "white");
    // radial.addColorStop(1, "white");
    // ctx.fillStyle = radial

    // var linear = ctx.createLinearGradient(0, 0, width, height);
    // linear.addColorStop(0, "#009FFF");
    // linear.addColorStop(1, "rgba(47, 236, 145, 1.0)");
    // ctx.fillStyle = linear
    // ctx.globalCompositeOperation = "destination-over"
    // ctx.globalAlpha = 1.0;
    // ctx.fill();
    // ctx.restore()

    var tilt = (Math.random() - 0.5) * 5
    ctx.translate(width/2, height/2);
    ctx.rotate(tilt * Math.PI / 180);
    ctx.translate(-width/2, -height/2);

    var x = (width - cardW) / 2;
    var y = (height - cardH) / 2;
    ctx.fillStyle = "white"

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowOffsetY = cardH / 20;
    ctx.shadowBlur = 15;
    ctx.globalCompositeOperation = "hard-light"

    roundRect(ctx, x, y, cardW, cardH, 33).fill();
    ctx.restore();

    var size = cardH/5;
    ctx.font = `700 ${size}px Helvetica`;
    ctx.fillStyle = "black";
    
    ctx.fillText(info.re || "A tiny.gift\nfor you", x + size/2, y + size *1.5);
    ctx.font = `700 ${size/2}px Helvetica`;
    if (info.from && info.from != "undefined") ctx.fillText("—" + info.from, x + size/2, y + cardH - size/2);


  } else {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.fill();
  }
    
    res.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
    res.writeHead(200, {'Content-Type': 'image/png'});
    canvas.createPNGStream().pipe(res);
  })
});
