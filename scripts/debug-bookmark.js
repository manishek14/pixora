// Add a debug query call to print the actual error response
const { Test } = require('@nestjs/testing');
const { AppModule } = require('./src/app.module');

async function debug() {
  const m = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = m.createNestApplication();
  await app.init();
  const supertest = require('supertest');
  
  // Register alice
  const reg = await supertest(app.getHttpServer())
    .post('/graphql')
    .send({ query: `mutation { register(input: { username: "dbguser1", email: "dbg1@test.com", password: "Str0ng!Pass" }) { user { id } accessToken } }` });
  console.log('register:', reg.body);
  const token = reg.body.data.register.accessToken;
  const userId = reg.body.data.register.user.id;
  
  // Create a post
  const post = await supertest(app.getHttpServer())
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({ query: `mutation { createPost(input: { caption: "dbg post", mediaUrls: ["https://cdn.test/p.jpg"] }) { id } }` });
  console.log('createPost:', post.body);
  const postId = post.body.data.createPost.id;
  
  // Toggle bookmark
  const toggle = await supertest(app.getHttpServer())
    .post('/graphql')
    .set('Authorization', `Bearer ${token}`)
    .send({ query: `mutation { toggleBookmark(postId: "${postId}") }` });
  console.log('toggleBookmark:', JSON.stringify(toggle.body, null, 2));
  
  await app.close();
  process.exit(0);
}
debug().catch(e => { console.error(e); process.exit(1); });
