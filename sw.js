if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return s[e]||(r=new Promise(async r=>{if("document"in self){const s=document.createElement("script");s.src=e,document.head.appendChild(s),s.onload=r}else importScripts(e),r()})),r.then(()=>{if(!s[e])throw new Error(`Module ${e} didn’t register its module`);return s[e]})},r=(r,s)=>{Promise.all(r.map(e)).then(e=>s(1===e.length?e[0]:e))},s={require:Promise.resolve(r)};self.define=(r,i,c)=>{s[r]||(s[r]=Promise.resolve().then(()=>{let s={};const f={uri:location.origin+r.slice(1)};return Promise.all(i.map(r=>{switch(r){case"exports":return s;case"module":return f;default:return e(r)}})).then(e=>{const r=c(...e);return s.default||(s.default=r),s})}))}}define("./sw.js",["./workbox-80efdfd1"],(function(e){"use strict";e.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"1975e423.js",revision:"26a37c164c8705b56afedfb9260f4c9f"},{url:"20ba88b0.js",revision:"12fc2f994dd45d5c9d07329230d0dfc5"},{url:"32fa8a71.js",revision:"e5e9ef9517ef7819b6b0a6f8ccaee730"},{url:"33aacabd.js",revision:"f75b93d8b8ecf53068369c18c236ca10"},{url:"50234788.js",revision:"23ef725bd0850105d04c3c83e2999313"},{url:"5e41fe79.js",revision:"fb59a26ebf21c92468a98ed8c6e47a9d"},{url:"7e0771ab.js",revision:"c9de5f47843869b4648df11f16b968c0"},{url:"953d27ae.js",revision:"ac063f0b17299e29fb3f4d8a6e7d01e9"},{url:"ad4e6156.js",revision:"1ca8cfccbc6107139dea966691b65543"},{url:"assets/css/editor.min.css",revision:"9abae42b09276eafab4e3975bfb449cb"},{url:"dfd77799.js",revision:"9e4b4a63121c2a35dc3894db9785d9a5"},{url:"e94213f9.js",revision:"1fcfce7c61f679622900394f6dcb23bf"},{url:"eddf9dc6.js",revision:"ea383e6df0ed3556520c917869b26578"},{url:"f049372d.js",revision:"e1228700f6eef6e02f789485a8e16ea2"},{url:"index.html",revision:"aec0cd896b5f9909c482a01b10e8aee6"}],{}),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("/index.html"))),e.registerRoute("polyfills/*.js",new e.CacheFirst,"GET")}));
//# sourceMappingURL=sw.js.map
