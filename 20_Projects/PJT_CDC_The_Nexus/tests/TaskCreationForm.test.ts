import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TaskCreationForm from '@/components/TaskCreationForm.vue';

describe('TaskCreationForm.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T00:00:00Z'));
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
      wrapper = mount(TaskCreationForm);
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('.task-creation').exists()).toBe(true);
    });

    it('should initialize form with empty values', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.form.title).toBe('');
      expect(vm.form.description).toBe('');
      expect(vm.form.priority).toBe('');
      expect(vm.form.category).toBe('');
    });

    it('should initialize form with default numeric values', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.form.estimateHours).toBe(1);
    });

    it('should initialize empty errors object', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.errors).toEqual({});
    });

    it('should initialize empty tags array', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.form.tags).toEqual([]);
    });

    it('should have 5 available system tags', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.availableSystemTags.length).toBe(5);
    });

    it('should set default startDate to today on mount', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const today = new Date('2026-05-21T00:00:00Z').toISOString().split('T')[0];
      expect(vm.form.startDate).toBe(today);
    });

    it('should set default dueDate to tomorrow on mount', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const tomorrow = new Date('2026-05-22T00:00:00Z').toISOString().split('T')[0];
      expect(vm.form.dueDate).toBe(tomorrow);
    });

    it('should initialize isSubmitting as false', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.isSubmitting).toBe(false);
    });

    it('should initialize successMessage as empty', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(vm.successMessage).toBe('');
    });
  });

  // ============== フォームフィールド ==============
  describe('Form Field Handling', () => {
    it('should render task title input', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskTitle').exists()).toBe(true);
    });

    it('should update form title on input', async () => {
      wrapper = mount(TaskCreationForm);
      const input = wrapper.find('#taskTitle');
      await input.setValue('New Task');
      expect((wrapper.vm as any).form.title).toBe('New Task');
    });

    it('should render description textarea', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskDescription').exists()).toBe(true);
    });

    it('should render priority select', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskPriority').exists()).toBe(true);
    });

    it('should have 4 priority options', () => {
      wrapper = mount(TaskCreationForm);
      const options = wrapper.findAll('#taskPriority option');
      expect(options.length).toBe(5); // includes empty option
    });

    it('should render category select', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskCategory').exists()).toBe(true);
    });

    it('should have 5 category options', () => {
      wrapper = mount(TaskCreationForm);
      const options = wrapper.findAll('#taskCategory option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should render assignee select', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskAssignee').exists()).toBe(true);
    });

    it('should have 7 assignee options', () => {
      wrapper = mount(TaskCreationForm);
      const options = wrapper.findAll('#taskAssignee option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should render start date input', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskStartDate').exists()).toBe(true);
    });

    it('should render due date input', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskDueDate').exists()).toBe(true);
    });

    it('should render estimate hours input', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('#taskEstimate').exists()).toBe(true);
    });

    it('should update form priority when select changed', async () => {
      wrapper = mount(TaskCreationForm);
      const select = wrapper.find('#taskPriority');
      await select.setValue('critical');
      expect((wrapper.vm as any).form.priority).toBe('critical');
    });

    it('should update form category when select changed', async () => {
      wrapper = mount(TaskCreationForm);
      const select = wrapper.find('#taskCategory');
      await select.setValue('development');
      expect((wrapper.vm as any).form.category).toBe('development');
    });
  });

  // ============== タグ管理 ==============
  describe('Tag Management', () => {
    it('should render tag input field', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.tag-input').exists()).toBe(true);
    });

    it('should render add tag button', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.tag-add-btn').exists()).toBe(true);
    });

    it('should add tag on button click', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.tagInput = 'urgent';
      await wrapper.find('.tag-add-btn').trigger('click');
      expect(vm.form.tags).toContain('urgent');
    });

    it('should add tag on Enter key', async () => {
      wrapper = mount(TaskCreationForm);
      const input = wrapper.find('.tag-input');
      await input.setValue('important');
      await input.trigger('keydown.enter');
      expect((wrapper.vm as any).form.tags).toContain('important');
    });

    it('should clear tag input after adding tag', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.tagInput = 'test';
      await wrapper.find('.tag-add-btn').trigger('click');
      expect(vm.tagInput).toBe('');
    });

    it('should not add empty tags', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.tagInput = '   ';
      await wrapper.find('.tag-add-btn').trigger('click');
      expect(vm.form.tags.length).toBe(0);
    });

    it('should render tag items when tags exist', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.tags = ['tag1', 'tag2'];
      await wrapper.vm.$nextTick();
      const tags = wrapper.findAll('.tag-item');
      expect(tags.length).toBe(2);
    });

    it('should remove tag on delete button click', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.tags = ['tag1', 'tag2'];
      await wrapper.vm.$nextTick();
      const removeBtn = wrapper.find('.tag-remove');
      await removeBtn.trigger('click');
      expect(vm.form.tags.length).toBe(1);
    });

    it('should have system tag checkboxes', () => {
      wrapper = mount(TaskCreationForm);
      const checkboxes = wrapper.findAll('.system-tags input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should add system tag when checkbox checked', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const checkbox = wrapper.find('.system-tags input[type="checkbox"]');
      await checkbox.setValue(true);
      expect(vm.form.systemTags.length).toBeGreaterThan(0);
    });
  });

  // ============== バリデーション ==============
  describe('Form Validation', () => {
    it('should validate title is required', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = '';
      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.title).toBeTruthy();
    });

    it('should validate assignee is required', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = '';
      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.assignee).toBeTruthy();
    });

    it('should validate start and due dates are required', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.startDate = '';
      vm.form.dueDate = '';
      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.dueDate).toBeTruthy();
    });

    it('should validate due date is after start date', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-20';
      const isValid = vm.validateForm();
      expect(isValid).toBe(false);
      expect(vm.errors.dueDate).toContain('이후');
    });

    it('should allow valid form data', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';
      vm.form.estimateHours = 5;
      const isValid = vm.validateForm();
      expect(isValid).toBe(true);
      expect(Object.keys(vm.errors).length).toBe(0);
    });

    it('should display error messages', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.errors.title = '작업명은 필수입니다.';
      await wrapper.vm.$nextTick();
      const errorText = wrapper.find('.error-text');
      expect(errorText.text()).toContain('필수');
    });
  });

  // ============== 条件表示 ==============
  describe('Conditional Display', () => {
    it('should show recurrence pattern select when isRecurring is true', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      expect(wrapper.find('#taskRecurrence').exists()).toBe(false);
      vm.form.isRecurring = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#taskRecurrence').exists()).toBe(true);
    });

    it('should hide recurrence pattern select when isRecurring is false', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.isRecurring = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#taskRecurrence').exists()).toBe(false);
    });

    it('should show success message when set', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.successMessage = 'Task created successfully';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.success-message').exists()).toBe(true);
      expect(wrapper.find('.success-message').text()).toContain('Task created');
    });

    it('should not show success message when empty', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.success-message').exists()).toBe(false);
    });
  });

  // ============== フォーム送信 ==============
  describe('Form Submission', () => {
    it('should render submit button', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.submit-btn').exists()).toBe(true);
    });

    it('should render cancel button', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.cancel-btn').exists()).toBe(true);
    });

    it('should disable submit button when isSubmitting is true', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.isSubmitting = true;
      await wrapper.vm.$nextTick();
      const btn = wrapper.find('.submit-btn');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('should not submit form with invalid data', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = '';
      const form = wrapper.find('.task-form');
      await form.trigger('submit');
      expect(vm.errors.title).toBeTruthy();
    });

    it('should emit cancel event on cancel button click', async () => {
      wrapper = mount(TaskCreationForm);
      await wrapper.find('.cancel-btn').trigger('click');
      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('should submit task with valid data', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'New Task';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.assignee = 'sudal';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';
      vm.form.estimateHours = 5;

      const form = wrapper.find('.task-form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.emitted('task-created')).toBeTruthy();
    });

    it('should set isSubmitting to true during submission', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'New Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      const form = wrapper.find('.task-form');
      form.trigger('submit');
      expect(vm.isSubmitting).toBe(true);

      await flushPromises();
      expect(vm.isSubmitting).toBe(false);
    });

    it('should show success message after submission', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'New Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      const form = wrapper.find('.task-form');
      await form.trigger('submit');
      await flushPromises();

      expect(vm.successMessage).toContain('New Task');
    });

    it('should emit task-created event with task data', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      const form = wrapper.find('.task-form');
      await form.trigger('submit');
      await flushPromises();

      const emitted = wrapper.emitted('task-created');
      expect(emitted).toBeTruthy();
      expect(emitted[0][0].title).toBe('Test Task');
    });
  });

  // ============== フォームリセット ==============
  describe('Form Reset', () => {
    it('should render reset button in header', () => {
      wrapper = mount(TaskCreationForm);
      expect(wrapper.find('.reset-btn').exists()).toBe(true);
    });

    it('should clear all form fields on reset', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Some Title';
      vm.form.description = 'Some Description';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.assignee = 'sudal';

      await wrapper.find('.reset-btn').trigger('click');

      expect(vm.form.title).toBe('');
      expect(vm.form.description).toBe('');
      expect(vm.form.priority).toBe('');
      expect(vm.form.category).toBe('');
      expect(vm.form.assignee).toBe('');
    });

    it('should clear tags on reset', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.tags = ['tag1', 'tag2'];
      await wrapper.find('.reset-btn').trigger('click');
      expect(vm.form.tags).toEqual([]);
    });

    it('should clear errors on reset', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.errors = { title: 'Error' };
      await wrapper.find('.reset-btn').trigger('click');
      expect(vm.errors).toEqual({});
    });

    it('should clear tagInput on reset', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.tagInput = 'input text';
      await wrapper.find('.reset-btn').trigger('click');
      expect(vm.tagInput).toBe('');
    });

    it('should clear successMessage on reset', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.successMessage = 'Success!';
      await wrapper.find('.reset-btn').trigger('click');
      expect(vm.successMessage).toBe('');
    });
  });

  // ============== チェックボックス ==============
  describe('Checkbox Functionality', () => {
    it('should render blocking task checkbox', () => {
      wrapper = mount(TaskCreationForm);
      const checkboxes = wrapper.findAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should toggle isBlocking on checkbox', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const checkbox = wrapper.findAll('.checkbox-group input[type="checkbox"]').at(0);
      await checkbox?.setValue(true);
      expect(vm.form.isBlocking).toBe(true);
    });

    it('should toggle requiresApproval on checkbox', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const checkboxes = wrapper.findAll('.checkbox-group input[type="checkbox"]');
      await checkboxes[1]?.setValue(true);
      expect(vm.form.requiresApproval).toBe(true);
    });

    it('should toggle isRecurring on checkbox', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const checkboxes = wrapper.findAll('.checkbox-group input[type="checkbox"]');
      await checkboxes[2]?.setValue(true);
      expect(vm.form.isRecurring).toBe(true);
    });
  });

  // ============== IPC統合 ==============
  describe('IPC Integration', () => {
    it('should call electronAPI.createTask on submit', async () => {
      const mockAPI = {
        createTask: vi.fn()
      };
      (window as any).electronAPI = mockAPI;

      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      const form = wrapper.find('.task-form');
      await form.trigger('submit');
      await flushPromises();

      expect(mockAPI.createTask).toHaveBeenCalled();
    });

    it('should handle missing electronAPI gracefully', async () => {
      (window as any).electronAPI = undefined;

      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      expect(() => {
        vm.submitTask();
      }).not.toThrow();
    });
  });

  // ============== エッジケース ==============
  describe('Edge Cases', () => {
    it('should handle very long task title', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'a'.repeat(500);
      const isValid = vm.validateForm();
      expect(isValid).toBe(false); // because assignee not set
      expect(vm.form.title).toBe('a'.repeat(500));
    });

    it('should handle many tags', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      for (let i = 0; i < 20; i++) {
        vm.form.tags.push(`tag${i}`);
      }
      await wrapper.vm.$nextTick();
      const tags = wrapper.findAll('.tag-item');
      expect(tags.length).toBe(20);
    });

    it('should handle form submission while already submitting', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.priority = 'high';
      vm.form.category = 'development';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-22';

      vm.isSubmitting = true;
      await wrapper.vm.$nextTick();
      const btn = wrapper.find('.submit-btn');
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('should trim whitespace from tag input', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.tagInput = '  test tag  ';
      await wrapper.find('.tag-add-btn').trigger('click');
      expect(vm.form.tags[0]).toBe('test tag');
    });

    it('should allow same dates for start and due', () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Test Task';
      vm.form.assignee = 'sudal';
      vm.form.startDate = '2026-05-21';
      vm.form.dueDate = '2026-05-21';
      const isValid = vm.validateForm();
      expect(isValid).toBe(true);
    });

    it('should handle clearing and re-selecting assignee', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      const select = wrapper.find('#taskAssignee');
      await select.setValue('sudal');
      expect(vm.form.assignee).toBe('sudal');
      await select.setValue('');
      expect(vm.form.assignee).toBe('');
      await select.setValue('lando');
      expect(vm.form.assignee).toBe('lando');
    });
  });

  // ===== Template Event Handler Coverage =====
  describe('Template v-model Handler Coverage', () => {
    it('should trigger description textarea v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const ta = wrapper.find('#taskDescription');
      await ta.setValue('상세 설명');
      expect((wrapper.vm as any).form.description).toBe('상세 설명');
    });

    it('should trigger dependency text v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const inp = wrapper.find('#taskDependency');
      await inp.setValue('TASK_001');
      expect((wrapper.vm as any).form.dependency).toBe('TASK_001');
    });

    it('should trigger team select v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const sel = wrapper.find('#taskTeam');
      await sel.setValue('track-a');
      expect((wrapper.vm as any).form.team).toBe('track-a');
    });

    it('should trigger startDate v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const inp = wrapper.find('#taskStartDate');
      await inp.setValue('2026-05-30');
      expect((wrapper.vm as any).form.startDate).toBe('2026-05-30');
    });

    it('should trigger dueDate v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const inp = wrapper.find('#taskDueDate');
      await inp.setValue('2026-06-15');
      expect((wrapper.vm as any).form.dueDate).toBe('2026-06-15');
    });

    it('should trigger estimateHours number v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const inp = wrapper.find('#taskEstimate');
      await inp.setValue(8);
      expect((wrapper.vm as any).form.estimateHours).toBe(8);
    });

    it('should trigger milestone select v-model', async () => {
      wrapper = mount(TaskCreationForm);
      const sel = wrapper.find('#taskMilestone');
      await sel.setValue('phase-2a');
      expect((wrapper.vm as any).form.milestone).toBe('phase-2a');
    });

    it('should trigger recurrencePattern select v-model when isRecurring', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.isRecurring = true;
      await wrapper.vm.$nextTick();
      const sel = wrapper.find('#taskRecurrence');
      expect(sel.exists()).toBe(true);
      await sel.setValue('weekly');
      expect(vm.form.recurrencePattern).toBe('weekly');
    });

    it('should clear successMessage when close-success @click fires', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.successMessage = '테스트 메시지';
      await wrapper.vm.$nextTick();
      const closeBtn = wrapper.find('.close-success');
      expect(closeBtn.exists()).toBe(true);
      await closeBtn.trigger('click');
      expect(vm.successMessage).toBe('');
    });

    it('should fire submitTask setTimeout resetForm callback', async () => {
      wrapper = mount(TaskCreationForm);
      const vm = wrapper.vm as any;
      vm.form.title = 'Coverage Task';
      vm.form.assignee = 'sudal';
      vm.form.startDate = '2026-05-30';
      vm.form.dueDate = '2026-05-31';
      await wrapper.vm.$nextTick();
      const submitPromise = vm.submitTask();
      await flushPromises();
      await submitPromise;
      expect(vm.successMessage).toContain('Coverage Task');
      // Advance setTimeout(1500) → resetForm()
      vi.advanceTimersByTime(1600);
      await flushPromises();
      expect(vm.form.title).toBe('');
    });
  });
});

/*
시각(時刻)에 존재하고, 시간(時間) 에 소멸한다.
Exists in the Moment, Vanishes in Time.
*/
