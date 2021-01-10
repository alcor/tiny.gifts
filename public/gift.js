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

var tileView= {}
var indexView = {
  view: function(vnode) {
    return [
      m('#intro',
    
      m('img#intro-icon', {src:'favicon.svg'}),
      m('div#intro-info', 
        'Send messages, gift codes, and more with a tiny card.',
        m('p'),
        m('button#new', {onclick: function(){ location.href='#edit' }}, "CREATE")
      )
    )]
  }
}

function infoForPath(path) {
  var dir = path.split(/\//);
  if (dir.length > 0) {
    var info = {};  
    dir.forEach( d => {
      if (d.length) {
        var components = d.split(":");
        var key = components.shift()
        info[key] = decodeURIComponent(components.join(":"));  
      }
    })
    return info;
  } else {
    return undefined;
  }
}

var root = document.getElementById("main-container")
window.addEventListener("load", update);
window.addEventListener("hashchange", update);
function update() {
  var hash = window.location.hash;
  if (hash.length) {
    var dataString = hash.substring(1).replace(/\_/g,"")
    // Remove _, introduced every 300c to address a bug in iMessage url parsing
    let string = atob(dataString)
    Object.assign(window.giftData, infoForPath(string));
  }

  if (hash == "#edit") {
    m.render(root, m(editView));
  } else if (Object.keys(window.giftData).length > 0) {
    m.render(root, m(puzzleView, {data:window.giftData}));
    flipCard();
  } else {
    m.render(root, m(indexView));
  } 
}

document.addEventListener('scroll', function(e) {
    console.log(e);
  e.preventDefault();
});


function submit(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const value = data.get('to');
  var url = "/";
  var showFields = ["to", "from"]
  var hideFields = ["note", "link", "code", "info", "item"]
  var showComponents = [];
  var hideComponents = [];
  showFields.forEach((f) => {
    let value = data.get(f);  
    if (value.length) showComponents.push(f + ":" + encodeURIComponent(value))
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


function editView(initialVnode) {
    return {
        view: function(vnode) {
            return [
              m("div.edit-container", 
                m("form.edit-content#form", {onsubmit:submit}, 
                  m("div.formrow",
                    m("div.formel",
                      m("label", {for:"from-field"}, "From"),
                      m("input#from-field", {name:"from", placeholder:"Pistacio", size:8})
                    ),
                    m("div.formel",
                      m("label", {for:"to-field"}, "To", m("span.hint", " recipient or blank")),
                      m("input#to-field", {name:"to", placeholder:"Peaches", size:8}, "")
                    ),
                  ),
                  m("div.formrow",
                    m("div.formel",
                      m("label", {for:"note-field"}, "Front Note",  m("span.hint", ", sweet nothings")),
                      m("textarea#note-field", {name:"note", placeholder:"Thinking of you, always", size:8})
                    ),
                    m("div.formel",
                      m("label", {for:"info-field"}, "Back Note", m("span.hint", ", a description of the gift")),
                      m("textarea#info-field", {name:"info", placeholder:"A token of my affection", size:8})
                    ),
                  ),
                  m("div.formrow",
                    m("div.formel",
                      m("label", {for:"link-field"}, "Link", m("span.hint", " to redeem or open gift")),
                      m("input#link-field", {name:"link", placeholder:"https://example.com/redeem", size:8})
                    ),
                    m("div.formel",
                      m("label", {for:"item-field"}, "Item", m("span.hint", ", a link to the item (for imagery)")),
                      m("input#item-field", {name:"item", placeholder:"https://example.com/product", size:8})
                    ),
                  ),
                  m("div.formrow",
                    m("div.formel",
                      m("label", {for:"code-field"}, "Code", m("span.hint", " to paste into site")),
                      m("input#code-field", {name:"code", placeholder:"1618-0339-8874-9894", size:8})
                    )//,
                    // m("div.formel",
                    //   m("label", {for:"code-field"}, "Theme", m("span.hint", " ")),
                      
                    // )
                  ),
                  m("div",m("button", {type:"submit", style:"float:left;"}, "PREVIEW"))
                )
              )];

        }
    }
}


var flips = -1;
var tilt = 0;
function flipCard(e) {
  flips++;
  var flipped = flips % 2
  tilt = (Math.random()) * 5 * ( flipped ? 1 : -1)

    var card = document.getElementById("card-body");
    card.classList.toggle("flipped", flipped)
    card.style.transform = `translateY(${flips % 2 ? "100%" : "0"}) rotateZ(${tilt}deg) rotateX(${flips * 180}deg)` 
  }

  function copyCode(code) {
    copyToClipboard(code);
    document.getElementById("copy").innerText = "✓";
    setTimeout(e => {document.getElementById("copy").innerText = "COPY";}, 5000)
  }

function puzzleView(initialVnode) {
    var flipped = false;
    return {
        view: function(vnode) {
          var data = vnode.attrs.data

            if (data.link && !data.link.startsWith("http")) data.link = "https://" + data.link
            var url = data.link ? new URL(data.link) : undefined
            
            // var infoIsLink = data.item.startsWith("http");
            var scale =  data.note ? Math.min(Math.max(60 / data.note.length, 1), 3) * 100 : 100;
            
            return [
              m("div.gift-container.card#gift-container" + (flipped ? ".flipped" : ""), {
                  onclick: flipCard
                }, 
                m("div.card-body#card-body",
                  m("div.gift-front.card-face",
                    !data.note ? undefined :
                    m("div.note", {style:`font-size:${scale}%`}, data.note),
                    !data.from ? undefined :
                    m("div.from", "—" + data.from),
                  ),
                  m("div.gift-back.card-face" ,
                    m("div.gift-image", data.item ? {style: `background-image:url(/image?url=${data.item})`} :undefined ),
                    m("div.info-container", data.info),
                     
                    // !data.from ? undefined :
                    // m("div.from-back", "FROM: ", data.from),
                    // !data.to ? undefined :
                    // m("div.to", "TO: ", data.to),

                    !data.code ? undefined :
                    m("div.code-container", {onclick: (e) => { copyCode(data.code); e.stopPropagation(); }},
                      m("div.code-field", data.code),
                      m("button#copy","Copy"),
                    ),
                    !data.link ? undefined :
                    m("div.link-container",  {onclick: e => { window.open(data.link,'_blank'); e.stopPropagation(); }},
                    m("div.host", (new URL(data.link)).hostname.split(".").slice(-2).join(".")),
                    m("button#link", "GET")
                    ),
                  )
                )
              )];

        }
    }
}