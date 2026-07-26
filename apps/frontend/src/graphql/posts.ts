import { gql } from '@apollo/client';

export const FEED = gql`
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
`;

export const EXPLORE_FEED = gql`
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
`;

export const POSTS_BY_USER = gql`
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
`;

export const POST_BY_ID = gql`
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
`;

export const POSTS_BY_HASHTAG = gql`
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
`;

export const CREATE_POST = gql`
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
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: String!) {
    deletePost(id: $id)
  }
`;

export const TOGGLE_LIKE = gql`
  mutation ToggleLike($postId: String!) {
    toggleLike(postId: $postId)
  }
`;

export const IS_LIKED = gql`
  query IsLiked($postId: String!) {
    isLiked(postId: $postId)
  }
`;

export const COMMENTS = gql`
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
`;

export const CREATE_COMMENT = gql`
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
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`;
