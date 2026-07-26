"use strict";exports.id=643,exports.ids=[643],exports.modules={2379:(e,t,r)=>{r.d(t,{A:()=>a});let a=(0,r(1680).A)("BadgeCheck",[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",key:"3c2336"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},401:(e,t,r)=>{r.d(t,{A:()=>a});let a=(0,r(1680).A)("Bookmark",[["path",{d:"m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",key:"1fy3hk"}]])},6397:(e,t,r)=>{r.d(t,{A:()=>a});let a=(0,r(1680).A)("Compass",[["path",{d:"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",key:"9ktpf1"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},1575:(e,t,r)=>{r.d(t,{A:()=>a});let a=(0,r(1680).A)("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]])},6873:(e,t,r)=>{r.d(t,{A:()=>a});let a=(0,r(1680).A)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])},3335:(e,t,r)=>{r.d(t,{G:()=>A});var a=r(5512);r(8009);var s=r(9334),l=r(5414),i=r(8531),n=r.n(i),d=r(4195),o=r(400),c=r(7563),m=r(1680);let h=(0,m.A)("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);var u=r(6397),p=r(6873);let x=(0,m.A)("SquarePlus",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);var f=r(1575);let g=(0,m.A)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);var y=r(3042);let b=(0,m.A)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]),v=(0,m.A)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);function k(){let{t:e,locale:t,toggleLocale:r}=(0,o.s)(),{user:i,logout:m}=(0,l.A)(),k=(0,s.usePathname)();if((0,s.useRouter)(),!i)return null;let j=[{href:"/",icon:h,label:e("nav.home")},{href:"/explore",icon:u.A,label:e("nav.explore")},{href:"/search",icon:p.A,label:e("nav.search")},{href:"/create",icon:x,label:e("nav.create")},{href:"/direct",icon:f.A,label:e("nav.direct")},{href:`/profile/${i.username}`,icon:g,label:e("nav.profile")}],A=async()=>{await m()};return(0,a.jsxs)("aside",{className:(0,d.cn)("fixed top-0 bottom-0 z-30 flex flex-col border-r border-lenz-border bg-white","fa"===t?"right-0":"left-0","w-20 lg:w-64"),children:[(0,a.jsx)("div",{className:"flex items-center justify-center lg:justify-start h-20 px-4 lg:px-6 border-b border-lenz-border",children:(0,a.jsxs)(n(),{href:"/",className:"flex items-center gap-2",children:[(0,a.jsx)("div",{className:"w-9 h-9 rounded-xl bg-lenz-gradient flex items-center justify-center",children:(0,a.jsx)(y.A,{className:"w-5 h-5 text-white"})}),(0,a.jsx)("span",{className:"hidden lg:block text-2xl font-bold lenz-gradient-text",children:e("app.name")})]})}),(0,a.jsx)("nav",{className:"flex-1 px-2 lg:px-3 py-4 space-y-1",children:j.map(e=>{let t=k===e.href;return(0,a.jsxs)(n(),{href:e.href,className:(0,d.cn)("flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors",t&&"font-semibold"),title:e.label,children:[(0,a.jsx)(e.icon,{className:"w-6 h-6 shrink-0"}),(0,a.jsx)("span",{className:"hidden lg:inline text-base",children:e.label})]},e.href)})}),(0,a.jsxs)("div",{className:"px-2 lg:px-3 py-4 border-t border-lenz-border space-y-1",children:[(0,a.jsxs)("button",{onClick:r,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors",title:"fa"===t?"Switch to English":"تغییر به فارسی",children:[(0,a.jsx)(b,{className:"w-6 h-6 shrink-0"}),(0,a.jsx)("span",{className:"hidden lg:inline text-base",children:"fa"===t?"English":"فارسی"})]}),(0,a.jsxs)("button",{onClick:A,className:"flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 w-full transition-colors text-red-500",title:e("auth.logout"),children:[(0,a.jsx)(v,{className:"w-6 h-6 shrink-0"}),(0,a.jsx)("span",{className:"hidden lg:inline text-base",children:e("auth.logout")})]}),i&&(0,a.jsxs)(n(),{href:`/profile/${i.username}`,className:"flex items-center gap-4 px-3 py-2 rounded-lg hover:bg-gray-100 w-full transition-colors",children:[(0,a.jsx)(c.e,{src:i.avatarUrl,alt:i.username,size:"sm"}),(0,a.jsx)("span",{className:"hidden lg:inline text-sm truncate",children:i.username})]})]})]})}function j(){let{t:e,locale:t}=(0,o.s)(),{user:r}=(0,l.A)(),i=(0,s.usePathname)();if(!r)return null;let c=[{href:"/",icon:h},{href:"/explore",icon:u.A},{href:"/create",icon:x},{href:"/direct",icon:f.A},{href:`/profile/${r.username}`,icon:g}];return(0,a.jsx)("nav",{className:(0,d.cn)("lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-lenz-border flex items-center justify-around py-2 px-4"),children:c.map(e=>{let t=i===e.href;return(0,a.jsx)(n(),{href:e.href,className:(0,d.cn)("p-2 rounded-lg",t?"text-lenz-primary":"text-lenz-dark"),children:(0,a.jsx)(e.icon,{className:"w-6 h-6"})},e.href)})})}function A({children:e}){let{isAuthenticated:t,loading:r}=(0,l.A)(),{locale:i}=(0,o.s)();return((0,s.useRouter)(),r||!t)?(0,a.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-lenz-bg",children:(0,a.jsx)("div",{className:"w-12 h-12 rounded-full border-4 border-lenz-primary/30 border-t-lenz-primary animate-spin"})}):(0,a.jsxs)("div",{className:"min-h-screen bg-lenz-bg",children:[(0,a.jsx)(k,{}),(0,a.jsx)("main",{className:(0,d.cn)("min-h-screen pb-20 lg:pb-0","fa"===i?"lg:mr-64":"lg:ml-64"),children:(0,a.jsx)("div",{className:"max-w-2xl mx-auto lg:px-6 lg:py-8",children:e})}),(0,a.jsx)(j,{})]})}},7563:(e,t,r)=>{r.d(t,{e:()=>l});var a=r(5512),s=r(4195);function l({src:e,alt:t,size:r="md",hasStory:l,className:i,onClick:n}){let d=(0,a.jsx)("div",{className:(0,s.cn)("relative rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center",{xs:"w-6 h-6",sm:"w-8 h-8",md:"w-12 h-12",lg:"w-16 h-16",xl:"w-24 h-24"}[r],!e&&"text-lenz-gray"),onClick:n,children:e?(0,a.jsx)("img",{src:e,alt:t,className:"w-full h-full object-cover"}):(0,a.jsx)("span",{className:"text-sm font-medium uppercase",children:t.slice(0,1)})});return l?(0,a.jsx)("div",{className:(0,s.cn)("story-ring cursor-pointer",i),onClick:n,children:(0,a.jsx)("div",{className:"story-ring-inner",children:d})}):(0,a.jsx)("div",{className:(0,s.cn)(i,n&&"cursor-pointer"),children:d})}},9631:(e,t,r)=>{r.d(t,{EV:()=>o,HF:()=>l,ZQ:()=>c,eB:()=>i,i4:()=>u,nU:()=>h,p$:()=>n,r_:()=>m,xu:()=>s,zs:()=>d});var a=r(686);let s=(0,a.J1)`
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
`,l=(0,a.J1)`
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
`,i=(0,a.J1)`
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
`,n=(0,a.J1)`
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
`,d=(0,a.J1)`
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
`,o=(0,a.J1)`
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
`;(0,a.J1)`
  mutation DeletePost($id: String!) {
    deletePost(id: $id)
  }
`;let c=(0,a.J1)`
  mutation ToggleLike($postId: String!) {
    toggleLike(postId: $postId)
  }
`;(0,a.J1)`
  query IsLiked($postId: String!) {
    isLiked(postId: $postId)
  }
`;let m=(0,a.J1)`
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
`,h=(0,a.J1)`
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
`,u=(0,a.J1)`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`}};