// apps/frontend/src/queries/togglePublished.ts
import { graphql } from '../gql';

export const TogglePublishedMutation = graphql(`
  mutation TogglePublished($id: Int!, $published: Boolean!) {
    togglePublished(id: $id, published: $published) {
      id
      published
    }
  }
`);
