// src/queries/auth.ts
import { graphql } from '../gql';

export const LoginMutation = graphql(`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      access_token
    }
  }
`);

export const SignUpMutation = graphql(`
  mutation SignUp($username: String!, $password: String!) {
    signUp(username: $username, password: $password) {
      id
      username
    }
  }
`);

export const RefreshMutation = graphql(`
  mutation Refresh {
    refresh {
      access_token
    }
  }
`);
