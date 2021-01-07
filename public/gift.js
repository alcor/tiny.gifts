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
        'Wrap messages, gift codes, and more in a nice design.',
        m('p'),
        m('button#new', {onclick: function(){ location.href='#edit' }}, "WRAP ONE")
      )
    )]
  }
}

function infoForPath(path) {
  var dir = path.split(/\//);
  console.log("dir", dir)
  if (dir.length > 0) {
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

var root = document.getElementById("main-container")
window.addEventListener("load", update);
window.addEventListener("hashchange", update);
function update() {
  var hash = window.location.hash;
  console.log("hash", hash, hash.length, );

  if (hash.length) {
    var dataString = hash.substring(1).replace(/\_/g,"")
    console.log(dataString)
    // Remove _, introduced every 300c to address a bug in iMessage url parsing
    let string = atob(dataString)
    Object.assign(window.giftData, infoForPath(string));
    console.log(string,window.giftData)
  }

  if (hash == "#edit") {
    m.render(root, m(editView));
  } else if (Object.keys(window.giftData).length > 0) {
    m.render(root, m(puzzleView, {data:window.giftData}));
  } else {
    m.render(root, m(indexView));
  } 

//   var canvas = document.getElementById('canvas'); 
//   var ctx = canvas.getContext('2d'); 
//   ctx.fillStyle = 'green'; 
//   ctx.fillRect(10, 10, 100, 100);
//   svgtest = svgtest.replace(/#6050DC/g, "cyan");
//   svgtest = svgtest.replace(/#C4C4C4/g, "red");
//   svgtest = svgtest.replace(/#/g, "%23")
//   // svgtest = "<svg viewBox='0 0 14 24' xmlns='http://www.w3.org/2000/svg' width='12px' height='18px'><path fill='rgb(13, 132, 254)' d='M2.1.1L0 2.2l8.3 8.3L9.8 12l-1.5 1.5L0 21.8l2.1 2.1L14 12z' /></svg>"
//   var backgroundImage = `url("data:image/svg+xml;charset=UTF-8,${svgtest}")`;
//   console.log("boo",backgroundImage)
// document.body.style.backgroundImage = backgroundImage;
// console.log("hoo", document.body.style.backgroundImage)



}


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
                  m("div.formel",
                    m("label", {for:"to-field"}, "To", m("span.hint", " recipient or blank")),
                    m("input#to-field", {name:"to", placeholder:"Peaches", size:8}, "")
                  ),
                  m("div.formel",
                    m("label", {for:"from-field"}, "From"),
                    m("input#from-field", {name:"from", placeholder:"Pistacio", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"note-field"}, "Front Note",  m("span.hint", ", sweet nothings")),
                    m("textarea#note-field", {name:"note", placeholder:"Thinking of you, always", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"info-field"}, "Back Note", m("span.hint", ", a description of the gift")),
                    m("input#info-field", {name:"info", placeholder:"", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"code-field"}, "Code", m("span.hint", " to paste into site")),
                    m("input#code-field", {name:"code", placeholder:"1618-0339-8874-9894", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"link-field"}, "Link", m("span.hint", " to redeem or open gift")),
                    m("input#link-field", {name:"link", placeholder:"https://store.example.com/redeem", size:8})
                  ),
                  m("div.formel",
                    m("label", {for:"item-field"}, "Item", m("span.hint", ", a link to the item (for imagery)")),
                    m("input#item-field", {name:"item", placeholder:"", size:8})
                  ),
                  m("button", {type:"submit"}, "PREVIEW")
                )
              )];

        }
    }
}

function puzzleView(initialVnode) {
    var flipped = false;
    return {
        view: function(vnode) {
          console.log("attrs:", vnode.attrs);
          var data = vnode.attrs.data
          console.log("flipped", flipped);

            if (data.link && !data.link.startsWith("http")) data.link = "https://" + data.link
            var url = data.link ? new URL(data.link) : undefined
            
            // var infoIsLink = data.item.startsWith("http");
            var scale =  data.note ? Math.min(Math.max(60 / data.note.length, 1), 3) * 100 : 100;
            
            return [
              m("img.blob#blue", {src:"/img/blue.svg"}),
              m("img.blob#red", {src:"/img/red.svg"}),
              m("img.blob#pink", {src:"/img/pink.svg"}),
              m("div.gift-container.card#gift-container" + (flipped ? ".flipped" : ""), {
                  onclick: (e) => { 
                    console.log(e.target)
                    flipped = !flipped; 
                    document.getElementById("gift-container").classList.toggle("flipped");
                  }
                }, 
                m("div.card-body",
                  m("div.gift-front.card-face",
                    !data.note ? undefined :
                    m("div.note", {style:`font-size:${scale}%`}, data.note),
                    !data.from ? undefined :
                    m("div.from", "—" + data.from),
                  ),
                  m("div.gift-back.card-face" ,
                    m("div.gift-image", {style: `background-image:url(/image?url=${data.item})`}),
                    m("div.info-container", data.info),
                     
                    // !data.from ? undefined :
                    // m("div.from-back", "FROM: ", data.from),
                    // !data.to ? undefined :
                    // m("div.to", "TO: ", data.to),

                    !data.code ? undefined :
                    m("div.code-container",
                      m("div.code-field", {contenteditable:"true", onclick: function(e) {copyToClipboard(data.code); e.stopPropagation();}}, m.trust(data.code)),
                      m("button#copy", {onclick: function(e){ copyToClipboard(data.code); document.getElementById("copy").innerText = "✓"; e.stopPropagation(); }}, "Copy"),
                    ),
                    !data.link ? undefined :
                    m("div.link-container", 
                    m("div.host", (new URL(data.link)).hostname.split(".").slice(-2).join(".")),
                    m("button#link", {onclick: e => { window.open(data.link,'_blank'); e.stopPropagation(); }}, "GET")
                    ),
                  )
                )
              )];

        }
    }
}