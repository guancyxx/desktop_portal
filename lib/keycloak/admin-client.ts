/**
 * Keycloak Admin Client Service
 * 用于管理 Realm 的创建和用户权限
 */

import KcAdminClient from '@keycloak/keycloak-admin-client'
import { v4 as uuidv4 } from 'uuid'

const KEYCLOAK_URL = process.env.KEYCLOAK_INTERNAL_URL || 'http://keycloak:8080'
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin'
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin_password'

/**
 * Realm 创建结果
 */
export interface RealmCreationResult {
  success: boolean
  realmName: string
  displayName: string
  clientId: string
  clientSecret: string
  userId: string
  error?: string
}

/**
 * Keycloak Admin 服务类
 */
class KeycloakAdminService {
  private client: KcAdminClient
  private initialized: boolean = false

  constructor() {
    this.client = new KcAdminClient({
      baseUrl: KEYCLOAK_URL,
      realmName: 'master',
    })
  }

  /**
   * 认证为管理员
   */
  async authenticate() {
    if (this.initialized) {
      return
    }

    try {
      await this.client.auth({
        username: KEYCLOAK_ADMIN_USER,
        password: KEYCLOAK_ADMIN_PASSWORD,
        grantType: 'password',
        clientId: 'admin-cli',
      })
      this.initialized = true
      console.log('[Keycloak Admin] Authenticated successfully')
    } catch (error) {
      console.error('[Keycloak Admin] Authentication failed:', error)
      throw new Error('Failed to authenticate with Keycloak Admin API')
    }
  }

  /**
   * 生成 Realm 名称
   * 格式: {8位UUID}-{slug}
   * 例如: a3f7e2b1-acme-corp
   */
  generateRealmName(slug: string): string {
    const shortUuid = uuidv4().split('-')[0]
    return `${shortUuid}-${slug}`
  }

  /**
   * 验证 slug 格式
   */
  validateSlug(slug: string): { valid: boolean; error?: string } {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return {
        valid: false,
        error: '组织标识只能包含小写字母、数字和连字符'
      }
    }

    if (slug.length < 3 || slug.length > 20) {
      return {
        valid: false,
        error: '组织标识长度必须在 3-20 个字符之间'
      }
    }

    // 保留关键字
    const reserved = ['master', 'admin', 'default', 'system', 'root']
    if (reserved.includes(slug)) {
      return {
        valid: false,
        error: '该标识为系统保留，请选择其他标识'
      }
    }

    return { valid: true }
  }

  /**
   * 检查 Realm 是否存在
   */
  async realmExists(realmName: string): Promise<boolean> {
    await this.authenticate()

    try {
      await this.client.realms.findOne({ realm: realmName })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 检查 slug 是否已被使用
   * 遍历所有 realm，提取 slug 部分进行比较
   * 
   * @param slug - 要检查的 slug
   * @returns 是否已被使用
   */
  async slugExists(slug: string): Promise<boolean> {
    await this.authenticate()

    try {
      const allRealms = await this.client.realms.find()
      
      // 遍历所有 realm，提取 slug 部分
      for (const realm of allRealms) {
        // realm.realm 格式: uuid-slug 或 plain-name
        const parts = realm.realm!.split('-')
        
        // 如果有多个部分，提取 slug（去掉 UUID 部分）
        if (parts.length > 1) {
          const existingSlug = parts.slice(1).join('-')
          if (existingSlug === slug) {
            return true
          }
        } else {
          // 没有 UUID 前缀的 realm（如 master, Dreambuilder）
          if (realm.realm === slug) {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('[Keycloak Admin] Error checking slug:', error)
      // 如果查询失败，为了安全起见返回 true（阻止创建）
      return true
    }
  }

  /**
   * 创建新的 Realm
   */
  async createRealm(
    displayName: string,
    slug: string,
    creatorEmail: string
  ): Promise<RealmCreationResult> {
    await this.authenticate()

    try {
      // 1. 验证 slug
      const validation = this.validateSlug(slug)
      if (!validation.valid) {
        return {
          success: false,
          realmName: '',
          displayName: '',
          clientId: '',
          clientSecret: '',
          userId: '',
          error: validation.error
        }
      }

      // 2. 检查 slug 是否已被使用
      if (await this.slugExists(slug)) {
        return {
          success: false,
          realmName: '',
          displayName: '',
          clientId: '',
          clientSecret: '',
          userId: '',
          error: '该组织标识已被使用，请选择其他标识'
        }
      }

      // 3. 生成 realm 名称
      const realmName = this.generateRealmName(slug)

      // 4. 创建 Realm
      console.log(`[Keycloak Admin] Creating realm: ${realmName}`)
      await this.client.realms.create({
        realm: realmName,
        displayName,
        enabled: true,
        loginWithEmailAllowed: true,
        registrationAllowed: false,
        resetPasswordAllowed: true,
        rememberMe: true,
        verifyEmail: false, // 开发环境暂时关闭
        sslRequired: 'none', // 开发环境
        // 其他配置
        accessTokenLifespan: 1800, // 30 分钟
        ssoSessionIdleTimeout: 1800,
        ssoSessionMaxLifespan: 36000,
      })

      // 5. 在新 Realm 中创建 desktop-portal Client
      this.client.setConfig({ realmName })
      
      const clientResponse = await this.client.clients.create({
        clientId: 'desktop-portal',
        name: 'Desktop Portal',
        enabled: true,
        publicClient: false, // Confidential client
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: false,
        redirectUris: [
          'http://localhost:3000/*',
          'http://localhost/*',
          `http://${slug}.localhost/*`,
        ],
        webOrigins: ['+'], // 允许所有来自 redirectUris 的源
        protocol: 'openid-connect',
        bearerOnly: false,
        consentRequired: false,
        frontchannelLogout: true,
      })

      // 6. 获取 Client Secret
      const clientId = clientResponse.id!
      const clientSecret = await this.client.clients.getClientSecret({
        id: clientId
      })

      // 7. 在新 Realm 中创建用户
      const userResponse = await this.client.users.create({
        username: creatorEmail,
        email: creatorEmail,
        emailVerified: true,
        enabled: true,
        attributes: {
          createdBySystem: ['desktop-portal'],
          organizationRole: ['admin'],
          createdAt: [new Date().toISOString()],
        },
      })

      const userId = userResponse.id!

      // 8. 给用户分配 Realm 管理员角色
      // 获取 realm-admin 客户端角色
      const realmManagementClient = await this.client.clients.find({
        clientId: 'realm-management',
      })

      if (realmManagementClient && realmManagementClient.length > 0) {
        const realmManagementClientId = realmManagementClient[0].id!
        
        // 获取 realm-admin 角色
        const roles = await this.client.clients.listRoles({
          id: realmManagementClientId,
        })

        const realmAdminRole = roles.find(r => r.name === 'realm-admin')
        
        if (realmAdminRole) {
          await this.client.users.addClientRoleMappings({
            id: userId,
            clientUniqueId: realmManagementClientId,
            roles: [{
              id: realmAdminRole.id!,
              name: realmAdminRole.name!,
            }],
          })
        }
      }

      console.log(`[Keycloak Admin] Realm created successfully: ${realmName}`)

      return {
        success: true,
        realmName,
        displayName,
        clientId: 'desktop-portal',
        clientSecret: clientSecret.value || '',
        userId,
      }
    } catch (error) {
      console.error('[Keycloak Admin] Failed to create realm:', error)
      return {
        success: false,
        realmName: '',
        displayName: '',
        clientId: '',
        clientSecret: '',
        userId: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取用户有权限访问的所有 Realm
   * 通过遍历所有 realm，检查用户是否存在于该 realm 中
   * 
   * @param userEmail - 用户邮箱
   */
  async getUserRealms(userEmail: string): Promise<any[]> {
    try {
      await this.authenticate()

      // 获取所有 Realm
      const allRealms = await this.client.realms.find()
      
      // 过滤掉 master realm
      const nonMasterRealms = allRealms.filter((r: any) => 
        r.realm !== 'master' && r.enabled === true
      )

      console.log(`[Keycloak Admin] Found ${nonMasterRealms.length} non-master realms`)

      // 检查每个 realm 中是否存在该用户
      const userRealms = []
      
      for (const realm of nonMasterRealms) {
        try {
          // 切换到该 realm 的上下文
          this.client.setConfig({ realmName: realm.realm! })
          
          // 查找该用户
          const users = await this.client.users.find({
            email: userEmail,
            exact: true,
          })
          
          // 如果用户存在，添加到列表
          if (users.length > 0) {
            console.log(`[Keycloak Admin] User found in realm: ${realm.realm}`)
            userRealms.push(realm)
          }
        } catch (error) {
          console.error(`[Keycloak Admin] Error checking user in realm ${realm.realm}:`, error)
          // 继续检查下一个 realm
        }
      }

      console.log(`[Keycloak Admin] User has access to ${userRealms.length} realms`)
      return userRealms
    } catch (error) {
      console.error('[Keycloak Admin] Error getting user realms:', error)
      return []
    }
  }

  /**
   * 为现有用户设置密码
   */
  async setUserPassword(
    realmName: string,
    userId: string,
    password: string,
    temporary: boolean = false
  ): Promise<boolean> {
    await this.authenticate()
    this.client.setConfig({ realmName })

    try {
      await this.client.users.resetPassword({
        id: userId,
        credential: {
          temporary,
          type: 'password',
          value: password,
        },
      })
      return true
    } catch (error) {
      console.error('[Keycloak Admin] Failed to set password:', error)
      return false
    }
  }

  /**
   * 在指定 Realm 中查找用户（通过邮箱）
   */
  async findUserByEmail(realmName: string, email: string): Promise<any | null> {
    await this.authenticate()
    this.client.setConfig({ realmName })

    try {
      const users = await this.client.users.find({
        email,
        exact: true,
      })

      return users.length > 0 ? users[0] : null
    } catch (error) {
      console.error('[Keycloak Admin] Failed to find user:', error)
      return null
    }
  }
}

// 单例实例
export const keycloakAdmin = new KeycloakAdminService()

