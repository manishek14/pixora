(()=>{var e={};e.id=454,e.ids=[454],e.modules={846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9121:e=>{"use strict";e.exports=require("next/dist/server/app-render/action-async-storage.external.js")},3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},9294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},3033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3873:e=>{"use strict";e.exports=require("path")},2883:(e,r,t)=>{"use strict";t.r(r),t.d(r,{GlobalError:()=>i.a,__next_app__:()=>m,pages:()=>u,routeModule:()=>p,tree:()=>d});var a=t(260),s=t(8203),n=t(5155),i=t.n(n),l=t(7292),o={};for(let e in l)0>["default","tree","pages","GlobalError","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);t.d(r,o);let d=["",{children:["register",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(t.bind(t,5753)),"/home/z/my-project/apps/frontend/src/app/register/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(t.bind(t,1354)),"/home/z/my-project/apps/frontend/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(t.t.bind(t,9937,23)),"next/dist/client/components/not-found-error"],forbidden:[()=>Promise.resolve().then(t.t.bind(t,9116,23)),"next/dist/client/components/forbidden-error"],unauthorized:[()=>Promise.resolve().then(t.t.bind(t,1485,23)),"next/dist/client/components/unauthorized-error"]}],u=["/home/z/my-project/apps/frontend/src/app/register/page.tsx"],m={require:t,loadChunk:()=>Promise.resolve()},p=new a.AppPageRouteModule({definition:{kind:s.RouteKind.APP_PAGE,page:"/register/page",pathname:"/register",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},4190:(e,r,t)=>{Promise.resolve().then(t.bind(t,5753))},7238:(e,r,t)=>{Promise.resolve().then(t.bind(t,2949))},9208:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});let a=(0,t(1680).A)("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]])},1956:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});let a=(0,t(1680).A)("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},6235:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});let a=(0,t(1680).A)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},2949:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>g});var a=t(5512),s=t(8009),n=t(8531),i=t.n(n),l=t(9334),o=t(5631),d=t(9400),u=t(7722),m=t(400),p=t(5414),c=t(6076),h=t(3042),x=t(9208),f=t(1956);function g(){let{t:e}=(0,m.s)(),{login:r}=(0,p.A)(),t=(0,l.useRouter)(),[n,g]=(0,s.useState)(""),[b,v]=(0,s.useState)(""),[y,j]=(0,s.useState)(""),[w,z]=(0,s.useState)(""),[N,k]=(0,s.useState)(!1),[A,P]=(0,s.useState)(null),[$,q]=(0,s.useState)(!1),[_]=(0,o.n)(c.eY),C=async a=>{a.preventDefault(),P(null),q(!0);try{let{data:e}=await _({variables:{input:{username:n.trim().toLowerCase(),email:b.trim().toLowerCase(),password:w,fullName:y.trim()||void 0}}});e?.register&&(r(e.register.accessToken,e.register.refreshToken),t.push("/"))}catch(r){P(r?.message||e("auth.registerFailed"))}finally{q(!1)}};return(0,a.jsx)("main",{className:"min-h-screen flex flex-col items-center justify-center px-4 bg-lenz-bg",children:(0,a.jsxs)("div",{className:"w-full max-w-sm",children:[(0,a.jsxs)("div",{className:"text-center mb-8",children:[(0,a.jsx)("div",{className:"inline-flex w-16 h-16 rounded-2xl bg-lenz-gradient items-center justify-center mb-4",children:(0,a.jsx)(h.A,{className:"w-8 h-8 text-white"})}),(0,a.jsx)("h1",{className:"text-4xl font-bold lenz-gradient-text",children:e("app.name")}),(0,a.jsx)("p",{className:"text-lenz-gray mt-2",children:e("auth.joinLenz")})]}),(0,a.jsxs)("form",{onSubmit:C,className:"bg-white border border-lenz-border rounded-2xl p-6 space-y-4",children:[(0,a.jsx)(u.p,{name:"username",label:e("auth.username"),value:n,onChange:e=>g(e.target.value),placeholder:"ali_dev",required:!0,minLength:3,maxLength:30,pattern:"[a-zA-Z0-9_.]+",autoFocus:!0}),(0,a.jsx)(u.p,{type:"email",name:"email",label:e("auth.email"),value:b,onChange:e=>v(e.target.value),placeholder:"you@example.com",required:!0,autoComplete:"email"}),(0,a.jsx)(u.p,{name:"fullName",label:e("auth.fullName"),value:y,onChange:e=>j(e.target.value),placeholder:"Ali Developer",maxLength:100}),(0,a.jsxs)("div",{className:"relative",children:[(0,a.jsx)(u.p,{type:N?"text":"password",name:"password",label:e("auth.password"),value:w,onChange:e=>z(e.target.value),placeholder:"••••••••",required:!0,minLength:8,autoComplete:"new-password",className:"pr-10"}),(0,a.jsx)("button",{type:"button",onClick:()=>k(!N),className:"absolute end-3 top-[34px] text-lenz-gray hover:text-lenz-dark",children:N?(0,a.jsx)(x.A,{className:"w-5 h-5"}):(0,a.jsx)(f.A,{className:"w-5 h-5"})})]}),A&&(0,a.jsx)("p",{className:"text-sm text-red-500 bg-red-50 rounded-md p-2",children:A}),(0,a.jsx)(d.$,{type:"submit",fullWidth:!0,size:"lg",loading:$,children:e("auth.signup")})]}),(0,a.jsxs)("p",{className:"text-center mt-6 text-sm text-lenz-gray",children:[e("auth.haveAccount")," ",(0,a.jsx)(i(),{href:"/login",className:"text-lenz-primary font-semibold hover:underline",children:e("auth.login")})]})]})})}},9400:(e,r,t)=>{"use strict";t.d(r,{$:()=>l});var a=t(5512),s=t(8009),n=t(4195),i=t(6235);let l=(0,s.forwardRef)(({className:e,variant:r="primary",size:t="md",loading:s,fullWidth:l,children:o,disabled:d,...u},m)=>(0,a.jsxs)("button",{ref:m,className:(0,n.cn)("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lenz-primary/50 disabled:opacity-50 disabled:pointer-events-none",{primary:"bg-lenz-primary hover:bg-lenz-primary/90 text-white shadow-sm",secondary:"bg-lenz-dark hover:bg-lenz-dark/90 text-white",outline:"border border-lenz-border hover:bg-gray-50 text-lenz-dark",ghost:"hover:bg-gray-100 text-lenz-dark",danger:"bg-red-500 hover:bg-red-600 text-white"}[r],{sm:"h-8 px-3 text-sm",md:"h-10 px-4 text-sm",lg:"h-12 px-6 text-base"}[t],l&&"w-full",e),disabled:d||s,...u,children:[s&&(0,a.jsx)(i.A,{className:"w-4 h-4 animate-spin"}),o]}));l.displayName="Button"},7722:(e,r,t)=>{"use strict";t.d(r,{T:()=>l,p:()=>i});var a=t(5512),s=t(8009),n=t(4195);let i=(0,s.forwardRef)(({className:e,label:r,error:t,id:s,...i},l)=>{let o=s||i.name;return(0,a.jsxs)("div",{className:"w-full",children:[r&&(0,a.jsx)("label",{htmlFor:o,className:"block text-sm font-medium text-lenz-dark mb-1.5",children:r}),(0,a.jsx)("input",{ref:l,id:o,className:(0,n.cn)("w-full h-11 px-3.5 rounded-lg border bg-white text-lenz-dark placeholder:text-lenz-gray focus:outline-none focus:border-lenz-dark/40 transition-colors",t?"border-red-500":"border-lenz-border",e),...i}),t&&(0,a.jsx)("p",{className:"mt-1 text-xs text-red-500",children:t})]})});i.displayName="Input";let l=(0,s.forwardRef)(({className:e,label:r,error:t,id:s,...i},l)=>{let o=s||i.name;return(0,a.jsxs)("div",{className:"w-full",children:[r&&(0,a.jsx)("label",{htmlFor:o,className:"block text-sm font-medium text-lenz-dark mb-1.5",children:r}),(0,a.jsx)("textarea",{ref:l,id:o,className:(0,n.cn)("w-full px-3.5 py-2.5 rounded-lg border bg-white text-lenz-dark placeholder:text-lenz-gray focus:outline-none focus:border-lenz-dark/40 transition-colors resize-none",t?"border-red-500":"border-lenz-border",e),...i}),t&&(0,a.jsx)("p",{className:"mt-1 text-xs text-red-500",children:t})]})});l.displayName="Textarea"},6076:(e,r,t)=>{"use strict";t.d(r,{S3:()=>n,eY:()=>s,xH:()=>l,yD:()=>i});var a=t(686);let s=(0,a.J1)`
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
`,n=(0,a.J1)`
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
`;let i=(0,a.J1)`
  query SearchUsers($q: String!, $limit: Int) {
    searchUsers(q: $q, limit: $limit) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`,l=(0,a.J1)`
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
`},5753:(e,r,t)=>{"use strict";t.r(r),t.d(r,{default:()=>a});let a=(0,t(6760).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/z/my-project/apps/frontend/src/app/register/page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/z/my-project/apps/frontend/src/app/register/page.tsx","default")}};var r=require("../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),a=r.X(0,[345,106,312],()=>t(2883));module.exports=a})();