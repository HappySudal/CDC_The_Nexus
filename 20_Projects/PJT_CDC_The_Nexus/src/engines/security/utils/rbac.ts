/**
 * RBAC Manager (Phase 2-2, Layer 3)
 * Role-Based Access Control
 * - 역할 정의 (Administrator, User, Guest)
 * - 권한 관리 (read, write, delete, admin)
 * - 접근 제어 검증
 */

export interface Role {
  name: string;
  permissions: Set<string>;
  description: string;
}

export interface User {
  id: string;
  name: string;
  roles: Set<string>;
  createdAt: Date;
}

export interface Resource {
  id: string;
  name: string;
  owner: string;
  permissions: Map<string, string[]>; // role -> [permissions]
}

export interface AccessCheckRequest {
  userId: string;
  action: string;
  resource: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  roles?: string[];
}

export class RBACManager {
  name = 'RBACManager';
  description = 'Layer 3: 역할 기반 접근 제어 (RBAC)';

  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private resources: Map<string, Resource> = new Map();
  private isInitialized = false;

  /**
   * RBAC 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 RBAC Manager 초기화 중...');

      // 1. 기본 역할 정의
      this.initializeDefaultRoles();

      // 2. 기본 사용자 생성
      this.initializeDefaultUsers();

      this.isInitialized = true;
      console.log('✅ RBAC Manager 초기화 완료');
      return true;
    } catch (err) {
      console.error('❌ RBAC Manager 초기화 실패:', err);
      return false;
    }
  }

  /**
   * 기본 역할 정의
   */
  private initializeDefaultRoles(): void {
    // Administrator: 모든 권한
    this.createRole('administrator', ['read', 'write', 'delete', 'admin'], 'System Administrator');

    // User: 읽기, 쓰기 권한
    this.createRole('user', ['read', 'write'], 'Regular User');

    // Guest: 읽기 권한만
    this.createRole('guest', ['read'], 'Guest User');

    // System: 시스템 권한
    this.createRole('system', ['read', 'write', 'delete', 'admin', 'audit'], 'System Process');

    console.log('✅ 기본 역할 생성 완료');
  }

  /**
   * 기본 사용자 생성
   */
  private initializeDefaultUsers(): void {
    // Administrator 사용자
    this.createUser('system_admin', 'System Administrator', ['administrator']);

    // 일반 사용자
    this.createUser('user_primary', '주 사용자', ['user']);

    // 게스트 사용자
    this.createUser('guest_user', 'Guest', ['guest']);

    console.log('✅ 기본 사용자 생성 완료');
  }

  /**
   * 역할 생성
   */
  createRole(name: string, permissions: string[], description: string): Role {
    const role: Role = {
      name,
      permissions: new Set(permissions),
      description,
    };
    this.roles.set(name, role);
    return role;
  }

  /**
   * 사용자 생성
   */
  createUser(id: string, name: string, roles: string[]): User {
    const user: User = {
      id,
      name,
      roles: new Set(roles),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * 리소스 생성
   */
  createResource(id: string, name: string, owner: string): Resource {
    const resource: Resource = {
      id,
      name,
      owner,
      permissions: new Map(),
    };
    this.resources.set(id, resource);
    return resource;
  }

  /**
   * 역할에 권한 부여
   */
  grantPermission(roleName: string, permission: string): boolean {
    const role = this.roles.get(roleName);
    if (!role) {
      console.warn(`⚠️ 역할을 찾을 수 없음: ${roleName}`);
      return false;
    }
    role.permissions.add(permission);
    return true;
  }

  /**
   * 역할에서 권한 제거
   */
  revokePermission(roleName: string, permission: string): boolean {
    const role = this.roles.get(roleName);
    if (!role) {
      console.warn(`⚠️ 역할을 찾을 수 없음: ${roleName}`);
      return false;
    }
    role.permissions.delete(permission);
    return true;
  }

  /**
   * 사용자에게 역할 할당
   */
  assignRole(userId: string, roleName: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`⚠️ 사용자를 찾을 수 없음: ${userId}`);
      return false;
    }
    user.roles.add(roleName);
    return true;
  }

  /**
   * 사용자에서 역할 제거
   */
  unassignRole(userId: string, roleName: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`⚠️ 사용자를 찾을 수 없음: ${userId}`);
      return false;
    }
    user.roles.delete(roleName);
    return true;
  }

  /**
   * 접근 제어 확인
   */
  async checkAccess(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        console.warn(`⚠️ 사용자를 찾을 수 없음: ${userId}`);
        return false;
      }

      // 사용자의 모든 역할에서 권한 확인
      for (const roleName of user.roles) {
        const role = this.roles.get(roleName);
        if (role && role.permissions.has(action)) {
          console.log(`✅ 접근 허용: ${userId} → ${action} on ${resource}`);
          return true;
        }
      }

      console.warn(`❌ 접근 거부: ${userId} → ${action} on ${resource}`);
      return false;
    } catch (err) {
      console.error('❌ 접근 제어 확인 중 오류:', err);
      return false;
    }
  }

  /**
   * 권한 목록 조회 (사용자)
   */
  getUserPermissions(userId: string): Set<string> {
    const user = this.users.get(userId);
    if (!user) return new Set();

    const permissions = new Set<string>();
    for (const roleName of user.roles) {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(p => permissions.add(p));
      }
    }
    return permissions;
  }

  /**
   * 역할 목록 조회
   */
  getUserRoles(userId: string): string[] {
    const user = this.users.get(userId);
    if (!user) return [];
    return Array.from(user.roles);
  }

  /**
   * 모든 역할 조회
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * 모든 사용자 조회
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * 라이프사이클: 종료
   */
  destroy(): void {
    this.roles.clear();
    this.users.clear();
    this.resources.clear();
    this.isInitialized = false;
    console.log('✅ RBAC Manager 종료');
  }
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
