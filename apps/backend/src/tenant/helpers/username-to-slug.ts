export function usernameToSlug(input: string): string {
  return input
    .trim() // 前後の空白を除去
    .toLowerCase() // 小文字化
    .replace(/\s+/g, '-') // 連続する空白を1つのハイフンに
    .replace(/-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-+|-+$/g, ''); // 先頭・末尾のハイフンを除去
}
