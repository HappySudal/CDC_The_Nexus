/**
 * 슬로건 컴플라이언스 도구 (coding-style.md: 모든 파일 하단 한/영 슬로건 병기)
 *
 * NEXUS 소스 파일을 스캔하여 슬로건 푸터가 없는 파일에 확장자별 올바른 주석 문법으로 추가한다.
 * append-only + idempotent (이미 있으면 건너뜀). 위험 타입(.json/binary/build artifact)은 제외.
 *
 * 실행: node src/scripts/ensure-slogan.mjs        (적용)
 *        node src/scripts/ensure-slogan.mjs --dry  (변경 예정만 출력)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..'); // PJT_CDC_The_Nexus
const DRY = process.argv.includes('--dry');

const KO = '시각(時刻)에 존재하고, 시간(時間)에 소멸한다.';
const EN = 'Exists in the Moment, Vanishes in Time.';
const MARKER = 'Exists in the Moment'; // 존재 판별 키

// 확장자별 슬로건 푸터 생성
function footerFor(ext) {
  switch (ext) {
    case '.vue':
      return `\n<!-- "${KO}" -->\n<!-- "${EN}" -->\n`;
    case '.ts':
    case '.js':
    case '.mjs':
    case '.cjs':
      return `\n// ${KO}\n// ${EN}\n`;
    case '.md':
      return `\n\n**"${KO}"**\n**"${EN}"**\n`;
    case '.ps1':
      return `\n# ${KO}\n# ${EN}\n`;
    default:
      return null; // 미지원 타입은 건너뜀
  }
}

const INCLUDE_DIRS = ['src', 'tests', 'electron', 'docs'];
const SUPPORTED = new Set(['.vue', '.ts', '.js', '.mjs', '.cjs', '.md', '.ps1']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'Application', '__pycache__', '.nexus-graph', '06_Releases', '.git']);

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
    } else {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

const files = [];
for (const d of INCLUDE_DIRS) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) walk(full, files);
}
// 루트 직속 지원 파일도 포함 (vitest.config.ts 등)
for (const f of fs.readdirSync(ROOT)) {
  const full = path.join(ROOT, f);
  if (fs.statSync(full).isFile()) files.push(full);
}

let changed = 0;
let skipped = 0;
for (const file of files) {
  const ext = path.extname(file);
  if (!SUPPORTED.has(ext)) continue;
  const footer = footerFor(ext);
  if (!footer) continue;

  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes(MARKER)) {
    skipped += 1;
    continue;
  }

  const rel = path.relative(ROOT, file);
  if (DRY) {
    console.log(`[ADD] ${rel}`);
  } else {
    const sep = content.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(file, content + sep + footer, 'utf-8');
    console.log(`[ADDED] ${rel}`);
  }
  changed += 1;
}

console.log(`\n${DRY ? '추가 예정' : '추가 완료'}: ${changed}개 / 건너뜀(이미 보유): ${skipped}개`);

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
