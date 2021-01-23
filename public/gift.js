function copyCode(e) {
  var target = e.target
  console.log("target", target)
  var copyText = document.getElementById("code");
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */
	document.execCommand("copy");
	console.log(target)
	target.innerText = "✓";
}

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};



function infoForPath(path, clean = 1) {
  if (path.length > 1) {
    var dir = path.split(/\//);
    var info = {};  
    dir.forEach( d => {
      if (d.length) {
        var components = d.split(":");
        var key = components.shift();
        var value = components.join(":");
        if (clean) value = value.replace(/__/g, "\n").replace(/_/g, " ");
        info[key] = decodeURIComponent(value);  
      }
    })
    return info;
  } else {
    return undefined;
  }
}

var trackEvents = false;
var root = document.getElementById("main-container")
window.addEventListener("load", update);
window.addEventListener("hashchange", update);
function update() {
  var hash = window.location.hash;
  window.giftData = infoForPath(window.location.pathname);

  if (hash.length) {
    var dataString = hash.substring(1).replace(/\_/g,"") // Remove _, introduced every 300c to address a bug in iMessage url parsing
    let decodedHash = atob(dataString)
    if (!window.giftData) window.giftData = {};
    Object.assign(window.giftData, infoForPath(decodedHash, false));
  }

  console.log("RENDERING", window.giftData)

  window.onclick = undefined;
  window.onwheel = undefined;

  
  var theme = giftData ? giftData.theme : undefined;


  
  if (theme) {
    setTheme(theme)
  } else {
    document.body.classList.remove("loading");
    document.body.classList.add("default");
  }

  if (hash == "#edit") {
    m.render(root, m(editView));
  } else if (window.giftData) {
    m.render(root, m(cardView, {data:window.giftData}));
    //window.onclick = onPointerDown;
    // window.onwheel = onWheel;
    flipCard();
  } else {

    m.render(root, m(indexView));
  } 
  if (giftData && giftData.template) {
    document.body.classList.add(giftData.template);
    document.body.classList.remove("default");
  }
}

function setTheme(theme) {

  if (theme.startsWith("http")) { // Image URL
    var imageSrc = theme;

    var bgImg = new Image();
    bgImg.onload = function(){
      document.body.classList.remove("loading");
    };
    bgImg.onerror = function() {
      document.body.classList.remove("loading");
      document.body.classList.add("default");
    }
    bgImg.src = imageSrc;

    theme = `#background { background-image:url(${theme}) }`
  } else if (theme.includes("{")) { // Fully qualified CSS
    document.body.classList.remove("loading");
  } else { // background declaration (picks up background colors)
    document.body.classList.remove("loading");

    theme = `#background { background:${theme} }`
  }

  console.log("THEME", theme)
  document.getElementById("theme").textContent = theme;
  document.body.classList.remove("default");

}

var supressTimeout = undefined;
function onWheel(e) {
  if (!supressTimeout && Math.abs(e.deltaY) > 0) {
    flipCard(e)
  }
  clearTimeout(supressTimeout)
  supressTimeout = setTimeout(e => {
    supressTimeout = undefined;
  }, 200)
};

function onPointerDown(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!supressTimeout) {
    if (e.target.closest(".noflip")) {
    } else {
      flipCard(e)
    }
  }
};

window.onpointermove = function(e) {
  // moving the slider: listen on the thumb, as all pointer events are retargeted to it
  //console.log("move", e);
  // console.log(e.movementY);
  // if (!supressWheel && Math.abs(e.movementY) > 3) {
  //   supressWheel = true;
  //   flipCard(e)
  //   setTimeout(e => { supressWheel = false}, 1000)
  // }

};

function cleanText(t) {
  return t.replace(/\n/g, "__").replace(/ /g, "_")
}

function submit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const value = data.get('to');
  var url = "/";
  var showFields = ["to", "from"]
  var hideFields = ["note", "link", "code", "info", "item", "theme"]
  var showComponents = [];
  var hideComponents = [];
  showFields.forEach((f) => {
    let value = data.get(f);  
    if (value.length) showComponents.push(f + ":" + encodeURIComponent(cleanText(value)))
  });
  hideFields.forEach((f) => {
    let value = data.get(f);  
    if (value) hideComponents.push(f + ":" + encodeURIComponent(value))
  });

  var hiddenContent = btoa(hideComponents.join("/")).replace(/=/g,"")
  var matches = hiddenContent.match(/.{1,300}/g);
  if (matches) hiddenContent = matches.join("_")

  if (hiddenContent.length) showComponents.push("#" + hiddenContent)
  url += showComponents.join("/");
  
  console.log("URL", url)
  if (url.length)
    window.open(url,'_blank');
};






var flips = -1;
var tilt = 0;
function flipCard(e) {
  window.scroll({
    top: 0, 
    left: 0, 
    behavior: 'smooth'
  });

  if (!giftData.info && !giftData.item && !giftData.link && !giftData.code) return;

  var direction = 1;
  if (e && (e.deltaY || e.movementY) < 0) direction = -1;

  flips += direction;
  var flipped = flips % 2
  tilt = (Math.random()) * 5 * ( flipped ? 1 : -1)

    var card = document.getElementById("card-body");
    card.classList.toggle("flipped", flipped)
    card.style.transform = `translateY(${flips % 2 ? direction * -10 + "%" : "0"}) rotateZ(${tilt}deg) rotateX(${flips * 180}deg)` 
    card.style.transform = `rotateZ(${tilt}deg) rotateX(${flips * 180}deg)` 
  }

  function copyCode(code) {
    copyToClipboard(code);
    document.getElementById("copy").innerText = "✓";
    setTimeout(e => {document.getElementById("copy").innerText = "COPY";}, 5000)
  }
  function openLink(link) {
    document.getElementById("link").innerText = "✓";
    setTimeout(e => {document.getElementById("link").innerText = "GET";}, 5000)

    setTimeout( e => { window.open(link,'_blank');},150)
  }

function cardView(initialVnode) {
    var flipped = false;
    return {
        view: function(vnode) {
          var data = vnode.attrs.data

            if (data.link && !data.link.startsWith("http")) data.link = "https://" + data.link
            var url = data.link ? new URL(data.link) : undefined
            
            // var infoIsLink = data.item.startsWith("http");
            var scale =  data.note ? Math.min(Math.max(50 / data.note.length, 0.666), 1.5) * 100 : 100;
            
            return [
              m("div#background.background"),
              m("div#foreground.foreground",  {onclick: onPointerDown}),
              m("div.gift-container.card#gift-container" + (flipped ? ".flipped" : ""), {
                  // onclick: flipCard
                }, 
                m("div.card-body#card-body",  {onclick: onPointerDown},
                  m("div#front.card-face",
                    !data.note ? undefined :
                    m("div.note", {style:`font-size:${scale}%`, onclick: onPointerDown}, data.note),
                    !data.from ? undefined :
                    m("div.from", "—" + data.from),
                  ),
                  m("div#back.card-face" ,
                    m("div.gift-image", data.item ? {style: `background-image:url(/image?url=${data.item})`} :undefined ),
                    m("div.info-container", data.info),
                     
                    // !data.from ? undefined :
                    // m("div.from-back", "FROM: ", data.from),
                    // !data.to ? undefined :
                    // m("div.to", "TO: ", data.to),

                    !data.code ? undefined :
                    m("div.code-container.noflip", {onclick: (e) => { copyCode(data.code); e.stopPropagation(); }},
                      m("div.code-field", data.code),
                      m("button#copy","Copy"),
                    ),
                    !data.link ? undefined :
                    m("div.link-container.noflip",  {onclick: e => { openLink(data.link)}},
                    m("div.host", (new URL(data.link)).hostname.split(".").slice(-2).join(".")),
                    m("button#link", "GET")
                    ),
                  )
                )
              )];

        }
    }
}


var indexView = {
  view: function(vnode) {
    return [
      m("div#background.background"),
      m("div#foreground.foreground"),
      m("div.card", 
      m("div#intro.card-face", 
    
        m('img#intro-icon', {src:'favicon.svg'}),
        m('div#intro-info', 
          'Send messages, gift codes, and more with a tiny card.',
          m('p'),
          m('button#new', {onclick: function(){ location.href='#edit' }}, "CREATE")
        )
      ))
    ]
  }
}

function editView(initialVnode) {
  var themes = 
  ["🦓", "stripes",
  "🍄", "dots",
  "✨", "stars",
  "☀️", "burst",
  "🧸", "animals",
  "🦖", "dinosaurs",
  "🐟", "fish",
  "🌼", "flowers",
  "🌱", "leaves",
  "❄️", "snow",
  "⚽️", "sports",
  "🌈", "pride"]
  

  return {
      view: function(vnode) {

          // var themeElements = []
          
          // for (var i = 0; i < themes.length; i+=2) {
          //   let theme = themes[i + 1]
          //   let el = m("div.theme", {id: "theme-" + theme, title: theme,
          //   onmouseover: e => {
          //     console.log(theme)
          //     document.body.className = "theme-" + theme;
          //     document.body.style = `
          //     --background-color: #1298e5;
          //     --foreground-color: radial-gradient(#006465, #1298e5);
          //     `
          //   }}, themes[i])
          //   themeElements.push(el);
          // }

          return [
            m("div#background.background"),
            m("div#foreground.foreground"),
      
            m("div.card", 
            m("div#edit.card-face", 
              m("form.edit-content#form", {onsubmit:submit}, 
                m("div.formrow",
                  m("div.formel",
                    m("label", {for:"to-field"}, "To", m("span.hint", " recipient or blank")),
                    m("input#to-field", {name:"to", placeholder:"Peaches", size:6}, "")
                  ),
                  m("div.formel",
                    m("label", {for:"from-field"}, "From"),
                    m("input#from-field", {name:"from", placeholder:"Pistacio", size:6})
                  ),
                  m("div.formel",
                  m("label", {for:"re-field"}, "Chat Title", m("span.hint", " in preview")),
                  m("input#re-field", {name:"re", placeholder:"A tiny.gift for you", size:6})
                ),

                ),
                m("div.formrow",
                  m("div.formel",
                    m("label", {for:"note-field"}, "Front Note",  m("span.hint", ", sweet nothings")),
                    m("textarea#note-field", {name:"note", placeholder:"Thinking of you, always", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"info-field"}, "Back Note", m("span.hint", ", a description")),
                    m("textarea#info-field", {name:"info", placeholder:"A token of my affection", size:8})
                  ),
                ),
                m("div.formrow",
                  m("div.formel",
                    m("label", {for:"link-field"}, "Link", m("span.hint", " to redeem or open gift")),
                    m("input#link-field", {name:"link", placeholder:"https://example.com/redeem", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"code-field"}, "Code", m("span.hint", " to type in, if any")),
                    m("input#code-field", {name:"code", placeholder:"1618-0339-8874-9894", size:8})
                  ),
                ),
                m("div.formrow",
                  m("div.formel",
                    m("label", {for:"item-field"}, "Item", m("span.hint", ", a link to the item")),
                    m("input#item-field", {name:"item", placeholder:"https://example.com/product", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"theme-field"}, "Theme", m("span.hint", ", color, image URL, or css")),
                    m("input#theme-field", {type:"text", name:"theme", placeholder:"", size:8, oninput: e => {setTheme(e.target.value)}})
                  )
                ),
                m("div",m("button", {type:"submit", style:"float:left;"}, "PREVIEW"))
              )
            )
            )];

      }
  }
}