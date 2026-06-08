/**
 * Security Engine (Phase 2-2)
 * 5계층 보안 체계
 * - Layer 1: Key Vault (마스터 키 관리)
 * - Layer 2: Storage Encryption (SQLite 암호화)
 * - Layer 3: Access Control (RBAC)
 * - Layer 4: Transport Security (TLS/SSH)
 * - Layer 5: Audit Logging (감시)
 */

import { KeyVault } from './utils/key-vault';
import { EncryptionManager } from './utils/encryption';
import { RBACManager } from './utils/rbac';
import { AuditLog } from './utils/audit-log';

export class SecurityEngine {
  name = 'SecurityEngine';
  description = '5계층 통합 보안 시스템';

  private keyVault: KeyVault;
  private encryption: EncryptionManager;
  private rbac: RBACManager;
  private auditLog: AuditLog;

  constructor() {
    this.keyVault = new KeyVault();
    this.encryption = new EncryptionManager(this.keyVault);
    this.rbac = new RBACManager();
    this.auditLog = new AuditLog();
  }

  /**
   * 보안 엔진 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Security Engine 초기화 중...');

      // 1. Key Vault 초기화
      await this.keyVault.initialize();
      console.log('✅ Layer 1: Key Vault 초기화');

      // 2. 암호화 초기화
      await this.encryption.initialize();
      console.log('✅ Layer 2: 암호화 엔진 초기화');

      // 3. RBAC 초기화
      await this.rbac.initialize();
      console.log('✅ Layer 3: RBAC 초기화');

      // 4. 감시 로그 초기화
      await this.auditLog.initialize();
      console.log('✅ Layer 4: 감시 로그 초기화');

      console.log('✅ 보안 엔진 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ 보안 엔진 초기화 실패:', err);
      return false;
    }
  }

  /**
   * SQLite 데이터베이스 암호화
   */
  async encryptDatabase(dbPath: string, password: string): Promise<boolean> {
    try {
      return await this.encryption.encryptDatabase(dbPath, password);
    } catch (err) {
      console.error('❌ 데이터베이스 암호화 실패:', err);
      return false;
    }
  }

  /**
   * 접근 제어 확인
   */
  async checkAccess(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      return await this.rbac.checkAccess(userId, resource, action);
    } catch (err) {
      console.error('❌ 접근 제어 확인 실패:', err);
      return false;
    }
  }

  /**
   * 감시 로그 기록
   */
  async logAction(
    userId: string,
    action: string,
    resource: string,
    status: 'success' | 'failure'
  ): Promise<void> {
    try {
      await this.auditLog.log(userId, action, resource, status);
    } catch (err) {
      console.error('⚠️ 감시 로그 기록 실패:', err);
    }
  }

  /**
   * 감시 로그 조회
   */
  async getAuditLogs(filters?: any): Promise<any[]> {
    try {
      return await this.auditLog.getLogs(filters);
    } catch (err) {
      console.error('❌ 감시 로그 조회 실패:', err);
      return [];
    }
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
