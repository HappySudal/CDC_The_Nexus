/**
 * APOSTLE Registry — 의장 + 13사도 라우팅 정의
 *
 * Phase D3.1: 의장-Nexus Live IPC의 라우팅 대상 명단.
 * tier 0: 의장 (Sovereign, 모든 라우팅의 종착점)
 * tier 1: 내부 사도 (CDC 운영자 페르소나)
 * tier 2: 외부 AI 모델 (LLM/검색/팩트체크)
 *
 * 단위 테스트 가능하도록 electron 의존 없이 순수 데이터로 분리.
 */

export const APOSTLE_REGISTRY = Object.freeze([
  { id: 'sudal',      name: '수달',       role: 'Chairman & Sovereign',          tier: 0 },
  { id: 'lando',      name: '란도',       role: 'Control Center & COO',          tier: 1 },
  { id: 'anti',       name: 'Antigravity', role: 'Architect & Reviewer',         tier: 1 },
  { id: 'seogi',      name: '서기',       role: 'Secretary & Reporter',          tier: 1 },
  { id: 'taesoon',    name: '태순',       role: 'Operations Engineer',           tier: 1 },
  { id: 'marco',      name: '마르코',     role: 'Integration',                   tier: 1 },
  { id: 'leo',        name: '레오',       role: 'Execution Custodian',           tier: 1 },
  { id: 'guardian',   name: '가디언',     role: 'Security & Compliance',         tier: 1 },
  { id: 'amadeus',    name: '아마데우스', role: 'Analytics',                     tier: 1 },
  { id: 'openclaude', name: 'OpenClaude', role: 'Developer & Code Generator',    tier: 2 },
  { id: 'gemini',     name: 'Gemini',     role: 'Long-Context Cross-Check',      tier: 2 },
  { id: 'grok',       name: 'Grok',       role: 'Adversarial Critic',            tier: 2 },
  { id: 'perplexity', name: 'Perplexity', role: 'Fact-Check & Recency',          tier: 2 },
  { id: 'ollama',     name: 'Ollama',     role: 'Local LLM Runner',              tier: 2 },
]);

export function findApostle(id) {
  return APOSTLE_REGISTRY.find(a => a.id === id) || null;
}

export function filterApostlesByTier(tier) {
  return APOSTLE_REGISTRY.filter(a => a.tier === tier);
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
