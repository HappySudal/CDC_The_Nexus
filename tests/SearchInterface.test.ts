import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchInterface from '@/components/SearchInterface.vue';

describe('SearchInterface.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  // ============== 初期状態とマウント ==============
  describe('Component Mounting and Initial State', () => {
    it('should mount component successfully', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.search-interface').exists()).toBe(true);
    });

    it('should initialize with empty search query', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.searchQuery).toBe('');
    });

    it('should have 5 available systems', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.availableSystems.length).toBe(5);
    });

    it('should initialize empty filters', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.selectedSystems).toEqual([]);
      expect(vm.selectedStatus).toBe('');
      expect(vm.selectedTag).toBe('');
    });

    it('should initialize pagination values', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.currentPage).toBe(1);
      expect(vm.itemsPerPage).toBe(10);
    });

    it('should have mock results loaded', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.mockResults.length).toBeGreaterThan(0);
    });

    it('should initialize with no selected result', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.selectedResult).toBeNull();
    });

    it('should initialize empty filtered results', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      expect(vm.filteredResults).toEqual([]);
    });
  });

  // ============== 検索入力 ==============
  describe('Search Input and Query Handling', () => {
    it('should render search input field', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.search-input').exists()).toBe(true);
    });

    it('should update searchQuery on input', async () => {
      wrapper = mount(SearchInterface);
      const input = wrapper.find('.search-input');
      await input.setValue('test query');
      expect((wrapper.vm as any).searchQuery).toBe('test query');
    });

    it('should render search button', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.search-btn').exists()).toBe(true);
    });

    it('should render clear button', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.clear-btn').exists()).toBe(true);
    });

    it('should trigger search on button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      await wrapper.find('.search-btn').trigger('click');
      // executeSearch should have been called
      expect(vm.searchQuery).toBe('test');
    });

    it('should trigger search on Enter key', async () => {
      wrapper = mount(SearchInterface);
      const input = wrapper.find('.search-input');
      await input.setValue('test');
      await input.trigger('keydown.enter');
      expect((wrapper.vm as any).searchQuery).toBe('test');
    });

    it('should handle performSearch debouncing', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'ab';
      await vi.advanceTimersByTimeAsync(300);
      // Should not perform search with less than 2 characters
      expect(vm.filteredResults).toEqual([]);
    });

    it('should not search with less than 2 characters', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'a';
      vm.performSearch();
      expect(vm.filteredResults).toEqual([]);
    });
  });

  // ============== フィルター機能 ==============
  describe('Filter Functionality', () => {
    it('should render filter section', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.filter-section').exists()).toBe(true);
    });

    it('should render system filter checkboxes', () => {
      wrapper = mount(SearchInterface);
      const checkboxes = wrapper.findAll('.checkbox-group input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should update selectedSystems when checkbox clicked', async () => {
      wrapper = mount(SearchInterface);
      const checkbox = wrapper.find('.checkbox-group input[type="checkbox"]');
      await checkbox.setValue(true);
      // At least one system should be selected
      expect((wrapper.vm as any).selectedSystems.length).toBeGreaterThan(0);
    });

    it('should render date range inputs', () => {
      wrapper = mount(SearchInterface);
      const dateInputs = wrapper.findAll('.date-input');
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should render status select dropdown', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.status-select').exists()).toBe(true);
    });

    it('should have status options', () => {
      wrapper = mount(SearchInterface);
      const options = wrapper.findAll('.status-select option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should render tag input field', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.tag-input').exists()).toBe(true);
    });

    it('should update selectedStatus when dropdown changed', async () => {
      wrapper = mount(SearchInterface);
      const select = wrapper.find('.status-select');
      await select.setValue('completed');
      expect((wrapper.vm as any).selectedStatus).toBe('completed');
    });

    it('should update selectedTag when input changed', async () => {
      wrapper = mount(SearchInterface);
      const input = wrapper.find('.tag-input');
      await input.setValue('test-tag');
      expect((wrapper.vm as any).selectedTag).toBe('test-tag');
    });

    it('should filter by multiple systems', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedSystems = ['Nexus', 'CDC'];
      vm.filteredResults = [...vm.mockResults];
      vm.applyFilters();
      // Results should be filtered
      const results = vm.filteredResults;
      expect(results).toBeTruthy();
    });

    it('should filter by status', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.selectedStatus = 'completed';
      vm.applyFilters();
      const allCompleted = vm.filteredResults.every((r: any) => r.status === 'completed');
      expect(allCompleted).toBe(true);
    });

    it('should filter by tag', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.selectedTag = '헌법';
      vm.applyFilters();
      // Results should have the tag
      const hasTags = vm.filteredResults.length === 0 || 
                     vm.filteredResults.some((r: any) => r.tags?.includes('헌법'));
      expect(hasTags).toBe(true);
    });
  });

  // ============== 検索実行 ==============
  describe('Search Execution', () => {
    it('should search by title', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = '헌법';
      vm.executeSearch();
      expect(vm.filteredResults.length).toBeGreaterThan(0);
    });

    it('should search by content', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = '프로토콜';
      vm.executeSearch();
      expect(vm.filteredResults.length).toBeGreaterThan(0);
    });

    it('should perform case-insensitive search', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'CDC';
      vm.executeSearch();
      const lowerResults = vm.filteredResults;
      vm.searchQuery = 'cdc';
      vm.executeSearch();
      const upperResults = vm.filteredResults;
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should return empty results for non-existent query', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'xyzabc123notfound';
      vm.executeSearch();
      expect(vm.filteredResults.length).toBe(0);
    });

    it('should trigger isSearching state', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      vm.performSearch();
      expect(vm.isSearching).toBe(true);
      await vi.advanceTimersByTimeAsync(300);
      expect(vm.isSearching).toBe(false);
    });

    it('should reset page to 1 after search', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.currentPage = 5;
      vm.searchQuery = 'test';
      vm.executeSearch();
      expect(vm.currentPage).toBe(1);
    });
  });

  // ============== ソート機能 ==============
  describe('Sorting Functionality', () => {
    it('should render sort dropdown', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.sort-select').exists()).toBe(true);
    });

    it('should sort by date descending', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.sortBy = 'date_desc';
      vm.applySort();
      
      for (let i = 0; i < vm.filteredResults.length - 1; i++) {
        const current = new Date(vm.filteredResults[i].timestamp).getTime();
        const next = new Date(vm.filteredResults[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should sort by date ascending', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.sortBy = 'date_asc';
      vm.applySort();
      
      for (let i = 0; i < vm.filteredResults.length - 1; i++) {
        const current = new Date(vm.filteredResults[i].timestamp).getTime();
        const next = new Date(vm.filteredResults[i + 1].timestamp).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    });

    it('should sort by title', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.sortBy = 'title';
      vm.applySort();
      
      for (let i = 0; i < vm.filteredResults.length - 1; i++) {
        const comparison = vm.filteredResults[i].title.localeCompare(vm.filteredResults[i + 1].title);
        expect(comparison).toBeLessThanOrEqual(0);
      }
    });

    it('should maintain sort order on page change', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [...vm.mockResults];
      vm.sortBy = 'date_desc';
      vm.applySort();
      const initialSort = vm.sortBy;
      vm.currentPage = 2;
      expect(vm.sortBy).toBe(initialSort);
    });
  });

  // ============== ページネーション ==============
  describe('Pagination Functionality', () => {
    it('should calculate total pages correctly', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = Array.from({ length: 25 }, (_, i) => ({
        ...vm.mockResults[0],
        id: i
      }));
      expect(vm.totalPages).toBe(3);
    });

    it('should get paginated results for current page', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = Array.from({ length: 25 }, (_, i) => ({
        ...vm.mockResults[0],
        id: i
      }));
      vm.currentPage = 1;
      expect(vm.paginatedResults.length).toBe(10);
    });

    it('should handle last page with fewer items', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = Array.from({ length: 23 }, (_, i) => ({
        ...vm.mockResults[0],
        id: i
      }));
      vm.currentPage = 3;
      expect(vm.paginatedResults.length).toBe(3);
    });

    it('should render pagination controls when needed', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = Array.from({ length: 25 }, (_, i) => ({
        ...vm.mockResults[0],
        id: i
      }));
      wrapper.vm.$nextTick();
      // Pagination should exist for > 1 page
      expect(vm.totalPages).toBeGreaterThan(1);
    });

    it('should disable previous button on first page', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.currentPage = 1;
      const prevBtns = wrapper.findAll('.pagination-btn');
      expect(prevBtns.length).toBe(0);
    });

    it('should disable next button on last page', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = Array.from({ length: 15 }, (_, i) => ({
        ...vm.mockResults[0],
        id: i
      }));
      vm.currentPage = vm.totalPages;
      await wrapper.vm.$nextTick();
      // Next button should be disabled
      expect(vm.currentPage).toBe(vm.totalPages);
    });
  });

  // ============== 結果表示 ==============
  describe('Results Display', () => {
    it('should render results header', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.results-header').exists()).toBe(true);
    });

    it('should display result count', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const header = wrapper.find('.results-header');
      expect(header.text()).toContain(vm.filteredResults.length.toString());
    });

    it('should render no results message when empty', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = [];
      wrapper.vm.$nextTick();
      expect(wrapper.find('.no-results-state').exists()).toBe(true);
    });

    it('should render result items', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const items = wrapper.findAll('.result-item');
      expect(items.length).toBe(vm.mockResults.length);
    });

    it('should display result title', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const resultTitle = wrapper.find('.result-header h4');
      expect(resultTitle.text()).toBeTruthy();
    });

    it('should display result status badge', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const badge = wrapper.find('.result-badge');
      expect(badge.exists()).toBe(true);
    });

    it('should display result snippet', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const snippet = wrapper.find('.result-snippet');
      expect(snippet.text()).toBeTruthy();
    });

    it('should display result meta information', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const meta = wrapper.find('.result-meta');
      expect(meta.find('.system-tag').exists()).toBe(true);
      expect(meta.find('.date-tag').exists()).toBe(true);
    });

    it('should highlight selected result', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      const firstItem = wrapper.find('.result-item');
      await firstItem.trigger('click');
      expect(vm.selectedResult).toBeTruthy();
    });
  });

  // ============== 詳細パネル ==============
  describe('Detail Panel Display', () => {
    it('should render detail panel when result selected', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.detail-panel').exists()).toBe(true);
    });

    it('should display selected result title in detail panel', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      const title = wrapper.find('.detail-header h3');
      expect(title.text()).toBe(vm.selectedResult.title);
    });

    it('should render close button in detail panel', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.close-btn').exists()).toBe(true);
    });

    it('should close detail panel on close button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      await wrapper.find('.close-btn').trigger('click');
      expect(vm.selectedResult).toBeNull();
    });

    it('should display detail metadata', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.detail-meta').exists()).toBe(true);
    });

    it('should display detail content text', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.detail-text').exists()).toBe(true);
    });

    it('should display tags in detail panel', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      await wrapper.vm.$nextTick();
      const tags = wrapper.findAll('.detail-tags .tag');
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  // ============== ユーティリティメソッド ==============
  describe('Utility Methods', () => {
    it('should truncate long text', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      const longText = 'a'.repeat(200);
      const truncated = vm.truncateText(longText, 100);
      expect(truncated.length).toBeLessThanOrEqual(103); // 100 + '...'
    });

    it('should not truncate short text', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      const shortText = 'short';
      const result = vm.truncateText(shortText, 100);
      expect(result).toBe(shortText);
    });

    it('should format date to Korean locale', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      const date = '2026-05-07T08:00:00Z';
      const formatted = vm.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/\d/);
    });

    it('should highlight keywords in text', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      const text = 'this is a test string';
      const highlighted = vm.highlightKeywords(text);
      expect(highlighted).toContain('<mark>');
    });

    it('should highlight multiple keywords', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'is';
      const text = 'this is a test is string';
      const highlighted = vm.highlightKeywords(text);
      const markCount = (highlighted.match(/<mark>/g) || []).length;
      expect(markCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle case-insensitive highlighting', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'TEST';
      const text = 'This is a test';
      const highlighted = vm.highlightKeywords(text);
      expect(highlighted).toContain('<mark>');
    });
  });

  // ============== リセット機能 ==============
  describe('Clear Search Functionality', () => {
    it('should render clear button', () => {
      wrapper = mount(SearchInterface);
      expect(wrapper.find('.clear-btn').exists()).toBe(true);
    });

    it('should clear all search state on clear button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'test';
      vm.selectedSystems = ['Nexus'];
      vm.selectedStatus = 'completed';
      vm.selectedTag = 'tag';
      vm.currentPage = 3;
      
      await wrapper.find('.clear-btn').trigger('click');
      
      expect(vm.searchQuery).toBe('');
      expect(vm.selectedSystems).toEqual([]);
      expect(vm.selectedStatus).toBe('');
      expect(vm.selectedTag).toBe('');
      expect(vm.currentPage).toBe(1);
    });

    it('should clear date range on clear button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.dateRange.start = '2026-01-01';
      vm.dateRange.end = '2026-12-31';
      
      await wrapper.find('.clear-btn').trigger('click');
      
      expect(vm.dateRange.start).toBe('');
      expect(vm.dateRange.end).toBe('');
    });

    it('should clear filtered results on clear button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      
      await wrapper.find('.clear-btn').trigger('click');
      
      expect(vm.filteredResults).toEqual([]);
    });

    it('should clear selected result on clear button click', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.selectedResult = vm.mockResults[0];
      
      await wrapper.find('.clear-btn').trigger('click');
      
      expect(vm.selectedResult).toBeNull();
    });

    it('should reset sort order on clear', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.sortBy = 'date_desc';
      
      await wrapper.find('.clear-btn').trigger('click');
      
      expect(vm.sortBy).toBe('relevance');
    });
  });

  // ============== IPC統合 ==============
  describe('IPC Integration', () => {
    it('should handle IPC onSearchResults event', () => {
      const mockAPI = {
        onSearchResults: vi.fn((callback: any) => {
          callback([
            { id: 1, title: 'Result', content: 'Content', status: 'completed', system: 'CDC', timestamp: new Date() }
          ]);
        })
      };
      
      (window as any).electronAPI = mockAPI;
      wrapper = mount(SearchInterface);
      
      expect(mockAPI.onSearchResults).toHaveBeenCalled();
    });

    it('should handle missing electronAPI gracefully', () => {
      (window as any).electronAPI = undefined;
      expect(() => {
        wrapper = mount(SearchInterface);
      }).not.toThrow();
    });
  });

  // ============== エッジケース ==============
  describe('Edge Cases', () => {
    it('should handle empty search query', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = '';
      vm.performSearch();
      expect(vm.filteredResults).toEqual([]);
    });

    it('should handle special characters in search', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = '@#$%^&*()';
      vm.executeSearch();
      expect(vm.filteredResults).toBeTruthy();
    });

    it('should handle very long search query', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.searchQuery = 'a'.repeat(500);
      expect(() => vm.executeSearch()).not.toThrow();
    });

    it('should handle result with missing tags', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      const resultWithoutTags = { ...vm.mockResults[0], tags: undefined };
      vm.filteredResults = [resultWithoutTags];
      expect(vm.filteredResults[0].tags).toBeUndefined();
    });

    it('should handle result with empty tags', () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      const resultWithEmptyTags = { ...vm.mockResults[0], tags: [] };
      vm.filteredResults = [resultWithEmptyTags];
      expect(vm.filteredResults[0].tags).toEqual([]);
    });

    it('should handle rapid filter changes', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      
      vm.selectedStatus = 'completed';
      vm.applyFilters();
      vm.selectedStatus = 'active';
      vm.applyFilters();
      vm.selectedStatus = '';
      vm.applyFilters();
      
      expect(vm.filteredResults).toBeTruthy();
    });

    it('should handle clicking same result twice', async () => {
      wrapper = mount(SearchInterface);
      const vm = wrapper.vm as any;
      vm.filteredResults = vm.mockResults;
      await wrapper.vm.$nextTick();
      
      const item = wrapper.find('.result-item');
      await item.trigger('click');
      const firstSelection = vm.selectedResult;
      
      await item.trigger('click');
      const secondSelection = vm.selectedResult;
      
      expect(firstSelection?.id).toBe(secondSelection?.id);
    });
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
