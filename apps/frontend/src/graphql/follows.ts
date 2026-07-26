import { gql } from '@apollo/client';

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: String!) {
    followUser(userId: $userId)
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId)
  }
`;

export const IS_FOLLOWING = gql`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;

export const FOLLOWERS = gql`
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`;

export const FOLLOWING = gql`
  query Following($userId: String!) {
    following(userId: $userId) {
      id
      username
      fullName
      avatarUrl
      isVerified
    }
  }
`;

export const TOGGLE_CLOSE_FRIEND = gql`
  mutation ToggleCloseFriend($userId: String!, $isClose: Boolean!) {
    toggleCloseFriend(userId: $userId, isClose: $isClose)
  }
`;

export const MY_CLOSE_FRIENDS = gql`
  query MyCloseFriends {
    myCloseFriends {
      id
      username
      fullName
      avatarUrl
    }
  }
`;
