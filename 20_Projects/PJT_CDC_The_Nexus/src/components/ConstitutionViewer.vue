<template>
  <div class="constitution-viewer">
    <!-- 헤더 -->
    <div class="viewer-header">
      <div class="title-section">
        <h2>📜 CDC 마스터 헌법</h2>
        <span class="last-updated">{{ lastUpdated }}</span>
      </div>

      <div class="controls">
        <!-- 검색창 -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="조항/키워드 검색..."
            @input="filterContent"
            class="search-input"
          />
        </div>

        <!-- 새로고침 버튼 -->
        <button
          @click="refreshConstitution"
          :disabled="isLoading"
          class="refresh-btn"
        >
          {{ isLoading ? '로딩 중...' : '🔄 새로고침' }}
        </button>
      </div>
    </div>

    <!-- 섹션 네비게이션 -->
    <div class="section-nav">
      <button
        v-for="(section, index) in sections"
        :key="index"
        @click="currentSection = index"
        :class="{ active: currentSection === index }"
        class="nav-btn"
      >
        {{ section.title }}
      </button>
    </div>

    <!-- 콘텐츠 영역 -->
    <div class="content-area">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>헌법 로드 중...</p>
      </div>

      <div v-else-if="filteredContent.length === 0" class="no-results">
        <p>검색 결과가 없습니다.</p>
      </div>

      <div v-else class="content-container">
        <!-- 섹션별 콘텐츠 -->
        <div
          v-for="(item, index) in filteredContent"
          :key="index"
          class="content-item"
          :id="`item-${index}`"
        >
          <h3>{{ item.title }}</h3>
          <div class="content-text" v-html="highlightSearch(item.text)"></div>
          <div class="item-meta">
            <span class="section-badge">{{ sections[currentSection]?.title }}</span>
            <button @click="toggleBookmark(index)" class="bookmark-btn">
              {{ bookmarks.includes(index) ? '⭐' : '☆' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 푸터 -->
    <div class="viewer-footer">
      <p class="philosophy">"Exists in the Moment, Vanishes in Time."</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConstitutionViewer',
  data() {
    return {
      constitutionContent: '',
      sections: [
        { title: 'Part 1. 철학', id: 'philosophy' },
        { title: 'Part 2. 규칙 위계', id: 'hierarchy' },
        { title: 'Part 3. 행동 강제 제어', id: 'control' },
        { title: 'Part 4. 통합 시스템', id: 'architecture' },
        { title: 'Part 5. 물리적 위계', id: 'physical' },
        { title: 'Part 6. 에이전트 책임', id: 'agents' }
      ],
      currentSection: 0,
      searchQuery: '',
      isLoading: false,
      lastUpdated: '로드 중...',
      bookmarks: [],
      filteredItems: []
    };
  },

  computed: {
    filteredContent() {
      if (!this.searchQuery) {
        return this.getSectionContent(this.currentSection);
      }

      const query = this.searchQuery.toLowerCase();
      const allContent = this.getAllContent();

      return allContent.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query)
      );
    }
  },

  methods: {
    async loadConstitution() {
      this.isLoading = true;
      try {
        // IPC로 헌법 파일 로드
        const constitution = await window.electronAPI.getConstitution();
        this.constitutionContent = constitution;
        this.parseConstitution();
        this.updateLastModified();
      } catch (error) {
        console.error('헌법 로드 실패:', error);
        this.constitutionContent = '헌법을 로드할 수 없습니다.';
      } finally {
        this.isLoading = false;
      }
    },

    parseConstitution() {
      // 마크다운 형식의 헌법을 파싱하여 섹션별로 분할
      const lines = this.constitutionContent.split('\n');
      const parsed = [];
      let currentItem = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 제목 감지 (### 형식)
        if (line.startsWith('### ')) {
          if (currentItem) parsed.push(currentItem);
          currentItem = {
            title: line.replace(/^### /, ''),
            text: ''
          };
        } else if (currentItem) {
          currentItem.text += line + '\n';
        }
      }

      if (currentItem) parsed.push(currentItem);
      this.filteredItems = parsed;
    },

    getSectionContent(sectionIndex) {
      // 섹션별 콘텐츠 필터링
      return this.filteredItems.slice(0, 10); // 임시: 모두 반환
    },

    getAllContent() {
      return this.filteredItems;
    },

    filterContent() {
      // 검색 필터링 (computed에서 자동 처리)
      this.$forceUpdate();
    },

    highlightSearch(text) {
      if (!this.searchQuery) return text;

      const regex = new RegExp(`(${this.searchQuery})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },

    toggleBookmark(index) {
      const idx = this.bookmarks.indexOf(index);
      if (idx > -1) {
        this.bookmarks.splice(idx, 1);
      } else {
        this.bookmarks.push(index);
      }
    },

    async refreshConstitution() {
      await this.loadConstitution();
    },

    updateLastModified() {
      const now = new Date();
      this.lastUpdated = `마지막 갱신: ${now.toLocaleString('ko-KR')}`;
    },

    // 실시간 동기화 감시
    watchForChanges() {
      if (window.electronAPI) {
        window.electronAPI.onConstitutionUpdate?.(() => {
          this.loadConstitution();
        });
      }
    }
  },

  mounted() {
    this.loadConstitution();
    this.watchForChanges();

    // 5초마다 갱신 (임시)
    setInterval(() => {
      this.loadConstitution();
    }, 5000);
  }
};
</script>

<style scoped>
.constitution-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0a0e27;
  color: #e0e6ed;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.viewer-header {
  padding: 24px;
  border-bottom: 1px solid #1a2f5f;
  background: linear-gradient(135deg, #0a0e27 0%, #0f1a38 100%);
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-section h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.last-updated {
  font-size: 12px;
  color: #7a8ba0;
}

.controls {
  display: flex;
  gap: 12px;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
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

.refresh-btn {
  padding: 10px 16px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #0d95d3;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section-nav {
  display: flex;
  overflow-x: auto;
  padding: 12px 24px;
  gap: 8px;
  border-bottom: 1px solid #1a2f5f;
  background-color: #0f1a38;
}

.nav-btn {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid #1a2f5f;
  border-radius: 4px;
  color: #7a8ba0;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.nav-btn.active {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
  color: #fff;
}

.nav-btn:hover {
  border-color: #0ea5e9;
  color: #0ea5e9;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.loading,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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

.content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-item {
  padding: 16px;
  background-color: #0f1a38;
  border: 1px solid #1a2f5f;
  border-radius: 8px;
  transition: all 0.2s;
}

.content-item:hover {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.content-item h3 {
  margin: 0 0 12px 0;
  color: #0ea5e9;
  font-size: 16px;
}

.content-text {
  color: #c4d0df;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.content-text mark {
  background-color: rgba(14, 165, 233, 0.3);
  color: inherit;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #7a8ba0;
}

.section-badge {
  background-color: #0ea5e9;
  color: #fff;
  padding: 2px 8px;
  border-radius: 3px;
}

.bookmark-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  color: #7a8ba0;
  transition: color 0.2s;
}

.bookmark-btn:hover {
  color: #fbbf24;
}

.viewer-footer {
  padding: 12px 24px;
  text-align: center;
  font-size: 12px;
  color: #7a8ba0;
  border-top: 1px solid #1a2f5f;
}

.philosophy {
  margin: 0;
  font-style: italic;
}
</style>
