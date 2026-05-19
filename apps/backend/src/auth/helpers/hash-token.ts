import { createHash } from 'crypto';

/**
 * トークン文字列を SHA-256 でハッシュ化する純粋関数。
 *
 * 用途:
 *   - DBに RefreshToken を保存する際、生のJWTではなくこのハッシュを保存する。
 *     こうしておくとDBが漏洩しても、攻撃者は生のトークンを復元できない。
 *
 * 設計判断:
 *   - bcrypt ではなく SHA-256 を使う理由:
 *       - bcrypt は「人間のパスワード」のように低エントロピーな入力に対する
 *         オフライン総当たり攻撃を防ぐためにコストを上げる設計。
 *       - 一方 JWT は十分に高エントロピー(署名込み)なので、衝突耐性のみで十分。
 *       - bcrypt は遅いので、毎リクエストで使うとパフォーマンスを損なう。
 *
 * @param token 生のトークン文字列(通常はJWT)
 * @returns 64文字のhex形式SHA-256ハッシュ
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
