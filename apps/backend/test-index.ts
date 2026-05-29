import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

// 💡 【変更】スキャン対象をプロジェクトルート配下の「src」と「test」両方にする
const SCAN_TARGETS = [
  path.join(__dirname, 'src'),
  path.join(__dirname, 'test'),
];
const OUTPUT_FILE = path.join(__dirname, 'TESTS_INDEX.md');

// 解析対象とする拡張子（すべてのテスト形式を網羅）
const TARGET_EXTENSIONS = ['.e2e-spec.ts', '.integration-spec.ts', '.spec.ts'];

async function getTestFiles(dir: string): Promise<string[]> {
  let results: string[] = [];

  // ディレクトリが存在しない場合はスキップ
  if (!fs.existsSync(dir)) return results;

  const list = await fsPromises.readdir(dir, { withFileTypes: true });

  for (const file of list) {
    const res = path.resolve(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(await getTestFiles(res));
    } else if (TARGET_EXTENSIONS.some((ext) => file.name.endsWith(ext))) {
      results.push(res);
    }
  }
  return results;
}

function parseTestFile(content: string): string {
  const lines = content.split('\n');
  let output = '';
  let depth = 0;

  lines.forEach((line) => {
    const describeMatch = line.match(/describe\(\s*['"`](.*?)['"`]/);
    const testMatch = line.match(/(test|it)(\.each)?\(\s*['"`](.*?)['"`]/);

    if (
      line.includes('describe') ||
      line.includes('test(') ||
      line.includes('it(')
    ) {
      const match = line.match(/^\s*/);
      const spaces = match ? match[0].length : 0;
      depth = Math.floor(spaces / 2);
    }

    if (describeMatch) {
      const title = describeMatch[1];
      const indent = '  '.repeat(depth);
      output += `${indent}- 📁 **${title}**\n`;
    } else if (testMatch) {
      const title = testMatch[3];

      // 💡 【追加】チェイニングによる「📄 .」などのドット単体や空のゴミデータを排除
      if (title === '.' || title.trim() === '') return;

      const indent = '  '.repeat(depth);
      const cleanTitle = title.replace(/\$name/, '`$name` (パターン検証)');
      output += `${indent}- 📄 ${cleanTitle}\n`;
    }
  });

  return output;
}

async function main() {
  try {
    let allFiles: string[] = [];

    // 💡 設定されたすべてのディレクトリからテストファイルを再帰的に集める
    for (const targetDir of SCAN_TARGETS) {
      const files = await getTestFiles(targetDir);
      allFiles = allFiles.concat(files);
    }

    if (allFiles.length === 0) {
      console.log(
        '対象のテストファイル（.spec.ts / .e2e-spec.ts）が見つかりませんでした。',
      );
      return;
    }

    let markdown = `# 📋 Backend 全テスト設計・構成目次\n\n`;
    markdown += `> 💡 このファイルは \`generate-all-tests-index.ts\` によって自動生成されています。\n`;
    markdown += `> 単体テスト(spec)、統合テスト(integration)、E2Eテスト(e2e-spec)の実態と100%連動しています。\n\n`;

    // ファイル名順にソート
    allFiles.sort();

    for (const file of allFiles) {
      const relativePath = path.relative(__dirname, file);
      const fileName = path.basename(file);
      const content = await fsPromises.readFile(file, 'utf8');

      markdown += `## 📄 ${fileName}\n`;
      markdown += `📂 \`/${relativePath.replace(/\\/g, '/')}\`\n\n`;

      const fileStructure = parseTestFile(content);
      if (fileStructure.trim()) {
        markdown += fileStructure + '\n';
      } else {
        markdown += `  - ⚠️ テストケース、またはdescribeブロックが空か、解析可能なフォーマットではありません。\n\n`;
      }
      markdown += `---\n\n`;
    }

    await fsPromises.writeFile(OUTPUT_FILE, markdown, 'utf8');
    console.log(
      `✨ すべてのテスト（単体/統合/E2E）を解析し、目次ファイルを生成しました: ${OUTPUT_FILE}`,
    );
  } catch (err) {
    console.error('目次の生成中にエラーが発生しました:', err);
  }
}

// 💡 ESLintの怒りを静めるため void でフローティングPromiseを明示的にマーク
void main();
