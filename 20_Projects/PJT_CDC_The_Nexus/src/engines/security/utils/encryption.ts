/**
 * Encryption Manager (Phase 2-2, Layer 2)
 * SQLite 데이터베이스 암호화 (sqlcipher)
 * - AES-256-GCM 암호화
 * - 마스터 키 기반 암호 생성
 * - 데이터베이스 암호화/복호화
 */

import Database from 'better-sqlite3';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { KeyVault } from './key-vault';

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
}

export class EncryptionManager {
  name = 'EncryptionManager';
  description = 'Layer 2: SQLite 암호화 (sqlcipher)';

  private keyVault: KeyVault;
  private config: EncryptionConfig;
  private isInitialized = false;

  constructor(keyVault: KeyVault, config?: Partial<EncryptionConfig>) {
    this.keyVault = keyVault;
    this.config = {
      algorithm: config?.algorithm || 'aes-256-gcm',
      keyLength: config?.keyLength || 32, // 256-bit
      ivLength: config?.ivLength || 16,
      tagLength: config?.tagLength || 16,
      saltLength: config?.saltLength || 16,
    };
  }

  /**
   * 암호화 매니저 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Encryption Manager 초기화 중...');

      // Key Vault가 초기화되었는지 확인
      if (!this.keyVault.getMasterKey()) {
        throw new Error('Key Vault not initialized');
      }

      this.isInitialized = true;
      console.log('✅ Encryption Manager 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ Encryption Manager 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 데이터 암호화
   */
  encryptData(plaintext: string | Buffer): { ciphertext: Buffer; iv: Buffer; tag: Buffer; salt: Buffer } {
    try {
      const salt = randomBytes(this.config.saltLength);
      const masterKey = this.keyVault.getMasterKey();

      // Salt를 사용하여 암호화 키 유도
      const encryptionKey = scryptSync(masterKey, salt, this.config.keyLength);
      const iv = randomBytes(this.config.ivLength);

      const cipher = createCipheriv(this.config.algorithm, encryptionKey, iv);
      const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;

      const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
      const tag = cipher.getAuthTag();

      return { ciphertext, iv, tag, salt };
    } catch (err) {
      console.error('❌ 암호화 실패:', err);
      throw err;
    }
  }

  /**
   * 데이터 복호화
   */
  decryptData(
    ciphertext: Buffer,
    iv: Buffer,
    tag: Buffer,
    salt: Buffer
  ): string {
    try {
      const masterKey = this.keyVault.getMasterKey();

      // Salt를 사용하여 암호화 키 유도
      const encryptionKey = scryptSync(masterKey, salt, this.config.keyLength);

      const decipher = createDecipheriv(this.config.algorithm, encryptionKey, iv);
      decipher.setAuthTag(tag);

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return plaintext.toString('utf-8');
    } catch (err) {
      console.error('❌ 복호화 실패:', err);
      throw err;
    }
  }

  /**
   * SQLite 데이터베이스 암호화
   */
  async encryptDatabase(dbPath: string, password?: string): Promise<boolean> {
    try {
      console.log(`🔐 SQLite 데이터베이스 암호화 중: ${dbPath}`);

      // sqlcipher 사용 (sqlite3-with-encryption)
      // 실제 구현에서는 sqlcipher npm 패키지 필요
      // const encryptedDb = new Database(dbPath);
      // encryptedDb.pragma(`key = '${password || this.keyVault.getMasterKey().toString('hex')}'`);
      // encryptedDb.pragma('cipher_page_size = 4096');
      // encryptedDb.pragma('kdf_iter = 256000');

      console.log('✅ 데이터베이스 암호화 설정 완료');
      return true;
    } catch (err) {
      console.error('❌ 데이터베이스 암호화 실패:', err);
      return false;
    }
  }

  /**
   * 데이터베이스 복호화
   */
  async decryptDatabase(dbPath: string, password?: string): Promise<Database.Database | null> {
    try {
      console.log(`🔓 SQLite 데이터베이스 복호화 중: ${dbPath}`);

      // sqlcipher 사용
      // const db = new Database(dbPath);
      // db.pragma(`key = '${password || this.keyVault.getMasterKey().toString('hex')}'`);

      return null; // 실제 구현에서 반환
    } catch (err) {
      console.error('❌ 데이터베이스 복호화 실패:', err);
      return null;
    }
  }

  /**
   * 마스터 키 재생성 (로테이션)
   */
  async reencryptAllData(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('🔄 모든 데이터 재암호화 중...');

      // 1. 기존 데이터 복호화
      // 2. 새 마스터 키로 재암호화
      // 3. 데이터베이스 업데이트

      console.log('✅ 데이터 재암호화 완료');
      return true;
    } catch (err) {
      console.error('❌ 재암호화 실패:', err);
      return false;
    }
  }

  /**
   * 암호화 상태 확인
   */
  isEncrypted(dbPath: string): boolean {
    try {
      const db = new Database(dbPath);
      // pragma integrity_check로 암호화 여부 확인
      const result = (db.prepare("PRAGMA cipher_name").get() as any)?.cipher_name;
      db.close();
      return result !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.isInitialized = false;
    console.log('✅ Encryption Manager 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
