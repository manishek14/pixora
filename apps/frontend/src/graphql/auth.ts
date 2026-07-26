import { gql } from '@apollo/client';

export const REGISTER = gql`
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
`;

export const LOGIN = gql`
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
`;

export const REFRESH_TOKEN = gql`
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
`;

export const ME = gql`
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
`;

export const UPDATE_PROFILE = gql`
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
`;

export const UPDATE_AVATAR = gql`
  mutation UpdateAvatar($url: String!) {
    updateAvatar(url: $url) {
      id
      avatarUrl
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($q: String!, $limit: Int) {
    searchUsers(q: $q, limit: $limit) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`;

export const USER_BY_USERNAME = gql`
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
`;

export const USER_BY_ID = gql`
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
`;
