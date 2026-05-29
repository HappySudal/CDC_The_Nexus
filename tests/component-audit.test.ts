import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { COMPONENT_AUDIT, COMPONENT_AUDIT_COUNT } from '@/components/component_audit';

/**
 * P2-H6 검증: 자동 생성된 component_audit.ts가 실제 src/components/*.vue 와 일치하는지 확인.
 * 컴포넌트를 추가/삭제한 뒤 `npm run generate:audit`을 실행하지 않으면 이 테스트가 실패한다.
 */
describe('Component Audit Registry (P2-H6)', () => {
  const componentsDir = path.resolve(__dirname, '../src/components');
  const actualComponents = fs
    .readdirSync(componentsDir)
    .filter((f) => f.endsWith('.vue'))
    .map((f) => f.replace(/\.vue$/, ''))
    .sort();

  const VALID_TYPES = ['Page', 'Modal', 'Panel', 'Widget'];

  it('모든 .vue 컴포넌트가 감사에 등재되어 있다', () => {
    const auditNames = COMPONENT_AUDIT.map((e) => e.name).sort();
    expect(auditNames).toEqual(actualComponents);
  });

  it('감사에 존재하지 않는 컴포넌트가 없다 (유령 항목 없음)', () => {
    for (const entry of COMPONENT_AUDIT) {
      expect(fs.existsSync(path.join(componentsDir, `${entry.name}.vue`))).toBe(true);
    }
  });

  it('COMPONENT_AUDIT_COUNT가 실제 컴포넌트 수와 일치한다', () => {
    expect(COMPONENT_AUDIT_COUNT).toBe(actualComponents.length);
    expect(COMPONENT_AUDIT.length).toBe(COMPONENT_AUDIT_COUNT);
  });

  it('중복 항목이 없다', () => {
    const names = COMPONENT_AUDIT.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('모든 항목의 type 분류가 유효하다', () => {
    for (const entry of COMPONENT_AUDIT) {
      expect(VALID_TYPES).toContain(entry.type);
    }
  });

  it('모든 항목이 필수 필드(배열 형태 props/emits/dependencies)를 가진다', () => {
    for (const entry of COMPONENT_AUDIT) {
      expect(typeof entry.name).toBe('string');
      expect(entry.path).toBe(`./${entry.name}.vue`);
      expect(Array.isArray(entry.props)).toBe(true);
      expect(Array.isArray(entry.emits)).toBe(true);
      expect(Array.isArray(entry.dependencies)).toBe(true);
    }
  });

  it('props가 있는 컴포넌트의 메타데이터가 추출되어 있다', () => {
    const kg = COMPONENT_AUDIT.find((e) => e.name === 'KnowledgeGraphVisualizer');
    expect(kg).toBeDefined();
    expect(kg!.props.length).toBeGreaterThan(0);
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
