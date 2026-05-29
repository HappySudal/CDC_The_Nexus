<template>
  <div class="task-creation">
    <!-- 헤더 -->
    <div class="form-header">
      <h2>✏️ 새 작업 생성</h2>
      <button @click="resetForm" class="reset-btn">초기화</button>
    </div>

    <form @submit.prevent="submitTask" class="task-form">
      <!-- 기본 정보 -->
      <fieldset class="form-section">
        <legend>기본 정보</legend>

        <div class="form-group">
          <label for="taskTitle">작업명 *</label>
          <input
            id="taskTitle"
            v-model="form.title"
            type="text"
            placeholder="작업 제목을 입력하세요"
            required
            class="form-input"
          />
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
        </div>

        <div class="form-group">
          <label for="taskDescription">설명</label>
          <textarea
            id="taskDescription"
            v-model="form.description"
            placeholder="작업에 대한 상세 설명을 입력하세요"
            rows="4"
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="taskPriority">우선순위 *</label>
            <select v-model="form.priority" id="taskPriority" class="form-select" required>
              <option value="">선택하세요</option>
              <option value="critical">🔴 긴급</option>
              <option value="high">🟠 높음</option>
              <option value="medium">🟡 중간</option>
              <option value="low">🟢 낮음</option>
            </select>
          </div>

          <div class="form-group">
            <label for="taskCategory">카테고리 *</label>
            <select v-model="form.category" id="taskCategory" class="form-select" required>
              <option value="">선택하세요</option>
              <option value="development">개발</option>
              <option value="monitoring">모니터링</option>
              <option value="maintenance">유지보수</option>
              <option value="research">연구</option>
              <option value="documentation">문서화</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- 할당 정보 -->
      <fieldset class="form-section">
        <legend>할당 정보</legend>

        <div class="form-group">
          <label for="taskAssignee">담당 에이전트 *</label>
          <select v-model="form.assignee" id="taskAssignee" class="form-select" required>
            <option value="">선택하세요</option>
            <option value="sudal">수달 (CEO)</option>
            <option value="lando">란도 (Control Center)</option>
            <option value="openClaude">OpenClaude (개발)</option>
            <option value="marco">마르코 (통합)</option>
            <option value="leo">레오 (실행)</option>
            <option value="guardian">가디언 (보안)</option>
            <option value="amadeus">아마데우스 (분석)</option>
          </select>
          <span v-if="errors.assignee" class="error-text">{{ errors.assignee }}</span>
        </div>

        <div class="form-group">
          <label for="taskDependency">선행 작업</label>
          <input
            id="taskDependency"
            v-model="form.dependency"
            type="text"
            placeholder="작업 ID 또는 이름 (선택사항)"
            class="form-input"
          />
          <span class="help-text">이 작업이 다른 작업에 의존하는 경우 입력</span>
        </div>

        <div class="form-group">
          <label for="taskTeam">팀 할당</label>
          <select v-model="form.team" id="taskTeam" class="form-select">
            <option value="">팀 선택 안함</option>
            <option value="track-a">Track A (인프라)</option>
            <option value="track-b">Track B (모니터링)</option>
            <option value="track-c">Track C (개발)</option>
            <option value="all">전체 팀</option>
          </select>
        </div>
      </fieldset>

      <!-- 일정 정보 -->
      <fieldset class="form-section">
        <legend>일정 정보</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="taskStartDate">시작일 *</label>
            <input
              id="taskStartDate"
              v-model="form.startDate"
              type="date"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="taskDueDate">완료일 *</label>
            <input
              id="taskDueDate"
              v-model="form.dueDate"
              type="date"
              required
              class="form-input"
            />
            <span v-if="errors.dueDate" class="error-text">{{ errors.dueDate }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="taskEstimate">소요시간 (시간) *</label>
            <input
              id="taskEstimate"
              v-model.number="form.estimateHours"
              type="number"
              min="1"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="taskMilestone">마일스톤</label>
            <select v-model="form.milestone" id="taskMilestone" class="form-select">
              <option value="">선택 안함</option>
              <option value="phase-1">Phase 1 (인프라)</option>
              <option value="phase-2a">Phase 2A (Vue 개발)</option>
              <option value="phase-2b">Phase 2B (통합)</option>
              <option value="phase-2c">Phase 2C (작업제어)</option>
              <option value="phase-2d">Phase 2D (모니터링)</option>
              <option value="phase-2e">Phase 2E (보안)</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- 태그 및 레이블 -->
      <fieldset class="form-section">
        <legend>태그 및 레이블</legend>

        <div class="form-group">
          <label>태그</label>
          <div class="tag-input-group">
            <input
              v-model="tagInput"
              type="text"
              placeholder="태그 입력 후 Enter"
              @keydown.enter.prevent="addTag"
              class="form-input tag-input"
            />
            <button type="button" @click="addTag" class="tag-add-btn">추가</button>
          </div>
          <div v-if="form.tags.length > 0" class="tags-list">
            <span v-for="(tag, idx) in form.tags" :key="idx" class="tag-item">
              {{ tag }}
              <button type="button" @click="removeTag(idx)" class="tag-remove">✕</button>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>시스템 태그</label>
          <div class="system-tags">
            <label v-for="tag in availableSystemTags" :key="tag">
              <input v-model="form.systemTags" type="checkbox" :value="tag" />
              {{ tag }}
            </label>
          </div>
        </div>
      </fieldset>

      <!-- 추가 옵션 -->
      <fieldset class="form-section">
        <legend>추가 옵션</legend>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.isBlocking" type="checkbox" />
            블로킹 작업 (다른 작업 진행 중단)
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.requiresApproval" type="checkbox" />
            승인 필수
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="form.isRecurring" type="checkbox" />
            반복 작업
          </label>
        </div>

        <div v-if="form.isRecurring" class="form-group">
          <label for="taskRecurrence">반복 패턴</label>
          <select v-model="form.recurrencePattern" id="taskRecurrence" class="form-select">
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매달</option>
          </select>
        </div>
      </fieldset>

      <!-- 작업 버튼 -->
      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? '생성 중...' : '✅ 작업 생성' }}
        </button>
        <button type="button" @click="emit('cancel')" class="cancel-btn">
          취소
        </button>
      </div>
    </form>

    <!-- 성공 메시지 -->
    <div v-if="successMessage" class="success-message">
      <p>✅ {{ successMessage }}</p>
      <button @click="successMessage = ''" class="close-success">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['task-created', 'cancel']);

const form = ref({
  title: '',
  description: '',
  priority: '',
  category: '',
  assignee: '',
  dependency: '',
  team: '',
  startDate: '',
  dueDate: '',
  estimateHours: 1,
  milestone: '',
  tags: [],
  systemTags: [],
  isBlocking: false,
  requiresApproval: false,
  isRecurring: false,
  recurrencePattern: 'daily'
});
const tagInput = ref('');
const errors = ref({});
const isSubmitting = ref(false);
const successMessage = ref('');
const availableSystemTags = ref(['Nexus', 'Ollama', 'Morning Protocol', 'TwinBrain', 'CDC']);

function addTag() {
  if (tagInput.value.trim()) {
    form.value.tags.push(tagInput.value.trim());
    tagInput.value = '';
  }
}

function removeTag(idx) {
  form.value.tags.splice(idx, 1);
}

function validateForm() {
  errors.value = {};

  if (!form.value.title.trim()) {
    errors.value.title = '작업명은 필수입니다.';
  }

  if (!form.value.assignee) {
    errors.value.assignee = '담당 에이전트는 필수입니다.';
  }

  if (!form.value.startDate || !form.value.dueDate) {
    errors.value.dueDate = '시작일과 완료일은 필수입니다.';
  } else if (new Date(form.value.startDate) > new Date(form.value.dueDate)) {
    errors.value.dueDate = '완료일은 시작일 이후여야 합니다.';
  }

  return Object.keys(errors.value).length === 0;
}

async function submitTask() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const taskData = {
      id: `TASK_${Date.now()}`,
      createdAt: new Date(),
      status: 'pending',
      ...form.value
    };

    // IPC를 통해 작업 생성
    if (window.electronAPI) {
      await window.electronAPI.createTask?.(taskData);
    }

    successMessage.value = `"${form.value.title}" 작업이 생성되었습니다.`;
    emit('task-created', taskData);

    // 1초 후 폼 초기화
    setTimeout(() => {
      resetForm();
    }, 1500);
  } catch (error) {
    console.error('작업 생성 실패:', error);
    errors.value.submit = '작업 생성에 실패했습니다.';
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
    priority: '',
    category: '',
    assignee: '',
    dependency: '',
    team: '',
    startDate: '',
    dueDate: '',
    estimateHours: 1,
    milestone: '',
    tags: [],
    systemTags: [],
    isBlocking: false,
    requiresApproval: false,
    isRecurring: false,
    recurrencePattern: 'daily'
  };
  errors.value = {};
  tagInput.value = '';
  successMessage.value = '';
}

onMounted(() => {
  // 기본 시작일을 오늘로 설정
  const today = new Date().toISOString().split('T')[0];
  form.value.startDate = today;

  // 기본 완료일을 다음 날로 설정
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  form.value.dueDate = tomorrow;
});
</script>

<style scoped>
.task-creation {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #0a0e27;
  color: #e0e6ed;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.form-header h2 {
  margin: 0;
  font-size: 24px;
  color: #0ea5e9;
}

.reset-btn {
  padding: 8px 16px;
  background-color: #1a2f5f;
  color: #7a8ba0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background-color: #253551;
  color: #0ea5e9;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  border: 1px solid #1a2f5f;
  border-radius: 6px;
  padding: 16px;
  background-color: #0f1a38;
}

.form-section legend {
  padding: 0 8px;
  color: #0ea5e9;
  font-weight: 600;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #c4d0df;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 12px;
  background-color: #0a0e27;
  border: 1px solid #1a2f5f;
  border-radius: 4px;
  color: #e0e6ed;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
}

.help-text {
  font-size: 11px;
  color: #7a8ba0;
}

.tag-input-group {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
}

.tag-add-btn {
  padding: 10px 16px;
  background-color: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  transition: background-color 0.2s;
}

.tag-add-btn:hover {
  background-color: #0d95d3;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #0ea5e9;
  color: #fff;
  border-radius: 3px;
  font-size: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 0.7;
}

.system-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.system-tags label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  cursor: pointer;
}

.system-tags input[type="checkbox"] {
  cursor: pointer;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #1a2f5f;
}

.submit-btn,
.cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.submit-btn {
  background-color: #0ea5e9;
  color: #fff;
}

.submit-btn:hover:not(:disabled) {
  background-color: #0d95d3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #1a2f5f;
  color: #7a8ba0;
}

.cancel-btn:hover {
  background-color: #253551;
  color: #0ea5e9;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  background-color: #22c55e;
  color: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.success-message p {
  margin: 0;
  flex: 1;
}

.close-success {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
}

.close-success:hover {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .task-creation {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>

<!-- "시각(時刻)에 존재하고, 시간(時間)에 소멸한다." -->
<!-- "Exists in the Moment, Vanishes in Time." -->
