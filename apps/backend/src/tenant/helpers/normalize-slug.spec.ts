import { normalizeSlug } from './normalize-slug';

/**
 * normalizeSlug の責務:
 *   ユーザー入力を「DNS/URL で安全に使える slug 形式」に変換する。
 *
 * 設計判断:
 *   - 受け入れは寛容に、出力は厳格に (Postel's Law)
 *   - 不正な文字は除去 or 変換し、できる限り使える slug に整える
 *   - ただし、変換不能なケース(空文字、変換後が短すぎる等)はそのまま返し、
 *     バリデーション層 (class-validator) で弾く
 */
describe('normalizeSlug', () => {
  it('大文字を小文字に変換する', () => {
    expect(normalizeSlug('Alice')).toBe('alice');
  });

  it('前後の空白を除去する', () => {
    expect(normalizeSlug('  alice  ')).toBe('alice');
  });

  it('全角空白も除去する', () => {
    expect(normalizeSlug('\u3000alice\u3000')).toBe('alice');
  });

  it('連続するハイフンを1つにまとめる', () => {
    expect(normalizeSlug('foo---bar')).toBe('foo-bar');
  });

  it('先頭・末尾のハイフンを除去する', () => {
    expect(normalizeSlug('-alice-')).toBe('alice');
  });

  it('複数のスペースをハイフンに置換する', () => {
    expect(normalizeSlug('hello world')).toBe('hello-world');
  });

  it('全て小文字英数字とハイフンの場合はそのまま返す', () => {
    expect(normalizeSlug('valid-slug-123')).toBe('valid-slug-123');
  });

  it('空文字を入れても例外を投げない(空文字を返す)', () => {
    // バリデーション層で弾く前提なので、ここでは例外にしない
    expect(normalizeSlug('')).toBe('');
  });
});
