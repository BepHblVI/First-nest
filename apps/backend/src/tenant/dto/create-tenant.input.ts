// 一旦最小限。あなたが Phase 3-1 実装で完成させる
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export class CreateTenantInput {
  slug!: string;
  name!: string;
}
