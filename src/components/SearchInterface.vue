<template>
  <div class="search-interface">
    <!-- 검색 헤더 -->
    <div class="search-header">
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="검색어를 입력하세요... (제목, 내용, 에이전트, 태그)"
          @input="performSearch"
          @keydown.enter="executeSearch"
          class="search-input"
        />
        <button @click="executeSearch" class="search-btn">
          🔍 검색
        </button>
        <button @click="clearSearch" class="clear-btn">
          ✕ 초기화
        </button>
      </div>
    </div>

    <!-- 고급 필터 -->
    <div class="filter-section">
      <div class="filter-group">
        <label>시스템</label>
        <div class="checkbox-group">
          <label v-for="system in availableSystems" :key="system">
            <input
              v-model="selectedSystems"
              type="checkbox"
              :value="system"
              @change="applyFilters"
            />
            {{ system }}
          </label>
        </div>
      </div>

      <div class="filter-group">
        <label>날짜 범위</label>
        <div class="date-range">
          <input
            v-model="dateRange.start"
            type="date"
            @change="applyFilters"
            class="date-input"
          />
          <span>~</span>
          <input
            v-model="dateRange.end"
            type="date"
            @change="applyFilters"
            class="date-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <label>상태</label>
        <select v-model="selectedStatus" @change="applyFilters" class="status-select">
          <option value="">모두</option>
          <option value="active">진행 중</option>
          <option value="completed">완료</option>
          <option value="pending">대기</option>
          <option value="failed">실패</option>
        </select>
      </div>

      <div class="filter-group">
        <label>태그</label>
        <input
          v-model="selectedTag"
          type="text"
          placeholder="태그 검색..."
          @input="applyFilters"
          class="tag-input"
        />
      </div>
    </div>

    <!-- 검색 결과 -->
    <div class="results-section">
      <div class="results-header">
        <h3>검색 결과 ({{ filteredResults.length }})</h3>
        <div class="sort-controls">
          <label>정렬:</label>
          <select v-model="sortBy" @change="applySort" class="sort-select">
            <option value="relevance">관련성</option>
            <option value="date_desc">최신순</option>
            <option value="date_asc">오래된순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      <div v-if="isSearching" class="loading-state">
        <div class="spinner"></div>
        <p>검색 중...</p>
      </div>

      <div v-else-if="filteredResults.length === 0" class="no-results-state">
        <p>{{ searchQuery ? '검색 결과가 없습니다.' : '필터를 설정하고 검색하세요.' }}</p>
      </div>

      <div v-else class="results-list">
        <div
          v-for="(result, index) in paginatedResults"
          :key="index"
          class="result-item"
          @click="selectResult(result)"
          :class="{ active: selectedResult?.id === result.id }"
        >
          <div class="result-header">
            <h4>{{ result.title }}</h4>
            <span class="result-badge" :class="result.status">{{ result.status }}</span>
          </div>
          <p class="result-snippet">{{ truncateText(result.content, 150) }}</p>
          <div class="result-meta">
            <span class="system-tag">{{ result.system }}</span>
            <span class="date-tag">{{ formatDate(result.timestamp) }}</span>
            <span v-if="result.agent" class="agent-tag">@{{ result.agent }}</span>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          이전
        </button>
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          다음
        </button>
      </div>
    </div>

    <!-- 상세 뷰 -->
    <div v-if="selectedResult" class="detail-panel">
      <div class="detail-header">
        <h3>{{ selectedResult.title }}</h3>
        <button @click="selectedResult = null" class="close-btn">✕</button>
      </div>
      <div class="detail-content">
        <div class="detail-meta">
          <p><strong>시스템:</strong> {{ selectedResult.system }}</p>
          <p><strong>상태:</strong> {{ selectedResult.status }}</p>
          <p><strong>작성일:</strong> {{ formatDate(selectedResult.timestamp) }}</p>
          <p v-if="selectedResult.agent"><strong>담당:</strong> {{ selectedResult.agent }}</p>
        </div>
        <div class="detail-text" v-html="highlightKeywords(selectedResult.content)"></div>
        <div v-if="selectedResult.tags" class="detail-tags">
          <span v-for="tag in selectedResult.tags" :key="tag" class="tag">
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const searchQuery = ref('');
const selectedSystems = ref([]);
const availableSystems = ref(['Nexus', 'Ollama', 'Morning', 'TwinBrain', 'CDC']);
const dateRange = ref({ start: '', end: '' });
const selectedStatus = ref('');
const selectedTag = ref('');
const sortBy = ref('relevance');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const isSearching = ref(false);
const filteredResults = ref([]);
const selectedResult = ref(null);
const mockResults = ref([
  {
    id: 1,
    title: 'CDC 마스터 헌법 정독',
    content: '사령부 헌법 01_MASTER_CONSTITUTION.md 정독으로 7단계 프로토콜 확인. 모든 에이전트는 본 헌법에 명시된 규칙을 맹목적으로 준수해야 함.',
    system: 'CDC',
    status: 'completed',
    timestamp: '2026-05-07T08:00:00Z',
    agent: 'Lando',
    tags: ['헌법', '프로토콜', '필수']
  },
  {
    id: 2,
    title: 'Nexus Phase 2 개발팀 구성',
    content: '2026-05-16 킥오프 준비. OpenClaude 개발리더, Marco 통합리더, Amadeus 분석리더 등 7명의 코어팀 확정. 역할별 킥오프 준비 사항 정의.',
    system: 'Nexus',
    status: 'active',
    timestamp: '2026-05-07T14:00:00Z',
    agent: 'OpenClaude',
    tags: ['개발', '팀', 'Phase2']
  }
]);

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredResults.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() => Math.ceil(filteredResults.value.length / itemsPerPage.value));

function performSearch() {
  if (searchQuery.value.length < 2) {
    filteredResults.value = [];
    return;
  }
  isSearching.value = true;
  setTimeout(() => {
    executeSearch();
    isSearching.value = false;
  }, 300);
}

function executeSearch() {
  const query = searchQuery.value.toLowerCase();
  const results = mockResults.value.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.content.toLowerCase().includes(query)
  );
  applyFilters(results);
}

function applyFilters(results = null) {
  // results가 null이면 filteredResults 또는 mockResults 사용
  if (results === null) {
    results = filteredResults.value.length > 0 ? filteredResults.value : mockResults.value;
  }

  // 타입 가드: results가 배열이 아니면 초기화
  if (!Array.isArray(results)) {
    console.warn('[SearchInterface] applyFilters: results is not an array', results);
    results = [];
  }

  if (selectedSystems.value.length > 0) {
    results = results.filter(item => selectedSystems.value.includes(item.system));
  }

  if (selectedStatus.value) {
    results = results.filter(item => item.status === selectedStatus.value);
  }

  if (selectedTag.value) {
    results = results.filter(item => item.tags && item.tags.includes(selectedTag.value));
  }

  if (dateRange.value.start && dateRange.value.end) {
    results = results.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= new Date(dateRange.value.start) &&
             itemDate <= new Date(dateRange.value.end);
    });
  }

  filteredResults.value = results;
  currentPage.value = 1;
  applySort();
}

function applySort() {
  const results = [...filteredResults.value];

  switch (sortBy.value) {
    case 'date_desc':
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      break;
    case 'date_asc':
      results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      break;
    case 'title':
      results.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  filteredResults.value = results;
}

function selectResult(result) {
  selectedResult.value = result;
}

function clearSearch() {
  searchQuery.value = '';
  selectedSystems.value = [];
  dateRange.value = { start: '', end: '' };
  selectedStatus.value = '';
  selectedTag.value = '';
  sortBy.value = 'relevance';
  filteredResults.value = [];
  selectedResult.value = null;
  currentPage.value = 1;
}

function truncateText(text, length) {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('ko-KR');
}

function highlightKeywords(text) {
  if (!searchQuery.value) return text;
  const regex = new RegExp(`(${searchQuery.value})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

onMounted(() => {
  // IPC 리스너 설정 (추후 백엔드 연동)
  if (window.electronAPI) {
    window.electronAPI.onSearchResults?.((results) => {
      filteredResults.value = results;
    });
  }
});
</script>

<style scoped>
.search-interface {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #0a0e27;
  color: #e0e6ed;
  min-height: 100vh;
}

.search-header {
  background: linear-gradient(135deg, #0a0e27 0%, #0f1a38 100%);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #1a2f5f;
}

.search-container {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 6px;
  color: #e0e6ed;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.search-btn,
.clear-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.search-btn {
  background-color: #0ea5e9;
  color: #fff;
}

.search-btn:hover {
  background-color: #0d95d3;
}

.clear-btn {
  background-color: #1a2f5f;
  color: #7a8ba0;
}

.clear-btn:hover {
  background-color: #253551;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #7a8ba0;
  text-transform: uppercase;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: normal;
  text-transform: none;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  cursor: pointer;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  flex: 1;
  padding: 8px;
  background-color: #0a0e27;
  border: 1px solid #1a2f5f;
  border-radius: 4px;
  color: #e0e6ed;
  font-size: 12px;
}

.status-select,
.sort-select,
.tag-input {
  padding: 8px;
  background-color: #0a0e27;
  border: 1px solid #1a2f5f;
  border-radius: 4px;
  color: #e0e6ed;
  font-size: 12px;
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #1a2f5f;
}

.results-header h3 {
  margin: 0;
  font-size: 16px;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.loading-state,
.no-results-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #7a8ba0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #1a2f5f;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.result-item.active {
  border-color: #0ea5e9;
  background-color: rgba(14, 165, 233, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-header h4 {
  margin: 0;
  color: #0ea5e9;
  font-size: 14px;
}

.result-badge {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.result-badge.completed {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.result-badge.active {
  background-color: rgba(14, 165, 233, 0.2);
  color: #0ea5e9;
}

.result-badge.pending {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.result-badge.failed {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.result-snippet {
  margin: 8px 0;
  font-size: 13px;
  color: #c4d0df;
  line-height: 1.5;
}

.result-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #7a8ba0;
}

.system-tag,
.date-tag,
.agent-tag {
  background-color: rgba(14, 165, 233, 0.1);
  padding: 2px 8px;
  border-radius: 3px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  margin-top: 12px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #0d95d3;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #7a8ba0;
}

.detail-panel {
  padding: 20px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #1a2f5f;
}

.detail-header h3 {
  margin: 0;
  color: #0ea5e9;
}

.close-btn {
  background: none;
  border: none;
  color: #7a8ba0;
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #0ea5e9;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-meta p {
  margin: 0;
  font-size: 13px;
  color: #c4d0df;
}

.detail-meta strong {
  color: #0ea5e9;
}

.detail-text {
  font-size: 13px;
  color: #c4d0df;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-text mark {
  background-color: rgba(14, 165, 233, 0.3);
  color: inherit;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #1a2f5f;
}

.tag {
  padding: 4px 8px;
  background-color: rgba(14, 165, 233, 0.1);
  border-radius: 3px;
  font-size: 12px;
  color: #0ea5e9;
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
