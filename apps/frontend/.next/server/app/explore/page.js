(()=>{var e={};e.id=314,e.ids=[314],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},8083:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>i.a,__next_app__:()=>p,pages:()=>c,routeModule:()=>m,tree:()=>d});var s=r(260),a=r(8203),n=r(5155),i=r.n(n),l=r(7292),o={};for(let e in l)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);r.d(t,o);let d=["",{children:["explore",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,4013)),"/home/z/my-project/apps/frontend/src/app/explore/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,1354)),"/home/z/my-project/apps/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,9937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(r.t.bind(r,9116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(r.t.bind(r,1485,23)),"next/dist/client/components/unauthorized-error"]}],c=["/home/z/my-project/apps/frontend/src/app/explore/page.tsx"],p={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:a.RouteKind.APP_PAGE,page:"/explore/page",pathname:"/explore",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},2510:(e,t,r)=>{Promise.resolve().then(r.bind(r,4013))},966:(e,t,r)=>{Promise.resolve().then(r.bind(r,9185))},6397:(e,t,r)=>{"use strict";r.d(t,{A:()=>s});let s=(0,r(1680).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},453:(e,t,r)=>{"use strict";r.d(t,{A:()=>s});let s=(0,r(1680).A)("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]])},1575:(e,t,r)=>{"use strict";r.d(t,{A:()=>s});let s=(0,r(1680).A)("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]])},6873:(e,t,r)=>{"use strict";r.d(t,{A:()=>s});let s=(0,r(1680).A)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])},9185:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>u});var s=r(5512),a=r(8184),n=r(8531),i=r.n(n),l=r(3335),o=r(400),d=r(9631),c=r(4195),p=r(453),m=r(1575);function u(){return(0,s.jsx)(l.G,{children:(0,s.jsx)(h,{})})}function h(){let{t:e}=(0,o.s)(),{data:t,loading:r}=(0,a.IT)(d.HF,{variables:{limit:30,offset:0}}),n=t?.exploreFeed?.items||[];return(0,s.jsxs)("div",{className:"px-2 lg:px-0 py-4",children:[(0,s.jsx)("h1",{className:"text-2xl font-bold mb-6 px-2",children:e("feed.discover")}),r?(0,s.jsx)("div",{className:"grid grid-cols-3 gap-1",children:[...Array(12)].map((e,t)=>(0,s.jsx)("div",{className:"aspect-square bg-gray-200 animate-pulse"},t))}):0===n.length?(0,s.jsx)("p",{className:"text-center text-lenz-gray py-12",children:e("post.noPosts")}):(0,s.jsx)("div",{className:"grid grid-cols-3 gap-1",children:n.map(e=>(0,s.jsxs)(i(),{href:`/post/${e.id}`,className:"aspect-square relative group bg-gray-100",children:[(0,s.jsx)("img",{src:e.mediaUrls?.[0]||"",alt:e.caption||"",className:"w-full h-full object-cover",loading:"lazy"}),(0,s.jsxs)("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-sm",children:[(0,s.jsxs)("span",{className:"flex items-center gap-1",children:[(0,s.jsx)(p.A,{className:"w-4 h-4 fill-white"}),(0,c.B4)(e.likesCount)]}),(0,s.jsxs)("span",{className:"flex items-center gap-1",children:[(0,s.jsx)(m.A,{className:"w-4 h-4 fill-white"}),(0,c.B4)(e.commentsCount)]})]})]},e.id))})]})}},3335:(e,t,r)=>{"use strict";r.d(t,{G:()=>N});var s=r(5512);r(8009);var a=r(9334),n=r(5414),i=r(8531),l=r.n(i),o=r(4195),d=r(400),c=r(7563),p=r(1680);let m=(0,p.A)("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);var u=r(6397),h=r(6873);let x=(0,p.A)("SquarePlus",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);var f=r(1575);let g=(0,p.A)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);var y=r(3042);let v=(0,p.A)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]),b=(0,p.A)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);function j(){let{t:e,locale:t,toggleLocale:r}=(0,d.s)(),{user:i,logout:p}=(0,n.A)(),j=(0,a.usePathname)();if((0,a.useRouter)(),!i)return null;let k=[{href:"/",icon:m,label:e("nav.home")},{href:"/explore",icon:u.A,label:e("nav.explore")},{href:"/search",icon:h.A,label:e("nav.search")},{href:"/create",icon:x,label:e("nav.create")},{href:"/direct",icon:f.A,label:e("nav.direct")},{href:`/profile/${i.username}`,icon:g,label:e("nav.profile")}],N=async()=>{await p()};return(0,s.jsxs)("aside",{className:(0,o.cn)("fixed top-0 bottom-0 z-30 flex flex-col border-r border-lenz-border bg-white","fa"===t?"right-0":"left-0","w-20 lg:w-64"),children:[(0,s.jsx)("div",{className:"flex items-center justify-center lg:justify-start h-20 px-4 lg:px-6 border-b border-lenz-border",children:(0,s.jsxs)(l(),{href:"/",className:"flex items-center gap-2",children:[(0,s.jsx)("div",{className:"w-9 h-9 rounded-xl bg-lenz-gradient flex items-center justify-center",children:(0,s.jsx)(y.A,{className:"w-5 h-5 text-white"})}),(0,s.jsx)("span",{className:"hidden lg:block text-2xl font-bold lenz-gradient-text",children:e("app.name")})]})}),(0,s.jsx)("nav",{className:"flex-1 px-2 lg:px-3 py-4 space-y-1",children:k.map(e=>{let t=j===e.href;return(0,s.jsxs)(l(),{href:e.href,className:(0,o.cn)("flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors",t&&"font-semibold"),title:e.label,children:[(0,s.jsx)(e.icon,{className:"w-6 h-6 shrink-0"}),(0,s.jsx)("span",{className:"hidden lg:inline text-base",children:e.label})]},e.href)})}),(0,s.jsxs)("div",{className:"px-2 lg:px-3 py-4 border-t border-lenz-border space-y-1",children:[(0,s.jsxs)("button",{onClick:r,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors",title:"fa"===t?"Switch to English":"تغییر به فارسی",children:[(0,s.jsx)(v,{className:"w-6 h-6 shrink-0"}),(0,s.jsx)("span",{className:"hidden lg:inline text-base",children:"fa"===t?"English":"فارسی"})]}),(0,s.jsxs)("button",{onClick:N,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors text-red-500",title:e("auth.logout"),children:[(0,s.jsx)(b,{className:"w-6 h-6 shrink-0"}),(0,s.jsx)("span",{className:"hidden lg:inline text-base",children:e("auth.logout")})]}),i&&(0,s.jsxs)(l(),{href:`/profile/${i.username}`,className:"flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-gray-100 w-full transition-colors",children:[(0,s.jsx)(c.e,{src:i.avatarUrl,alt:i.username,size:"sm"}),(0,s.jsx)("span",{className:"hidden lg:inline text-sm truncate",children:i.username})]})]})]})}function k(){let{t:e,locale:t}=(0,d.s)(),{user:r}=(0,n.A)(),i=(0,a.usePathname)();if(!r)return null;let c=[{href:"/",icon:m},{href:"/explore",icon:u.A},{href:"/create",icon:x},{href:"/direct",icon:f.A},{href:`/profile/${r.username}`,icon:g}];return(0,s.jsx)("nav",{className:(0,o.cn)("lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-lenz-border flex items-center justify-around py-2 px-4"),children:c.map(e=>{let t=i===e.href;return(0,s.jsx)(l(),{href:e.href,className:(0,o.cn)("p-2 rounded-lg",t?"text-lenz-primary":"text-lenz-dark"),children:(0,s.jsx)(e.icon,{className:"w-6 h-6"})},e.href)})})}function N({children:e}){let{isAuthenticated:t,loading:r}=(0,n.A)(),{locale:i}=(0,d.s)();return((0,a.useRouter)(),r||!t)?(0,s.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-lenz-bg",children:(0,s.jsx)("div",{className:"w-12 h-12 rounded-full border-4 border-lenz-primary/30 border-t-lenz-primary animate-spin"})}):(0,s.jsxs)("div",{className:"min-h-screen bg-lenz-bg",children:[(0,s.jsx)(j,{}),(0,s.jsx)("main",{className:(0,o.cn)("min-h-screen pb-20 lg:pb-0","fa"===i?"lg:mr-64":"lg:ml-64"),children:(0,s.jsx)("div",{className:"max-w-2xl mx-auto lg:px-6 lg:py-8",children:e})}),(0,s.jsx)(k,{})]})}},7563:(e,t,r)=>{"use strict";r.d(t,{e:()=>n});var s=r(5512),a=r(4195);function n({src:e,alt:t,size:r="md",hasStory:n,className:i,onClick:l}){let o=(0,s.jsx)("div",{className:(0,a.cn)("relative rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center",{xs:"w-6 h-6",sm:"w-8 h-8",md:"w-12 h-12",lg:"w-16 h-16",xl:"w-24 h-24"}[r],!e&&"text-lenz-gray"),onClick:l,children:e?(0,s.jsx)("img",{src:e,alt:t,className:"w-full h-full object-cover"}):(0,s.jsx)("span",{className:"text-sm font-medium uppercase",children:t.slice(0,1)})});return n?(0,s.jsx)("div",{className:(0,a.cn)("story-ring cursor-pointer",i),onClick:l,children:(0,s.jsx)("div",{className:"story-ring-inner",children:o})}):(0,s.jsx)("div",{className:(0,a.cn)(i,l&&"cursor-pointer"),children:o})}},9631:(e,t,r)=>{"use strict";r.d(t,{EV:()=>d,HF:()=>n,ZQ:()=>c,eB:()=>i,i4:()=>u,nU:()=>m,p$:()=>l,r_:()=>p,xu:()=>a,zs:()=>o});var s=r(686);let a=(0,s.J1)`
  query Feed($limit: Int, $offset: Int) {
    feed(limit: $limit, offset: $offset) {
      items {
        id
        caption
        mediaUrls
        hashtags
        location
        isReel
        likesCount
        commentsCount
        createdAt
        author {
          id
          username
          fullName
          avatarUrl
          isVerified
        }
      }
      hasMore
    }
  }
`,n=(0,s.J1)`
  query ExploreFeed($limit: Int, $offset: Int) {
    exploreFeed(limit: $limit, offset: $offset) {
      items {
        id
        caption
        mediaUrls
        likesCount
        commentsCount
        createdAt
        author {
          id
          username
          avatarUrl
        }
      }
      hasMore
    }
  }
`,i=(0,s.J1)`
  query PostsByUser($userId: String!) {
    postsByUser(userId: $userId) {
      id
      caption
      mediaUrls
      likesCount
      commentsCount
      createdAt
    }
  }
`,l=(0,s.J1)`
  query PostById($id: String!) {
    post(id: $id) {
      id
      caption
      mediaUrls
      hashtags
      mentions
      location
      isReel
      likesCount
      commentsCount
      createdAt
      author {
        id
        username
        fullName
        avatarUrl
        isVerified
      }
    }
  }
`,o=(0,s.J1)`
  query PostsByHashtag($tag: String!) {
    postsByHashtag(tag: $tag) {
      id
      caption
      mediaUrls
      likesCount
      commentsCount
      createdAt
      author {
        id
        username
        avatarUrl
      }
    }
  }
`,d=(0,s.J1)`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      caption
      mediaUrls
      hashtags
      createdAt
      author {
        id
        username
      }
    }
  }
`;(0,s.J1)`
  mutation DeletePost($id: String!) {
    deletePost(id: $id)
  }
`;let c=(0,s.J1)`
  mutation ToggleLike($postId: String!) {
    toggleLike(postId: $postId)
  }
`;(0,s.J1)`
  query IsLiked($postId: String!) {
    isLiked(postId: $postId)
  }
`;let p=(0,s.J1)`
  query Comments($postId: String!) {
    comments(postId: $postId) {
      id
      text
      createdAt
      user {
        id
        username
        avatarUrl
      }
      replies {
        id
        text
        createdAt
        user {
          id
          username
          avatarUrl
        }
      }
    }
  }
`,m=(0,s.J1)`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      text
      createdAt
      user {
        id
        username
        avatarUrl
      }
    }
  }
`,u=(0,s.J1)`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`},4013:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s});let s=(0,r(6760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/z/my-project/apps/frontend/src/app/explore/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/z/my-project/apps/frontend/src/app/explore/page.tsx","default")}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[345,106,312],()=>r(8083));module.exports=s})();