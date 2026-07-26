(()=>{var e={};e.id=959,e.ids=[959],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},2341:(e,r,s)=>{"use strict";s.r(r),s.d(r,{GlobalError:()=>l.a,__next_app__:()=>u,pages:()=>d,routeModule:()=>p,tree:()=>o});var t=s(260),a=s(8203),n=s(5155),l=s.n(n),i=s(7292),c={};for(let e in i)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>i[e]);s.d(r,c);let o=["",{children:["search",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2524)),"/home/z/my-project/apps/frontend/src/app/search/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,1354)),"/home/z/my-project/apps/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,9116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,1485,23)),"next/dist/client/components/unauthorized-error"]}],d=["/home/z/my-project/apps/frontend/src/app/search/page.tsx"],u={require:s,loadChunk:()=>Promise.resolve()},p=new t.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/search/page",pathname:"/search",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},611:(e,r,s)=>{Promise.resolve().then(s.bind(s,2524))},5035:(e,r,s)=>{Promise.resolve().then(s.bind(s,7200))},2379:(e,r,s)=>{"use strict";s.d(r,{A:()=>t});let t=(0,s(1680).A)("BadgeCheck",[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},6397:(e,r,s)=>{"use strict";s.d(r,{A:()=>t});let t=(0,s(1680).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},1575:(e,r,s)=>{"use strict";s.d(r,{A:()=>t});let t=(0,s(1680).A)("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]])},6873:(e,r,s)=>{"use strict";s.d(r,{A:()=>t});let t=(0,s(1680).A)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])},4269:(e,r,s)=>{"use strict";s.d(r,{A:()=>t});let t=(0,s(1680).A)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},7200:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>x});var t=s(5512),a=s(8009),n=s(8531),l=s.n(n),i=s(8184),c=s(3335),o=s(400),d=s(6076),u=s(7563),p=s(6873),h=s(4269),m=s(2379);function x(){return(0,t.jsx)(c.G,{children:(0,t.jsx)(f,{})})}function f(){let{t:e}=(0,o.s)(),[r,s]=(0,a.useState)(""),{data:n,loading:c}=(0,i.IT)(d.yD,{variables:{q:r,limit:30},skip:r.trim().length<2}),x=n?.searchUsers||[];return(0,t.jsxs)("div",{className:"py-4",children:[(0,t.jsx)("h1",{className:"text-2xl font-bold mb-4 px-2",children:e("nav.search")}),(0,t.jsxs)("div",{className:"relative mb-6 px-2",children:[(0,t.jsx)(p.A,{className:"absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lenz-gray"}),(0,t.jsx)("input",{value:r,onChange:e=>s(e.target.value),placeholder:e("search.placeholder"),className:"w-full h-11 ps-11 pe-10 rounded-lg bg-gray-100 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-lenz-border",autoFocus:!0}),r&&(0,t.jsx)("button",{onClick:()=>s(""),className:"absolute end-3 top-1/2 -translate-y-1/2 p-1 text-lenz-gray hover:text-lenz-dark",children:(0,t.jsx)(h.A,{className:"w-4 h-4"})})]}),r.trim().length<2?(0,t.jsx)("p",{className:"text-center text-lenz-gray py-12 text-sm",children:e("search.placeholder")}):c?(0,t.jsx)("div",{className:"space-y-2 px-2",children:[void 0,void 0,void 0,void 0,void 0].map((e,r)=>(0,t.jsxs)("div",{className:"flex items-center gap-3 p-2 animate-pulse",children:[(0,t.jsx)("div",{className:"w-12 h-12 rounded-full bg-gray-200"}),(0,t.jsxs)("div",{className:"flex-1 space-y-2",children:[(0,t.jsx)("div",{className:"h-3 bg-gray-200 rounded w-1/3"}),(0,t.jsx)("div",{className:"h-2 bg-gray-200 rounded w-1/2"})]})]},r))}):0===x.length?(0,t.jsx)("p",{className:"text-center text-lenz-gray py-12 text-sm",children:e("search.noResults")}):(0,t.jsx)("ul",{className:"divide-y divide-lenz-border",children:x.map(e=>(0,t.jsx)("li",{children:(0,t.jsxs)(l(),{href:`/profile/${e.username}`,className:"flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors",children:[(0,t.jsx)(u.e,{src:e.avatarUrl,alt:e.username,size:"md"}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsxs)("div",{className:"flex items-center gap-1",children:[(0,t.jsx)("span",{className:"font-semibold text-sm truncate",children:e.username}),e.isVerified&&(0,t.jsx)(m.A,{className:"w-3.5 h-3.5 text-blue-500 fill-blue-500"})]}),(0,t.jsx)("p",{className:"text-xs text-lenz-gray truncate",children:e.fullName||e.username})]})]})},e.id))})]})}},3335:(e,r,s)=>{"use strict";s.d(r,{G:()=>k});var t=s(5512);s(8009);var a=s(9334),n=s(5414),l=s(8531),i=s.n(l),c=s(4195),o=s(400),d=s(7563),u=s(1680);let p=(0,u.A)("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);var h=s(6397),m=s(6873);let x=(0,u.A)("SquarePlus",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);var f=s(1575);let g=(0,u.A)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);var v=s(3042);let y=(0,u.A)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]),b=(0,u.A)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);function j(){let{t:e,locale:r,toggleLocale:s}=(0,o.s)(),{user:l,logout:u}=(0,n.A)(),j=(0,a.usePathname)();if((0,a.useRouter)(),!l)return null;let N=[{href:"/",icon:p,label:e("nav.home")},{href:"/explore",icon:h.A,label:e("nav.explore")},{href:"/search",icon:m.A,label:e("nav.search")},{href:"/create",icon:x,label:e("nav.create")},{href:"/direct",icon:f.A,label:e("nav.direct")},{href:`/profile/${l.username}`,icon:g,label:e("nav.profile")}],k=async()=>{await u()};return(0,t.jsxs)("aside",{className:(0,c.cn)("fixed top-0 bottom-0 z-30 flex flex-col border-r border-lenz-border bg-white","fa"===r?"right-0":"left-0","w-20 lg:w-64"),children:[(0,t.jsx)("div",{className:"flex items-center justify-center lg:justify-start h-20 px-4 lg:px-6 border-b border-lenz-border",children:(0,t.jsxs)(i(),{href:"/",className:"flex items-center gap-2",children:[(0,t.jsx)("div",{className:"w-9 h-9 rounded-xl bg-lenz-gradient flex items-center justify-center",children:(0,t.jsx)(v.A,{className:"w-5 h-5 text-white"})}),(0,t.jsx)("span",{className:"hidden lg:block text-2xl font-bold lenz-gradient-text",children:e("app.name")})]})}),(0,t.jsx)("nav",{className:"flex-1 px-2 lg:px-3 py-4 space-y-1",children:N.map(e=>{let r=j===e.href;return(0,t.jsxs)(i(),{href:e.href,className:(0,c.cn)("flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors",r&&"font-semibold"),title:e.label,children:[(0,t.jsx)(e.icon,{className:"w-6 h-6 shrink-0"}),(0,t.jsx)("span",{className:"hidden lg:inline text-base",children:e.label})]},e.href)})}),(0,t.jsxs)("div",{className:"px-2 lg:px-3 py-4 border-t border-lenz-border space-y-1",children:[(0,t.jsxs)("button",{onClick:s,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors",title:"fa"===r?"Switch to English":"تغییر به فارسی",children:[(0,t.jsx)(y,{className:"w-6 h-6 shrink-0"}),(0,t.jsx)("span",{className:"hidden lg:inline text-base",children:"fa"===r?"English":"فارسی"})]}),(0,t.jsxs)("button",{onClick:k,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors text-red-500",title:e("auth.logout"),children:[(0,t.jsx)(b,{className:"w-6 h-6 shrink-0"}),(0,t.jsx)("span",{className:"hidden lg:inline text-base",children:e("auth.logout")})]}),l&&(0,t.jsxs)(i(),{href:`/profile/${l.username}`,className:"flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-gray-100 w-full transition-colors",children:[(0,t.jsx)(d.e,{src:l.avatarUrl,alt:l.username,size:"sm"}),(0,t.jsx)("span",{className:"hidden lg:inline text-sm truncate",children:l.username})]})]})]})}function N(){let{t:e,locale:r}=(0,o.s)(),{user:s}=(0,n.A)(),l=(0,a.usePathname)();if(!s)return null;let d=[{href:"/",icon:p},{href:"/explore",icon:h.A},{href:"/create",icon:x},{href:"/direct",icon:f.A},{href:`/profile/${s.username}`,icon:g}];return(0,t.jsx)("nav",{className:(0,c.cn)("lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-lenz-border flex items-center justify-around py-2 px-4"),children:d.map(e=>{let r=l===e.href;return(0,t.jsx)(i(),{href:e.href,className:(0,c.cn)("p-2 rounded-lg",r?"text-lenz-primary":"text-lenz-dark"),children:(0,t.jsx)(e.icon,{className:"w-6 h-6"})},e.href)})})}function k({children:e}){let{isAuthenticated:r,loading:s}=(0,n.A)(),{locale:l}=(0,o.s)();return((0,a.useRouter)(),s||!r)?(0,t.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-lenz-bg",children:(0,t.jsx)("div",{className:"w-12 h-12 rounded-full border-4 border-lenz-primary/30 border-t-lenz-primary animate-spin"})}):(0,t.jsxs)("div",{className:"min-h-screen bg-lenz-bg",children:[(0,t.jsx)(j,{}),(0,t.jsx)("main",{className:(0,c.cn)("min-h-screen pb-20 lg:pb-0","fa"===l?"lg:mr-64":"lg:ml-64"),children:(0,t.jsx)("div",{className:"max-w-2xl mx-auto lg:px-6 lg:py-8",children:e})}),(0,t.jsx)(N,{})]})}},7563:(e,r,s)=>{"use strict";s.d(r,{e:()=>n});var t=s(5512),a=s(4195);function n({src:e,alt:r,size:s="md",hasStory:n,className:l,onClick:i}){let c=(0,t.jsx)("div",{className:(0,a.cn)("relative rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center",{xs:"w-6 h-6",sm:"w-8 h-8",md:"w-12 h-12",lg:"w-16 h-16",xl:"w-24 h-24"}[s],!e&&"text-lenz-gray"),onClick:i,children:e?(0,t.jsx)("img",{src:e,alt:r,className:"w-full h-full object-cover"}):(0,t.jsx)("span",{className:"text-sm font-medium uppercase",children:r.slice(0,1)})});return n?(0,t.jsx)("div",{className:(0,a.cn)("story-ring cursor-pointer",l),onClick:i,children:(0,t.jsx)("div",{className:"story-ring-inner",children:c})}):(0,t.jsx)("div",{className:(0,a.cn)(l,i&&"cursor-pointer"),children:c})}},6076:(e,r,s)=>{"use strict";s.d(r,{S3:()=>n,eY:()=>a,xH:()=>i,yD:()=>l});var t=s(686);let a=(0,t.J1)`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        username
        email
        fullName
        avatarUrl
      }
      accessToken
      refreshToken
    }
  }
`,n=(0,t.J1)`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        username
        email
        fullName
        avatarUrl
      }
      accessToken
      refreshToken
    }
  }
`;(0,t.J1)`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refresh(input: $input) {
      user {
        id
        username
      }
      accessToken
      refreshToken
    }
  }
`,(0,t.J1)`
  query Me {
    me {
      id
      username
      email
      fullName
      avatarUrl
      bio
      website
      isPrivate
      isVerified
    }
  }
`,(0,t.J1)`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      username
      fullName
      bio
      website
      isPrivate
    }
  }
`,(0,t.J1)`
  mutation UpdateAvatar($url: String!) {
    updateAvatar(url: $url) {
      id
      avatarUrl
    }
  }
`;let l=(0,t.J1)`
  query SearchUsers($q: String!, $limit: Int) {
    searchUsers(q: $q, limit: $limit) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`,i=(0,t.J1)`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      username
      email
      fullName
      bio
      avatarUrl
      website
      isPrivate
      isVerified
      createdAt
    }
  }
`;(0,t.J1)`
  query UserById($id: String!) {
    user(id: $id) {
      id
      username
      fullName
      bio
      avatarUrl
      website
      isPrivate
      isVerified
    }
  }
`},2524:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>t});let t=(0,s(6760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/z/my-project/apps/frontend/src/app/search/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/z/my-project/apps/frontend/src/app/search/page.tsx","default")}};var r=require("../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),t=r.X(0,[345,106,312],()=>s(2341));module.exports=t})();