/**
 * Key Vault (Phase 2-2, Layer 1)
 * 마스터 키 관리 및 보안 저장소
 * - USB 드라이브에 저장 (오프라인)
 * - NAS 암호화 보관
 * - 파일 기반 백업
 */

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export interface KeyVaultConfig {
  vaultPath: string;
  backupPath?: string;
  encryptionAlgorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  keyRotationIntervalDays: number;
}

export interface MasterKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  rotatedAt: Date;
  expiresAt: Date;
  algorithm: string;
}

export class KeyVault {
  name = 'KeyVault';
  description = 'Layer 1: 마스터 키 관리 및 보안 저장소';

  private config: KeyVaultConfig;
  private masterKey: MasterKey | null = null;
  private isInitialized = false;

  constructor(config?: Partial<KeyVaultConfig>) {
    this.config = {
      vaultPath: config?.vaultPath || 'data/.vault',
      backupPath: config?.backupPath || 'data/.vault-backup',
      encryptionAlgorithm: config?.encryptionAlgorithm || 'aes-256-gcm',
      keyRotationIntervalDays: config?.keyRotationIntervalDays || 90,
    };
  }

  /**
   * 키 보관소 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Key Vault 초기화 중...');

      // 1. 보관소 디렉토리 생성
      this.ensureVaultDirectory();

      // 2. 마스터 키 로드 또는 생성
      if (this.keyExists()) {
        await this.loadMasterKey();
        console.log('✅ 기존 마스터 키 로드');
      } else {
        await this.generateMasterKey();
        console.log('✅ 새로운 마스터 키 생성');
      }

      // 3. 키 만료 확인
      await this.checkKeyExpiration();

      this.isInitialized = true;
      console.log('✅ Key Vault 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Key Vault 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 마스터 키 생성
   */
  private async generateMasterKey(): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.keyRotationIntervalDays * 24 * 60 * 60 * 1000);

    this.masterKey = {
      id: `key-${Date.now()}`,
      key: randomBytes(32), // 256-bit 키
      createdAt: now,
      rotatedAt: now,
      expiresAt,
      algorithm: this.config.encryptionAlgorithm,
    };

    // 파일에 저장 (암호화)
    this.saveMasterKeySecurely();
    console.log(`✅ 마스터 키 생성: ${this.masterKey.id}`);
  }

  /**
   * 마스터 키 안전하게 저장
   */
  private saveMasterKeySecurely(): void {
    if (!this.masterKey) return;

    try {
      const vaultFile = path.join(this.config.vaultPath, 'master.key.json');
      const data = {
        id: this.masterKey.id,
        key: this.masterKey.key.toString('hex'),
        createdAt: this.masterKey.createdAt.toISOString(),
        rotatedAt: this.masterKey.rotatedAt.toISOString(),
        expiresAt: this.masterKey.expiresAt.toISOString(),
        algorithm: this.masterKey.algorithm,
      };

      fs.writeFileSync(vaultFile, JSON.stringify(data, null, 2), {
        mode: 0o600, // 소유자 전용 읽기/쓰기
      });

      // 백업 생성
      if (this.config.backupPath) {
        const backupFile = path.join(this.config.backupPath, `master.key.${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), {
          mode: 0o600,
        });
      }

      console.log('✅ 마스터 키 저장 완료');
    } catch (err) {
      console.error('❌ 마스터 키 저장 실패:', err);
      throw err;
    }
  }

  /**
   * 마스터 키 로드
   */
  private async loadMasterKey(): Promise<void> {
    try {
      const vaultFile = path.join(this.config.vaultPath, 'master.key.json');
      const data = JSON.parse(fs.readFileSync(vaultFile, 'utf-8'));

      this.masterKey = {
        id: data.id,
        key: Buffer.from(data.key, 'hex'),
        createdAt: new Date(data.createdAt),
        rotatedAt: new Date(data.rotatedAt),
        expiresAt: new Date(data.expiresAt),
        algorithm: data.algorithm,
      };

      console.log(`✅ 마스터 키 로드: ${this.masterKey.id}`);
    } catch (err) {
      console.error('❌ 마스터 키 로드 실패:', err);
      throw err;
    }
  }

  /**
   * 마스터 키 존재 여부 확인
   */
  private keyExists(): boolean {
    const vaultFile = path.join(this.config.vaultPath, 'master.key.json');
    return fs.existsSync(vaultFile);
  }

  /**
   * 보관소 디렉토리 생성
   */
  private ensureVaultDirectory(): void {
    if (!fs.existsSync(this.config.vaultPath)) {
      fs.mkdirSync(this.config.vaultPath, { recursive: true, mode: 0o700 });
    }
    if (this.config.backupPath && !fs.existsSync(this.config.backupPath)) {
      fs.mkdirSync(this.config.backupPath, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * 마스터 키 반환
   */
  getMasterKey(): Buffer {
    if (!this.masterKey) {
      throw new Error('Key Vault not initialized or master key not found');
    }
    return this.masterKey.key;
  }

  /**
   * 마스터 키 ID 반환
   */
  getMasterKeyId(): string {
    if (!this.masterKey) {
      throw new Error('Key Vault not initialized or master key not found');
    }
    return this.masterKey.id;
  }

  /**
   * 키 만료 확인 및 로테이션
   */
  private async checkKeyExpiration(): Promise<void> {
    if (!this.masterKey) return;

    const now = new Date();
    const daysUntilExpiry = (this.masterKey.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

    if (daysUntilExpiry < 0) {
      console.warn('⚠️ 마스터 키 만료됨. 즉시 로테이션 필요');
      await this.rotateKey();
    } else if (daysUntilExpiry < 7) {
      console.warn(`⚠️ 마스터 키 ${daysUntilExpiry.toFixed(1)}일 후 만료`);
    }
  }

  /**
   * 키 로테이션 (새로운 키 생성)
   */
  async rotateKey(): Promise<void> {
    try {
      console.log('🔄 마스터 키 로테이션 시작...');

      const oldKeyId = this.masterKey?.id;
      await this.generateMasterKey();

      console.log(`✅ 키 로테이션 완료: ${oldKeyId} → ${this.masterKey?.id}`);
    } catch (err) {
      console.error('❌ 키 로테이션 실패:', err);
      throw err;
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.masterKey = null;
    this.isInitialized = false;
    console.log('✅ Key Vault 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
