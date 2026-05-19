import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { SignUpInput, PASSWORD_REGEX } from './sign-up.input';

/**
 * SignUpInput のバリデーションを実行し、フィールドごとの違反一覧を返すヘルパー。
 *
 * 戻り値の例:
 *   {
 *     username: ['minLength'],
 *     password: ['minLength', 'matches'],
 *   }
 *
 * これにより「どのフィールドで」「どの制約が」失敗したかを
 * 抽象的に検証できる(メッセージ文字列に依存しないテストになる)。
 */
async function validateInput(
  data: Partial<{ username: unknown; password: unknown }>,
): Promise<Record<string, string[]>> {
  const instance = plainToInstance(SignUpInput, data);
  const errors: ValidationError[] = await validate(instance);
  const result: Record<string, string[]> = {};
  for (const e of errors) {
    if (e.constraints) {
      result[e.property] = Object.keys(e.constraints);
    }
  }
  return result;
}

describe('SignUpInput バリデーション', () => {
  // ─────────────────────────────────────────
  // username
  // ─────────────────────────────────────────
  describe('username', () => {
    it('3文字未満は拒否される', async () => {
      const errors = await validateInput({
        username: 'ab',
        password: 'valid12345',
      });
      expect(errors.username).toContain('minLength');
    });

    it('50文字超は拒否される', async () => {
      const errors = await validateInput({
        username: 'a'.repeat(51),
        password: 'valid12345',
      });
      expect(errors.username).toContain('maxLength');
    });

    it('文字列以外は拒否される', async () => {
      const errors = await validateInput({
        username: 12345,
        password: 'valid12345',
      });
      expect(errors.username).toContain('isString');
    });

    it('適切な長さ(3〜50文字)なら通る', async () => {
      const errors = await validateInput({
        username: 'normaluser',
        password: 'valid12345',
      });
      expect(errors.username).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────
  // password
  // ─────────────────────────────────────────
  describe('password', () => {
    it('8文字未満は拒否される', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: 'abc12', // 5文字
      });
      expect(errors.password).toContain('minLength');
    });

    it('72文字超は拒否される(bcrypt制限)', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: 'a1' + 'x'.repeat(71), // 73文字
      });
      expect(errors.password).toContain('maxLength');
    });

    it('英字のみ(数字なし)は拒否される', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: 'onlyletters',
      });
      expect(errors.password).toContain('matches');
    });

    it('数字のみ(英字なし)は拒否される', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: '12345678',
      });
      expect(errors.password).toContain('matches');
    });

    it('英字+数字を含めば通る', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: 'abc12345',
      });
      expect(errors.password).toBeUndefined();
    });

    it('英字+数字+記号でも通る', async () => {
      const errors = await validateInput({
        username: 'someuser',
        password: 'Pa$$w0rd!',
      });
      expect(errors.password).toBeUndefined();
    });
  });
});

/**
 * PASSWORD_REGEX を「純粋関数として」直接テストする。
 *
 * 理由:
 *   - DTOレベルのテストは class-validator の挙動も含めた統合的なもの。
 *   - 一方、正規表現そのものの仕様を明示的に固定したい場合は
 *     この純粋関数テストの方が高速かつ読みやすい。
 *   - テーブル駆動 (it.each) で多数パターンを一括検証できる。
 */
describe('PASSWORD_REGEX', () => {
  it.each([
    // 通るケース
    ['abc12345', true, '英字+数字'],
    ['Pa$$w0rd', true, '英字+数字+記号'],
    ['A1aaaaaa', true, '大文字+数字'],
    ['1aaaaaaa', true, '数字+小文字'],

    // 弾くケース
    ['onlyletters', false, '英字のみ'],
    ['12345678', false, '数字のみ'],
    ['', false, '空文字'],
    ['!@#$%^&*', false, '記号のみ'],
  ])('"%s" => %s (%s)', (input, expected) => {
    expect(PASSWORD_REGEX.test(input)).toBe(expected);
  });
});
