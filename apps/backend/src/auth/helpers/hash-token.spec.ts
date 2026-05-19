import { hashToken } from './hash-token';

describe('hashToken', () => {
  it('同じ入力からは常に同じハッシュが返る(冪等性)', () => {
    // ハッシュ関数は「同じ入力 → 同じ出力」が必須。
    // ローテーション時のDB検索に使うので、ここが壊れると認証全体が動かない。
    const token = 'sample-token-xyz';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('違う入力からは違うハッシュが返る', () => {
    // 衝突耐性の最低限の確認。SHA-256 で実際に衝突を見つけるのは
    // 宇宙の年齢レベルの計算量なので、ここは "実用上の" 確認。
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('SHA-256のhex形式(64文字、a-f0-9のみ)で返る', () => {
    // DBカラム varchar(64) と一致することの保証。
    // 形式が崩れると ER 図と乖離する。
    expect(hashToken('any-token')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('空文字でもハッシュが生成される', () => {
    // 防御的プログラミング: 空文字でも例外を投げず一定形式を返す。
    // (SHA-256 は空文字に対しても e3b0c44... という決まった値を返す)
    expect(hashToken('')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('日本語など多バイト文字でも正常に動作する', () => {
    // utf-8 として正しく扱われる保証。
    expect(hashToken('日本語トークン')).toMatch(/^[a-f0-9]{64}$/);
  });
});
