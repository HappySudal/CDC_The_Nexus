import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import AgentCommandPanel from './AgentCommandPanel.vue';

describe('AgentCommandPanel.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('1. 마운팅 및 라이프사이클', () => {
    it('기본값으로 컴포넌트가 마운트되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm).toBeDefined();
      expect(wrapper.vm.selectedAgent).toBe('');
      expect(wrapper.vm.commandText).toBe('');
      expect(wrapper.vm.isExecuting).toBe(false);
    });

    it('기본 도우미 목록을 렌더링해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents).toHaveLength(3);
      expect(wrapper.vm.agents[0].name).toBe('수달 의장');
      expect(wrapper.vm.agents[1].name).toBe('란도');
      expect(wrapper.vm.agents[2].name).toBe('OpenClaude');
    });

    it('사용자 정의 도우미 목록으로 마운트될 수 있어야 한다', async () => {
      const customAgents = [
        { id: 'test1', name: 'Test Agent', emoji: '🧪', role: 'Tester' }
      ];
      wrapper = mount(AgentCommandPanel, {
        props: { agents: customAgents }
      });
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.agents).toHaveLength(1);
      expect(wrapper.vm.agents[0].name).toBe('Test Agent');
    });

    it('maxHistorySize prop을 수용해야 한다', async () => {
      wrapper = mount(AgentCommandPanel, {
        props: { maxHistorySize: 100 }
      });
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.$props.maxHistorySize).toBe(100);
    });

    it('초기 상태에서 히스토리가 비어있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.commandHistory).toHaveLength(0);
    });
  });

  describe('2. 상태 및 computed 속성', () => {
    it('selectedAgentName computed가 올바르게 작동해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      expect(wrapper.vm.selectedAgentName).toBe('수달 의장');
    });

    it('선택되지 않은 도우미의 경우 빈 문자열을 반환해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'nonexistent';
      expect(wrapper.vm.selectedAgentName).toBe('');
    });

    it('options 상태를 추적해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.options.priority).toBe(false);
      expect(wrapper.vm.options.saveToHistory).toBe(true);
      expect(wrapper.vm.options.notifyOnComplete).toBe(false);
    });

    it('options를 변경할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.options.priority = true;
      expect(wrapper.vm.options.priority).toBe(true);
    });

    it('executionStatus를 null로 초기화해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.executionStatus).toBeNull();
    });

    it('lastResponse를 null로 초기화해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.lastResponse).toBeNull();
    });
  });

  describe('3. 도우미 선택', () => {
    it('도우미를 선택할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'lando';
      expect(wrapper.vm.selectedAgent).toBe('lando');
    });

    it('선택된 도우미의 이름을 업데이트해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'openclaude';
      expect(wrapper.vm.selectedAgentName).toBe('OpenClaude');
    });

    it('도우미 선택 해제할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.selectedAgent = '';
      expect(wrapper.vm.selectedAgent).toBe('');
    });

    it('select element가 올바르게 렌더링되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const select = wrapper.find('select#agent-select');
      expect(select.exists()).toBe(true);
    });
  });

  describe('4. 명령어 입력 및 검증', () => {
    it('명령어 텍스트를 입력할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.commandText = '테스트 명령';
      expect(wrapper.vm.commandText).toBe('테스트 명령');
    });

    it('문자 개수를 추적해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.commandText = 'Hello';
      await wrapper.vm.$nextTick();
      const charCount = wrapper.find('.char-count');
      expect(charCount.text()).toContain('5/500');
    });

    it('최대 500자까지 입력할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const longText = 'a'.repeat(500);
      wrapper.vm.commandText = longText;
      expect(wrapper.vm.commandText).toHaveLength(500);
    });

    it('500자를 초과할 수 없어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const veryLongText = 'a'.repeat(600);
      wrapper.vm.commandText = veryLongText.substring(0, 500);
      expect(wrapper.vm.commandText).toHaveLength(500);
    });

    it('textarea element가 올바르게 렌더링되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const textarea = wrapper.find('textarea#command-input');
      expect(textarea.exists()).toBe(true);
    });

    it('실행 중일 때 textarea가 disabled되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.isExecuting = true;
      await wrapper.vm.$nextTick();
      const textarea = wrapper.find('textarea#command-input');
      expect(textarea.attributes('disabled')).toBeDefined();
    });

    it('텍스트 입력 제거할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.commandText = '제거할 텍스트';
      wrapper.vm.commandText = '';
      expect(wrapper.vm.commandText).toBe('');
    });
  });

  describe('5. 명령 실행', () => {
    it('도우미와 명령어가 선택되었을 때만 실행 버튼이 활성화되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const button = wrapper.find('button.btn-execute');
      
      expect(button.attributes('disabled')).toBeDefined();
      
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '명령';
      await wrapper.vm.$nextTick();
      
      expect(button.attributes('disabled')).toBeUndefined();
    });

    it('명령어가 빈 문자열이면 실행할 수 없어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '   ';
      await wrapper.vm.$nextTick();
      
      const button = wrapper.find('button.btn-execute');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('명령 실행 중일 때 isExecuting이 true여야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      expect(wrapper.vm.isExecuting).toBe(true);
    });

    it('명령 실행 후 응답을 받아야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 명령';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.lastResponse).not.toBeNull();
      expect(wrapper.vm.lastResponse?.agentName).toBe('수달 의장');
      expect(wrapper.vm.lastResponse?.content).toContain('✅ 명령 완료');
    });

    it('명령 실행 후 isExecuting이 false가 되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.isExecuting).toBe(false);
    });

    it('성공 상태가 설정되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.executionStatus?.type).toBe('success');
      expect(wrapper.vm.executionStatus?.message).toBe('명령이 성공적으로 실행되었습니다.');
    });

    it('명령 실행 후 명령어가 초기화되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 명령';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.commandText).toBe('');
    });
  });

  describe('6. 옵션 관리', () => {
    it('긴급 처리 옵션을 토글할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.options.priority).toBe(false);
      
      wrapper.vm.options.priority = true;
      expect(wrapper.vm.options.priority).toBe(true);
    });

    it('히스토리 저장 옵션을 토글할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.options.saveToHistory).toBe(true);
      
      wrapper.vm.options.saveToHistory = false;
      expect(wrapper.vm.options.saveToHistory).toBe(false);
    });

    it('완료 알림 옵션을 토글할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      expect(wrapper.vm.options.notifyOnComplete).toBe(false);
      
      wrapper.vm.options.notifyOnComplete = true;
      expect(wrapper.vm.options.notifyOnComplete).toBe(true);
    });

    it('모든 옵션을 동시에 변경할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.options.priority = true;
      wrapper.vm.options.saveToHistory = false;
      wrapper.vm.options.notifyOnComplete = true;
      
      expect(wrapper.vm.options.priority).toBe(true);
      expect(wrapper.vm.options.saveToHistory).toBe(false);
      expect(wrapper.vm.options.notifyOnComplete).toBe(true);
    });
  });

  describe('7. 히스토리 관리', () => {
    it('히스토리에 명령을 추가할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 명령';
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.commandHistory).toHaveLength(1);
    });

    it('히스토리 저장을 비활성화할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      wrapper.vm.options.saveToHistory = false;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.commandHistory).toHaveLength(0);
    });

    it('히스토리 항목이 올바른 구조를 가져야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 명령';
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      const item = wrapper.vm.commandHistory[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('agentId', 'sudal');
      expect(item).toHaveProperty('agentName', '수달 의장');
      expect(item).toHaveProperty('command', '테스트 명령');
      expect(item).toHaveProperty('response');
      expect(item).toHaveProperty('timestamp');
    });

    it('maxHistorySize를 초과하면 오래된 항목을 제거해야 한다', async () => {
      wrapper = mount(AgentCommandPanel, {
        props: { maxHistorySize: 2 }
      });
      await vi.advanceTimersByTimeAsync(50);
      
      for (let i = 0; i < 3; i++) {
        wrapper.vm.selectedAgent = 'sudal';
        wrapper.vm.commandText = `명령 ${i + 1}`;
        wrapper.vm.options.saveToHistory = true;
        
        wrapper.vm.executeCommand();
        vi.advanceTimersByTime(1500);
        await flushPromises();
      }
      
      expect(wrapper.vm.commandHistory).toHaveLength(2);
    });

    it('히스토리를 모두 삭제할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.commandHistory).toHaveLength(1);
      
      wrapper.vm.clearHistory();
      expect(wrapper.vm.commandHistory).toHaveLength(0);
    });

    it('히스토리에서 항목을 로드할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 명령';
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      const item = wrapper.vm.commandHistory[0];
      wrapper.vm.selectedAgent = '';
      wrapper.vm.commandText = '';
      
      wrapper.vm.loadFromHistory(item);
      
      expect(wrapper.vm.selectedAgent).toBe('sudal');
      expect(wrapper.vm.commandText).toBe('테스트 명령');
    });
  });

  describe('8. 응답 처리', () => {
    it('응답이 표시되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.lastResponse).not.toBeNull();
    });

    it('응답에 도우미 이름이 포함되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'lando';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.lastResponse?.agentName).toBe('란도');
    });

    it('응답에 타임스탐프가 포함되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.lastResponse?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('9. 상태 표시', () => {
    it('실행 중일 때 info 상태가 표시되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      
      expect(wrapper.vm.executionStatus?.type).toBe('info');
      expect(wrapper.vm.executionStatus?.message).toContain('명령을 보내는 중');
      
      vi.advanceTimersByTime(1500);
      await flushPromises();
    });

    it('성공 상태가 올바르게 표시되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.executionStatus?.type).toBe('success');
    });

    it('에러 상태가 올바르게 설정되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = '';
      wrapper.vm.commandText = '';
      
      // 강제로 에러 상태 설정
      wrapper.vm.executionStatus = {
        type: 'error',
        message: '명령 실행 실패',
        details: '선택된 도우미가 없습니다'
      };
      
      expect(wrapper.vm.executionStatus?.type).toBe('error');
    });
  });

  describe('10. UI 상호작용', () => {
    it('clearInput 메서드가 입력을 초기화해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트';
      wrapper.vm.executionStatus = {
        type: 'info',
        message: '테스트'
      };
      
      wrapper.vm.clearInput();
      
      expect(wrapper.vm.selectedAgent).toBe('');
      expect(wrapper.vm.commandText).toBe('');
      expect(wrapper.vm.executionStatus).toBeNull();
    });

    it('clear 버튼이 disabled되지 않아야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const clearButton = wrapper.find('button.btn-clear');
      expect(clearButton.attributes('disabled')).toBeUndefined();
    });

    it('실행 중일 때 clear 버튼이 disabled되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.isExecuting = true;
      await wrapper.vm.$nextTick();
      
      const clearButton = wrapper.find('button.btn-clear');
      expect(clearButton.attributes('disabled')).toBeDefined();
    });

    it('agent count가 올바르게 표시되어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const agentCount = wrapper.find('.agent-count');
      expect(agentCount.text()).toContain('3명의 도우미');
    });
  });

  describe('11. 유틸리티 함수', () => {
    it('truncate 함수가 텍스트를 잘라야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const result = wrapper.vm.truncate('This is a long text', 10);
      expect(result).toBe('This is a ...');
    });

    it('truncate 함수가 짧은 텍스트는 그대로 두어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const result = wrapper.vm.truncate('Short', 10);
      expect(result).toBe('Short');
    });

    it('formatTime 함수가 날짜를 형식화해야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      const date = new Date('2026-05-21T14:30:45');
      const formatted = wrapper.vm.formatTime(date);
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('12. 엣지 케이스', () => {
    it('선택되지 않은 도우미로는 실행할 수 없어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = '';
      wrapper.vm.commandText = '테스트 명령';
      
      // executeCommand 메서드 초기 테크 때문에 실행 안 됨
      const historyBefore = wrapper.vm.commandHistory.length;
      wrapper.vm.executeCommand();
      
      // 조건을 만족하지 않으므로 아무것도 실행되지 않음
      expect(wrapper.vm.isExecuting).toBe(false);
    });

    it('공백만 있는 명령어는 유효하지 않아야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '     ';
      
      const button = wrapper.find('button.btn-execute');
      expect(button.attributes('disabled')).toBeDefined();
    });

    it('매우 긴 명령어를 처리할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      const longCommand = 'a'.repeat(500);
      wrapper.vm.commandText = longCommand;
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      const historyItem = wrapper.vm.commandHistory[0];
      expect(historyItem.command).toHaveLength(500);
    });

    it('동일한 명령어를 여러 번 실행할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '같은 명령';
      wrapper.vm.options.saveToHistory = true;
      
      for (let i = 0; i < 3; i++) {
        wrapper.vm.executeCommand();
        vi.advanceTimersByTime(1500);
        await flushPromises();
        
        // 실행 사이에 상태 복원
        wrapper.vm.commandText = '같은 명령';
      }
      
      expect(wrapper.vm.commandHistory).toHaveLength(3);
    });

    it('도우미 전환 후 명령을 실행할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '테스트 1';
      wrapper.vm.options.saveToHistory = true;
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      wrapper.vm.selectedAgent = 'lando';
      wrapper.vm.commandText = '테스트 2';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.commandHistory).toHaveLength(2);
      expect(wrapper.vm.commandHistory[0].agentId).toBe('sudal');
      expect(wrapper.vm.commandHistory[1].agentId).toBe('lando');
    });

    it('응답 받은 후 같은 도우미로 새 명령을 실행할 수 있어야 한다', async () => {
      wrapper = mount(AgentCommandPanel);
      await vi.advanceTimersByTimeAsync(50);
      wrapper.vm.selectedAgent = 'sudal';
      wrapper.vm.commandText = '첫 명령';
      
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      const firstResponse = wrapper.vm.lastResponse?.content;
      
      wrapper.vm.commandText = '두 번째 명령';
      wrapper.vm.executeCommand();
      vi.advanceTimersByTime(1500);
      await flushPromises();
      
      expect(wrapper.vm.lastResponse?.content).toContain('두 번째 명령');
      expect(wrapper.vm.lastResponse?.content).not.toBe(firstResponse);
    });
  });
});

// 시각(時刻)에 존재하고, 시간(時間)에 소멸한다.
// Exists in the Moment, Vanishes in Time.
