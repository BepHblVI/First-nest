import { registerEnumType } from '@nestjs/graphql';

/**
 * テナント内でのユーザーロール。
 *
 * 権限の階層:
 *   OWNER  > ADMIN > EDITOR > VIEWER
 *
 * - OWNER:  テナントの所有者(削除権、課金管理、全権限)
 * - ADMIN:  メンバー管理、設定変更、Survey の全操作
 * - EDITOR: Survey の作成・編集
 * - VIEWER: Survey の閲覧、回答送信
 */
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

// GraphQL に enum を登録 (Phase 3-2 の後半 / Resolver で使うため)
registerEnumType(Role, {
  name: 'Role',
  description: 'テナント内でのユーザーロール',
  valuesMap: {
    OWNER: { description: 'テナントの所有者(全権限)' },
    ADMIN: { description: '管理者(メンバー管理・設定変更)' },
    EDITOR: { description: '編集者(Survey の作成・編集)' },
    VIEWER: { description: '閲覧者(Survey の閲覧・回答)' },
  },
});
