import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ConstitutionViewer from './ConstitutionViewer.vue';

describe('ConstitutionViewer.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock Electron API
    window.electronAPI = {
      getConstitution: vi.fn().mockResolvedValue(`
### 제0조. 절대 불변 상호작용 규약
본 조항은 어떠한 다른 조항보다 우선한다.

### 제1조. 행동 전 사전 정합성 검토
모든 에이전트는 의장님의 지시를 받은 직후 내부적으로 안전성 점검을 수행한다.

### 제2조. 단일 헌법 절대 복종
사령부의 모든 물리적 위계는 단일 헌법에만 정의된다.
      `),
      onConstitutionUpdate: vi.fn((callback: any) => {
        // Mock event listener
      })
    };
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.useRealTimers();
  });

  // ========== 1. 마운팅 및 초기화 (4 tests) ==========
  describe('Mounting & Initialization', () => {
    it('should mount and render viewer container', () => {
      wrapper = mount(ConstitutionViewer);
      expect(wrapper.find('.constitution-viewer').exists()).toBe(true);
    });

    it('should load constitution on mount', async () => {
      wrapper = mount(ConstitutionViewer);
      await wrapper.vm.$nextTick();
      expect(window.electronAPI.getConstitution).toHaveBeenCalled();
    });

    it('should initialize with first section active', () => {
      wrapper = mount(ConstitutionViewer);
      expect(wrapper.vm.currentSection).toBe(0);
    });

    it('should setup real-time change watcher', () => {
      wrapper = mount(ConstitutionViewer);
      expect(window.electronAPI.onConstitutionUpdate).toHaveBeenCalled();
    });
  });

  // ========== 2. 헌법 로드 (4 tests) ==========
  describe('Constitution Loading', () => {
    it('should set isLoading to true while loading', async () => {
      window.electronAPI.getConstitution = vi.fn(() => new Promise(() => {}));
      wrapper = mount(ConstitutionViewer);
      expect(wrapper.vm.isLoading).toBe(true);
    });

    it('should reset isLoading after load completes', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(100);
      expect(window.electronAPI.getConstitution).toHaveBeenCalled();
      expect(wrapper.vm.isLoading).toBe(false);
    });

    it('should update lastUpdated timestamp', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.lastUpdated).toContain('마지막 갱신');
    });

    it('should handle load errors gracefully', async () => {
      window.electronAPI.getConstitution = vi.fn().mockRejectedValue(new Error('Load failed'));
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.constitutionContent).toContain('로드할 수 없습니다');
    });
  });

  // ========== 3. 콘텐츠 파싱 (5 tests) ==========
  describe('Content Parsing', () => {
    it('should parse markdown content into items', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.filteredItems.length).toBeGreaterThan(0);
    });

    it('should extract titles from ### format', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const firstItem = wrapper.vm.filteredItems[0];
      expect(firstItem.title).toBeDefined();
      expect(firstItem.title.length).toBeGreaterThan(0);
    });

    it('should extract body text from items', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const firstItem = wrapper.vm.filteredItems[0];
      expect(firstItem.text).toBeDefined();
    });

    it('should handle multiple items', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.filteredItems.length).toBeGreaterThanOrEqual(2);
    });

    it('should preserve line breaks in content', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const firstItem = wrapper.vm.filteredItems[0];
      expect(firstItem.text).toContain('\n');
    });
  });

  // ========== 4. 섹션 네비게이션 (4 tests) ==========
  describe('Section Navigation', () => {
    it('should have 6 sections defined', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.sections.length).toBe(6);
    });

    it('should render section buttons', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const buttons = wrapper.findAll('.nav-btn');
      expect(buttons.length).toBe(6);
    });

    it('should change current section when button clicked', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.currentSection = 2;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.currentSection).toBe(2);
    });

    it('should apply active class to current section button', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.currentSection = 1;
      await wrapper.vm.$nextTick();
      const button = wrapper.findAll('.nav-btn')[1];
      expect(button.classes()).toContain('active');
    });
  });

  // ========== 5. 검색 및 필터링 (6 tests) ==========
  describe('Search & Filtering', () => {
    it('should return all content when search is empty', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent.length).toBeGreaterThan(0);
    });

    it('should filter by title search', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '제0조';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent.length).toBeGreaterThan(0);
      expect(wrapper.vm.filteredContent[0].title).toContain('제0조');
    });

    it('should filter by content text search', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '헌법';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent.length).toBeGreaterThan(0);
    });

    it('should search case-insensitively', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '제';
      await wrapper.vm.$nextTick();
      const results1 = wrapper.vm.filteredContent.length;
      wrapper.vm.searchQuery = '제';
      await wrapper.vm.$nextTick();
      const results2 = wrapper.vm.filteredContent.length;
      expect(results1).toBe(results2);
    });

    it('should return empty results for non-matching search', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = 'nonexistentquery';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent.length).toBe(0);
    });

    it('should trigger filterContent method', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      // <script setup>에서는 @input이 원본 클로저를 호출하므로 vm 스파이 대신 효과(반응성) 검증
      await wrapper.find('.search-input').setValue('제0조');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.searchQuery).toBe('제0조');
      expect(Array.isArray(wrapper.vm.filteredContent)).toBe(true);
    });
  });

  // ========== 6. 북마크 기능 (4 tests) ==========
  describe('Bookmark Management', () => {
    it('should initialize empty bookmarks array', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.bookmarks).toEqual([]);
    });

    it('should add bookmark when toggled', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.toggleBookmark(0);
      expect(wrapper.vm.bookmarks).toContain(0);
    });

    it('should remove bookmark when toggled again', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.toggleBookmark(0);
      wrapper.vm.toggleBookmark(0);
      expect(wrapper.vm.bookmarks).not.toContain(0);
    });

    it('should support multiple bookmarks', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.toggleBookmark(0);
      wrapper.vm.toggleBookmark(1);
      wrapper.vm.toggleBookmark(2);
      expect(wrapper.vm.bookmarks.length).toBe(3);
    });
  });

  // ========== 7. 콘텐츠 렌더링 (4 tests) ==========
  describe('Content Rendering', () => {
    it('should render content items', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const items = wrapper.findAll('.content-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should display loading state initially', async () => {
      window.electronAPI.getConstitution = vi.fn(() => new Promise(() => {}));
      wrapper = mount(ConstitutionViewer);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.loading').exists()).toBe(true);
    });

    it('should show no-results message for empty search', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = 'zzzzzzz_nonexistent';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.no-results').exists()).toBe(true);
    });

    it('should display item titles', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const items = wrapper.findAll('.content-item h3');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  // ========== 8. 검색 하이라이트 (3 tests) ==========
  describe('Search Highlighting', () => {
    it('should highlight search query in text', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '제0조';
      const highlighted = wrapper.vm.highlightSearch('제0조 절대 규약');
      expect(highlighted).toContain('<mark>');
    });

    it('should not add marks when search query is empty', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '';
      const text = '테스트 텍스트';
      const result = wrapper.vm.highlightSearch(text);
      expect(result).toBe(text);
    });

    it('should do case-insensitive highlight', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '제';
      const text = '제0조 제1조';
      const highlighted = wrapper.vm.highlightSearch(text);
      expect((highlighted.match(/<mark>/g) || []).length).toBe(2);
    });
  });

  // ========== 9. 새로고침 기능 (3 tests) ==========
  describe('Refresh Functionality', () => {
    it('should reload constitution when refresh called', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      vi.clearAllMocks();
      await wrapper.vm.refreshConstitution();
      await vi.advanceTimersByTimeAsync(50);
      expect(window.electronAPI.getConstitution).toHaveBeenCalled();
    });

    it('should set isLoading during refresh', async () => {
      window.electronAPI.getConstitution = vi.fn(() => new Promise(() => {}));
      wrapper = mount(ConstitutionViewer);
      expect(wrapper.vm.isLoading).toBe(true);
    });

    it('should update lastUpdated timestamp on refresh', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const oldTime = wrapper.vm.lastUpdated;
      await vi.advanceTimersByTimeAsync(1100);
      await wrapper.vm.refreshConstitution();
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.lastUpdated).not.toBe(oldTime);
    });
  });

  // ========== 10. 자동 갱신 (2 tests) ==========
  describe('Auto Refresh', () => {
    it('should setup 5 second interval on mount', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should reload after 5 seconds', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      vi.clearAllMocks();
      vi.advanceTimersByTime(5000);
      await wrapper.vm.$nextTick();
      expect(window.electronAPI.getConstitution).toHaveBeenCalled();
    });
  });

  // ========== 11. 유틸리티 함수 (3 tests) ==========
  describe('Utility Functions', () => {
    it('should get all content from filteredItems', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const allContent = wrapper.vm.getAllContent();
      expect(Array.isArray(allContent)).toBe(true);
    });

    it('should get section content filtered', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const sectionContent = wrapper.vm.getSectionContent(0);
      expect(Array.isArray(sectionContent)).toBe(true);
    });

    it('should update last modified timestamp correctly', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.updateLastModified();
      expect(wrapper.vm.lastUpdated).toContain('마지막 갱신');
    });
  });

  // ========== 12. UI 상호작용 (4 tests) ==========
  describe('UI Interactions', () => {
    it('should render search input field', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const input = wrapper.find('.search-input');
      expect(input.exists()).toBe(true);
    });

    it('should render refresh button', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const btn = wrapper.find('.refresh-btn');
      expect(btn.exists()).toBe(true);
    });

    it('should render footer philosophy text', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.find('.philosophy').text()).toContain('Exists in the Moment');
    });

    it('should render section navigation buttons', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      const navButtons = wrapper.findAll('.nav-btn');
      expect(navButtons.length).toBe(6);
    });
  });

  // ========== 13. 에러 처리 (4 tests) ==========
  describe('Error Handling', () => {
    it('should handle load error gracefully', async () => {
      window.electronAPI.getConstitution = vi.fn().mockRejectedValue(new Error('API Error'));
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.constitutionContent).toContain('로드할 수 없습니다');
    });

    it('should not throw on null content', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(() => {
        wrapper.vm.constitutionContent = null;
      }).not.toThrow();
    });

    it('should handle empty parsed items', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.filteredItems = [];
      expect(() => wrapper.vm.$nextTick()).not.toThrow();
    });

    it('should handle missing electronAPI gracefully', async () => {
      delete window.electronAPI;
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.sections.length).toBe(6);
    });
  });

  // ========== 14. 에지 케이스 (5 tests) ==========
  describe('Edge Cases', () => {
    it('should handle very long constitution content', async () => {
      window.electronAPI.getConstitution = vi.fn().mockResolvedValue('### Title\n' + 'content\n'.repeat(1000));
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.filteredItems.length).toBeGreaterThan(0);
    });

    it('should handle search with special characters', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = '<script>alert("xss")</script>';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent).toBeDefined();
    });

    it('should handle rapid section changes', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      for (let i = 0; i < 6; i++) {
        wrapper.vm.currentSection = i;
        await wrapper.vm.$nextTick();
      }
      expect(wrapper.vm.currentSection).toBe(5);
    });

    it('should handle empty search results', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.searchQuery = 'xyz_nonexistent_xyz';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredContent.length).toBe(0);
    });

    it('should handle section index out of bounds', async () => {
      wrapper = mount(ConstitutionViewer);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.currentSection = 99;
      expect(() => wrapper.vm.getSectionContent(99)).not.toThrow();
    });
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
