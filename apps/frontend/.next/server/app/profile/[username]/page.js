(()=>{var e={};e.id=381,e.ids=[381],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},8237:(e,r,s)=>{"use strict";s.r(r),s.d(r,{GlobalError:()=>l.a,__next_app__:()=>p,pages:()=>u,routeModule:()=>c,tree:()=>d});var a=s(260),t=s(8203),i=s(5155),l=s.n(i),n=s(7292),o={};for(let e in n)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);s.d(r,o);let d=["",{children:["profile",{children:["[username]",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,8390)),"/home/z/my-project/apps/frontend/src/app/profile/[username]/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,1354)),"/home/z/my-project/apps/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,9937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(s.t.bind(s,9116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(s.t.bind(s,1485,23)),"next/dist/client/components/unauthorized-error"]}],u=["/home/z/my-project/apps/frontend/src/app/profile/[username]/page.tsx"],p={require:s,loadChunk:()=>Promise.resolve()},c=new a.AppPageRouteModule({definition:{kind:t.RouteKind.APP_PAGE,page:"/profile/[username]/page",pathname:"/profile/[username]",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4729:(e,r,s)=>{Promise.resolve().then(s.bind(s,8390))},5001:(e,r,s)=>{Promise.resolve().then(s.bind(s,8299))},6235:(e,r,s)=>{"use strict";s.d(r,{A:()=>a});let a=(0,s(1680).A)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},8299:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>P});var a=s(5512),t=s(8184),i=s(5631),l=s(8531),n=s.n(l),o=s(9334),d=s(8009),u=s(3335),p=s(7563),c=s(9400),m=s(400),h=s(5414),x=s(6076),f=s(9631),g=s(686);let v=(0,g.J1)`
  mutation FollowUser($userId: String!) {
    followUser(userId: $userId)
  }
`,b=(0,g.J1)`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId)
  }
`,y=(0,g.J1)`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;(0,g.J1)`
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`,(0,g.J1)`
  query Following($userId: String!) {
    following(userId: $userId) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`,(0,g.J1)`
  mutation ToggleCloseFriend($userId: String!, $isClose: Boolean!) {
    toggleCloseFriend(userId: $userId, isClose: $isClose)
  }
`,(0,g.J1)`
  query MyCloseFriends {
    myCloseFriends {
      id
      username
      fullName
      avatarUrl
    }
  }
`;var j=s(4195),N=s(2379),k=s(1680);let w=(0,k.A)("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);var $=s(1575);let I=(0,k.A)("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]),z=(0,k.A)("Grid3x3",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]]),U=(0,k.A)("Film",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M7 3v18",key:"bbkbws"}],["path",{d:"M3 7.5h4",key:"zfgn84"}],["path",{d:"M3 12h18",key:"1i2n21"}],["path",{d:"M3 16.5h4",key:"1230mu"}],["path",{d:"M17 3v18",key:"in4fa5"}],["path",{d:"M17 7.5h4",key:"myr1c1"}],["path",{d:"M17 16.5h4",key:"go4c1d"}]]);var q=s(401);function P(){return(0,a.jsx)(u.G,{children:(0,a.jsx)(A,{})})}function A(){let e=(0,o.useParams)(),r=e?.username,{t:s}=(0,m.s)(),{user:l}=(0,h.A)(),[u,g]=(0,d.useState)("posts"),{data:k,loading:P}=(0,t.IT)(x.xH,{variables:{username:r}}),A=k?.userByUsername,M=l?.username===r,{data:C,loading:J}=(0,t.IT)(f.eB,{variables:{userId:A?.id},skip:!A?.id}),{data:_}=(0,t.IT)(y,{variables:{userId:A?.id},skip:!A?.id||M}),[S]=(0,i.n)(v,{refetchQueries:[{query:y,variables:{userId:A?.id}}]}),[T]=(0,i.n)(b,{refetchQueries:[{query:y,variables:{userId:A?.id}}]}),B=_?.isFollowing||!1,F=async()=>{B?await T({variables:{userId:A.id}}):await S({variables:{userId:A.id}})};if(P||!A)return(0,a.jsx)("div",{className:"py-8 px-4",children:(0,a.jsxs)("div",{className:"flex items-center gap-6 mb-8 animate-pulse",children:[(0,a.jsx)("div",{className:"w-20 h-20 rounded-full bg-gray-200"}),(0,a.jsxs)("div",{className:"flex-1 space-y-2",children:[(0,a.jsx)("div",{className:"h-4 bg-gray-200 rounded w-32"}),(0,a.jsx)("div",{className:"h-3 bg-gray-200 rounded w-24"})]})]})});let R=C?.postsByUser||[];return(0,a.jsxs)("div",{className:"py-4 px-2 lg:px-4",children:[(0,a.jsx)("header",{className:"mb-8",children:(0,a.jsxs)("div",{className:"flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12 mb-6",children:[(0,a.jsx)("div",{className:"flex justify-center lg:justify-start",children:(0,a.jsx)(p.e,{src:A.avatarUrl,alt:A.username,size:"xl",hasStory:!0})}),(0,a.jsxs)("div",{className:"flex-1",children:[(0,a.jsxs)("div",{className:"flex flex-wrap items-center gap-3 mb-3",children:[(0,a.jsxs)("div",{className:"flex items-center gap-1",children:[(0,a.jsx)("h1",{className:"text-xl font-semibold",children:A.username}),A.isVerified&&(0,a.jsx)(N.A,{className:"w-4 h-4 text-blue-500 fill-blue-500"})]}),M?(0,a.jsx)("div",{className:"flex gap-2",children:(0,a.jsx)(n(),{href:"/settings",children:(0,a.jsxs)(c.$,{variant:"outline",size:"sm",children:[(0,a.jsx)(w,{className:"w-4 h-4"}),s("profile.editProfile")]})})}):(0,a.jsxs)("div",{className:"flex gap-2",children:[(0,a.jsx)(c.$,{variant:B?"outline":"primary",size:"sm",onClick:F,children:s(B?"profile.following":"profile.follow")}),(0,a.jsx)(n(),{href:"/direct",children:(0,a.jsxs)(c.$,{variant:"outline",size:"sm",children:[(0,a.jsx)($.A,{className:"w-4 h-4"}),s("profile.message")]})})]})]}),(0,a.jsxs)("div",{className:"flex gap-6 mb-4 text-sm",children:[(0,a.jsxs)("span",{children:[(0,a.jsx)("strong",{className:"font-semibold",children:(0,j.B4)(R.length)})," ",s("profile.posts")]}),(0,a.jsxs)("span",{children:[(0,a.jsx)("strong",{className:"font-semibold",children:"0"})," ",s("profile.followers")]}),(0,a.jsxs)("span",{children:[(0,a.jsx)("strong",{className:"font-semibold",children:"0"})," ",s("profile.following")]})]}),(0,a.jsxs)("div",{className:"text-sm",children:[A.fullName&&(0,a.jsx)("p",{className:"font-semibold mb-1",children:A.fullName}),A.bio&&(0,a.jsx)("p",{className:"whitespace-pre-wrap text-lenz-dark mb-1",children:A.bio}),A.website&&(0,a.jsxs)("a",{href:A.website,target:"_blank",rel:"noopener noreferrer",className:"text-lenz-primary hover:underline inline-flex items-center gap-1",children:[(0,a.jsx)(I,{className:"w-3.5 h-3.5"}),A.website.replace(/^https?:\/\//,"")]})]})]})]})}),(0,a.jsx)("div",{className:"border-t border-lenz-border",children:(0,a.jsx)("div",{className:"flex justify-around",children:[{key:"posts",icon:z,label:s("profile.posts")},{key:"reels",icon:U,label:"Reels"},...M?[{key:"saved",icon:q.A,label:s("post.saved")}]:[]].map(({key:e,icon:r,label:s})=>(0,a.jsxs)("button",{onClick:()=>g(e),className:`flex-1 flex items-center justify-center gap-2 py-3 text-xs uppercase tracking-wide border-t-2 -mt-px ${u===e?"border-lenz-dark text-lenz-dark font-semibold":"border-transparent text-lenz-gray hover:text-lenz-dark"}`,children:[(0,a.jsx)(r,{className:"w-4 h-4"}),(0,a.jsx)("span",{className:"hidden lg:inline",children:s})]},e))})}),J?(0,a.jsx)("div",{className:"grid grid-cols-3 gap-1 mt-2",children:[...Array(9)].map((e,r)=>(0,a.jsx)("div",{className:"aspect-square bg-gray-200 animate-pulse"},r))}):0===R.length?(0,a.jsxs)("div",{className:"text-center py-16",children:[(0,a.jsx)(z,{className:"w-12 h-12 mx-auto text-lenz-gray mb-3"}),(0,a.jsx)("p",{className:"text-lenz-gray",children:s("post.noPosts")}),M&&(0,a.jsx)(n(),{href:"/create",className:"inline-block mt-3 text-lenz-primary font-semibold",children:s("post.create")})]}):(0,a.jsx)("div",{className:"grid grid-cols-3 gap-1 mt-2",children:R.map(e=>(0,a.jsxs)(n(),{href:`/post/${e.id}`,className:"aspect-square relative group bg-gray-100",children:[(0,a.jsx)("img",{src:e.mediaUrls?.[0]||"",alt:e.caption||"",className:"w-full h-full object-cover",loading:"lazy"}),(0,a.jsxs)("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-sm",children:[(0,a.jsx)("span",{children:(0,j.B4)(e.likesCount)}),(0,a.jsx)("span",{children:(0,j.B4)(e.commentsCount)})]})]},e.id))})]})}},9400:(e,r,s)=>{"use strict";s.d(r,{$:()=>n});var a=s(5512),t=s(8009),i=s(4195),l=s(6235);let n=(0,t.forwardRef)(({className:e,variant:r="primary",size:s="md",loading:t,fullWidth:n,children:o,disabled:d,...u},p)=>(0,a.jsxs)("button",{ref:p,className:(0,i.cn)("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lenz-primary/50 disabled:opacity-50 disabled:pointer-events-none",{primary:"bg-lenz-primary hover:bg-lenz-primary/90 text-white shadow-sm",secondary:"bg-lenz-dark hover:bg-lenz-dark/90 text-white",outline:"border border-lenz-border hover:bg-gray-50 text-lenz-dark",ghost:"hover:bg-gray-100 text-lenz-dark",danger:"bg-red-500 hover:bg-red-600 text-white"}[r],{sm:"h-8 px-3 text-sm",md:"h-10 px-4 text-sm",lg:"h-12 px-6 text-base"}[s],n&&"w-full",e),disabled:d||t,...u,children:[t&&(0,a.jsx)(l.A,{className:"w-4 h-4 animate-spin"}),o]}));n.displayName="Button"},6076:(e,r,s)=>{"use strict";s.d(r,{S3:()=>i,eY:()=>t,xH:()=>n,yD:()=>l});var a=s(686);let t=(0,a.J1)`
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
`,i=(0,a.J1)`
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
`;(0,a.J1)`
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
`,(0,a.J1)`
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
`,(0,a.J1)`
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
`,(0,a.J1)`
  mutation UpdateAvatar($url: String!) {
    updateAvatar(url: $url) {
      id
      avatarUrl
    }
  }
`;let l=(0,a.J1)`
  query SearchUsers($q: String!, $limit: Int) {
    searchUsers(q: $q, limit: $limit) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`,n=(0,a.J1)`
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
`;(0,a.J1)`
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
`},8390:(e,r,s)=>{"use strict";s.r(r),s.d(r,{default:()=>a});let a=(0,s(6760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/z/my-project/apps/frontend/src/app/profile/[username]/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/z/my-project/apps/frontend/src/app/profile/[username]/page.tsx","default")}};var r=require("../../../webpack-runtime.js");r.C(e);var s=e=>r(r.s=e),a=r.X(0,[345,106,312,643],()=>s(8237));module.exports=a})();