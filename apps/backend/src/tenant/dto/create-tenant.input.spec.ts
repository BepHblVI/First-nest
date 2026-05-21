import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateTenantInput, SLUG_REGEX } from './create-tenant.input';

/**
 * SignUpInput と同じ方式: バリデーションエラーから「どのフィールドの何の制約か」だけ取り出す
 */
async function validateInput(
  data: Partial<{ slug: unknown; name: unknown }>,
): Promise<Record<string, string[]>> {
  const instance = plainToInstance(CreateTenantInput, data);
  const errors: ValidationError[] = await validate(instance);
  const result: Record<string, string[]> = {};
  for (const e of errors) {
    if (e.constraints) {
      result[e.property] = Object.keys(e.constraints);
    }
  }
  return result;
}

describe('CreateTenantInput バリデーション', () => {
  describe('slug', () => {
    it('3文字未満は拒否される', async () => {
      const errors = await validateInput({ slug: 'ab', name: 'Valid Name' });
      expect(errors.slug).toContain('minLength');
    });

    it('64文字以上は拒否される', async () => {
      const errors = await validateInput({
        slug: 'a'.repeat(64),
        name: 'Valid Name',
      });
      expect(errors.slug).toContain('maxLength');
    });

    it('大文字を含む場合は拒否される', async () => {
      const errors = await validateInput({
        slug: 'MyTenant',
        name: 'Valid Name',
      });
      expect(errors.slug).toContain('matches');
    });

    it('ハイフン以外の記号を含む場合は拒否される', async () => {
      const errors = await validateInput({
        slug: 'my_tenant',
        name: 'Valid Name',
      });
      expect(errors.slug).toContain('matches');
    });

    it('ハイフンで開始する場合は拒否される', async () => {
      const errors = await validateInput({
        slug: '-mytenant',
        name: 'Valid Name',
      });
      expect(errors.slug).toContain('matches');
    });

    it('ハイフンで終了する場合は拒否される', async () => {
      const errors = await validateInput({
        slug: 'mytenant-',
        name: 'Valid Name',
      });
      expect(errors.slug).toContain('matches');
    });

    it('英小文字・数字・ハイフンの組み合わせなら通る', async () => {
      const errors = await validateInput({
        slug: 'my-tenant-123',
        name: 'Valid Name',
      });
      expect(errors.slug).toBeUndefined();
    });
  });

  describe('name', () => {
    it('空文字は拒否される', async () => {
      const errors = await validateInput({ slug: 'valid', name: '' });
      // class-validator では空文字を IsNotEmpty で弾く、または MinLength(1)
      // どちらかの制約名が含まれることを確認
      expect(
        errors.name?.some((m) => m === 'isNotEmpty' || m === 'minLength'),
      ).toBe(true);
    });

    it('100文字超は拒否される', async () => {
      const errors = await validateInput({
        slug: 'valid',
        name: 'a'.repeat(101),
      });
      expect(errors.name).toContain('maxLength');
    });

    it('日本語を含んでも通る', async () => {
      const errors = await validateInput({
        slug: 'valid',
        name: 'サンプル組織',
      });
      expect(errors.name).toBeUndefined();
    });
  });
});

/**
 * 正規表現自体の単体テスト (純粋関数なのでテーブル駆動)
 */
describe('SLUG_REGEX', () => {
  it.each([
    // 通るケース
    ['alice', true, '英小文字のみ'],
    ['alice123', true, '英数字'],
    ['my-tenant', true, 'ハイフン入り'],
    ['a-b-c-d', true, 'ハイフン複数'],
    ['a1', true, '2文字 (※長さチェックは別)'],
    ['123', true, '数字のみ'],

    // 弾くケース
    ['', false, '空文字'],
    ['Alice', false, '大文字を含む'],
    ['-alice', false, 'ハイフン開始'],
    ['alice-', false, 'ハイフン終了'],
    ['ali_ce', false, 'アンダースコア'],
    ['ali ce', false, '空白'],
    ['ali.ce', false, 'ピリオド'],
  ])('"%s" => %s (%s)', (input, expected) => {
    expect(SLUG_REGEX.test(input)).toBe(expected);
  });
});
