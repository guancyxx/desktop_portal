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
   * 配置 Authentication Flow，禁用首次登录的 review profile
   * 
   * @param realmName - 要配置的 realm
   */
  async disableReviewProfile(realmName: string): Promise<boolean> {
    try {
      await this.authenticate()
      this.client.setConfig({ realmName })

      console.log(`[Keycloak Admin] Disabling review profile for realm: ${realmName}`)

      // 获取 "first broker login" flow
      const flows = await this.client.authenticationManagement.getFlows()
      const firstBrokerLoginFlow = flows.find((f: any) => f.alias === 'first broker login')

      if (!firstBrokerLoginFlow) {
        console.warn(`[Keycloak Admin] First broker login flow not found in realm: ${realmName}`)
        return false
      }

      // 获取该 flow 的所有执行步骤
      const executions = await this.client.authenticationManagement.getExecutions({
        flow: 'first broker login'
      })

      console.log(`[Keycloak Admin] Found ${executions.length} executions in first broker login flow`)

      // 找到 "review profile config" 执行步骤并禁用它
      let reviewProfileFound = false
      for (const execution of executions) {
        console.log(`[Keycloak Admin] Execution: ${execution.displayName} (${execution.providerId}) - ${execution.requirement}`)
        
        if (execution.displayName === 'Review Profile' || 
            execution.providerId === 'idp-review-profile') {
          reviewProfileFound = true
          
          // 如果已经是 DISABLED，跳过
          if (execution.requirement === 'DISABLED') {
            console.log(`[Keycloak Admin] Review Profile is already disabled`)
            continue
          }
          
          // 使用 Keycloak Admin Client 的正确方法
          // updateExecution 需要使用 flow alias 而不是 realm
          if (execution.id) {
            try {
              // 直接修改 execution 对象的 requirement
              execution.requirement = 'DISABLED'
              
              // 使用 updateExecution API - 第一个参数是 flow alias
              await this.client.authenticationManagement.updateExecution(
                { flow: 'first broker login' },
                execution
              )
              console.log(`[Keycloak Admin] Successfully disabled review profile step (ID: ${execution.id})`)
            } catch (updateError) {
              console.error(`[Keycloak Admin] Failed to update execution:`, updateError)
              throw updateError
            }
          } else {
            console.warn(`[Keycloak Admin] Execution has no ID, cannot update`)
          }
        }
      }
      
      if (!reviewProfileFound) {
        console.warn(`[Keycloak Admin] Review Profile step not found in first broker login flow`)
      }

      return true
    } catch (error) {
      console.error('[Keycloak Admin] Failed to disable review profile:', error)
      if (error instanceof Error) {
        console.error('[Keycloak Admin] Error details:', error.message, error.stack)
      }
      return false
    }
  }

  /**
   * 配置 Identity Provider（身份联邦）
   * 让新 realm 使用 master realm 作为身份提供商
   * 
   * @param realmName - 要配置的 realm
   */
  async setupIdentityBrokering(realmName: string): Promise<boolean> {
    try {
      await this.authenticate()
      this.client.setConfig({ realmName })

      // 使用外部可访问的 URL（浏览器可以访问的）
      const keycloakExternalUrl = process.env.KEYCLOAK_EXTERNAL_URL || 'http://localhost:8080'
      const masterRealmUrl = `${keycloakExternalUrl}/realms/Dreambuilder`
      const brokerClientId = `${realmName}-broker`

      console.log(`[Keycloak Admin] Setting up identity brokering for ${realmName}`)
      console.log(`[Keycloak Admin] Master realm URL: ${masterRealmUrl}`)

      // 1. 在 master realm (Dreambuilder) 中创建一个 broker client
      this.client.setConfig({ realmName: 'Dreambuilder' })
      
      let brokerClient
      try {
        const keycloakExternalUrl = process.env.KEYCLOAK_EXTERNAL_URL || 'http://localhost:8080'
        const redirectUris = [
          `${keycloakExternalUrl}/realms/${realmName}/broker/dreambuilder/endpoint`,
          `${keycloakExternalUrl}/realms/${realmName}/broker/dreambuilder/endpoint/*`,
        ]

        // 检查 client 是否已存在
        const existingClients = await this.client.clients.find({
          clientId: brokerClientId
        })
        
        if (existingClients && existingClients.length > 0) {
          brokerClient = existingClients[0]
          console.log(`[Keycloak Admin] Broker client already exists: ${brokerClientId}`)
          
          // 更新 redirect URIs（添加新的 realm 的 redirect URI）
          const currentRedirectUris = brokerClient.redirectUris || []
          const newRedirectUris = Array.from(new Set([...currentRedirectUris, ...redirectUris]))
          
          await this.client.clients.update(
            { id: brokerClient.id! },
            {
              ...brokerClient,
              redirectUris: newRedirectUris,
            }
          )
          console.log(`[Keycloak Admin] Updated broker client redirect URIs`)
        } else {
          // 创建新的 broker client
          const clientResponse = await this.client.clients.create({
            clientId: brokerClientId,
            name: `Broker for ${realmName}`,
            enabled: true,
            publicClient: false,
            standardFlowEnabled: true,
            directAccessGrantsEnabled: false,
            serviceAccountsEnabled: false,
            redirectUris,
            webOrigins: ['+'],
            protocol: 'openid-connect',
          })

          // 获取创建的 client
          const clients = await this.client.clients.find({
            clientId: brokerClientId
          })
          brokerClient = clients[0]
          console.log(`[Keycloak Admin] Created broker client: ${brokerClientId}`)
        }
      } catch (error) {
        console.error('[Keycloak Admin] Failed to create/update broker client:', error)
        return false
      }

      // 获取 client secret
      const brokerClientSecret = await this.client.clients.getClientSecret({
        id: brokerClient.id!
      })

      // 2. 在新 realm 中配置 Identity Provider
      this.client.setConfig({ realmName })

      const idpConfig = {
        alias: 'dreambuilder',
        displayName: 'DreamBuilder SSO',
        providerId: 'keycloak-oidc',
        enabled: true,
        trustEmail: true,
        storeToken: true,
        addReadTokenRoleOnCreate: false,
        authenticateByDefault: false,
        linkOnly: false,
        // 使用自动创建用户的流程，跳过 review profile
        firstBrokerLoginFlowAlias: 'first broker login',
        config: {
          clientId: brokerClientId,
          clientSecret: brokerClientSecret.value || '',
          authorizationUrl: `${masterRealmUrl}/protocol/openid-connect/auth`,
          tokenUrl: `${masterRealmUrl}/protocol/openid-connect/token`,
          logoutUrl: `${masterRealmUrl}/protocol/openid-connect/logout`,
          userInfoUrl: `${masterRealmUrl}/protocol/openid-connect/userinfo`,
          issuer: masterRealmUrl,
          jwksUrl: `${masterRealmUrl}/protocol/openid-connect/certs`,
          validateSignature: 'true',
          useJwksUrl: 'true',
          defaultScope: 'openid email profile',
          syncMode: 'FORCE',
          backchannelSupported: 'true',
          // 禁用 update profile on first login
          'guiOrder': '',
          'hideOnLoginPage': 'false',
        }
      }

      try {
        // 检查 IDP 是否已存在
        const existingIdps = await this.client.identityProviders.find()
        const existingIdp = existingIdps.find((idp: any) => idp.alias === 'dreambuilder')

        if (existingIdp) {
          // 更新现有 IDP
          await this.client.identityProviders.update(
            { alias: 'dreambuilder' },
            idpConfig
          )
          console.log(`[Keycloak Admin] Updated identity provider: dreambuilder`)
        } else {
          // 创建新 IDP
          await this.client.identityProviders.create(idpConfig)
          console.log(`[Keycloak Admin] Created identity provider: dreambuilder`)
        }
      } catch (error) {
        console.error('[Keycloak Admin] Failed to configure identity provider:', error)
        return false
      }

      // 3. 配置 Identity Provider Mapper（映射用户属性）
      try {
        const mappers = [
          {
            name: 'email',
            identityProviderAlias: 'dreambuilder',
            identityProviderMapper: 'oidc-user-attribute-idp-mapper',
            config: {
              'claim': 'email',
              'user.attribute': 'email',
              'syncMode': 'INHERIT'
            }
          },
          {
            name: 'username',
            identityProviderAlias: 'dreambuilder',
            identityProviderMapper: 'oidc-username-idp-mapper',
            config: {
              'template': '${CLAIM.preferred_username}',
              'syncMode': 'INHERIT'
            }
          },
          {
            name: 'firstName',
            identityProviderAlias: 'dreambuilder',
            identityProviderMapper: 'oidc-user-attribute-idp-mapper',
            config: {
              'claim': 'given_name',
              'user.attribute': 'firstName',
              'syncMode': 'INHERIT'
            }
          },
          {
            name: 'lastName',
            identityProviderAlias: 'dreambuilder',
            identityProviderMapper: 'oidc-user-attribute-idp-mapper',
            config: {
              'claim': 'family_name',
              'user.attribute': 'lastName',
              'syncMode': 'INHERIT'
            }
          }
        ]

        for (const mapper of mappers) {
          try {
            await this.client.identityProviders.createMapper({
              alias: 'dreambuilder',
              ...mapper
            })
          } catch (error) {
            // Mapper 可能已存在，忽略错误
            console.log(`[Keycloak Admin] Mapper ${mapper.name} already exists or failed to create`)
          }
        }

        console.log(`[Keycloak Admin] Configured identity provider mappers`)
      } catch (error) {
        console.error('[Keycloak Admin] Failed to configure mappers:', error)
        // 不阻断流程，继续执行
      }

      console.log(`[Keycloak Admin] Identity brokering setup completed for ${realmName}`)
      return true
    } catch (error) {
      console.error('[Keycloak Admin] Failed to setup identity brokering:', error)
      return false
    }
  }

  /**
   * 创建新的 Realm
   * @param displayName - 组织显示名称
   * @param slug - 组织标识
   * @param userIdentifier - 用户标识（email 或 username）
   */
  async createRealm(
    displayName: string,
    slug: string,
    userIdentifier: string
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
        // 禁用首次登录时的 review profile 流程
        attributes: {
          'frontendUrl': '',
          'userProfileEnabled': 'false',
        },
        // 其他配置
        accessTokenLifespan: 1800, // 30 分钟
        ssoSessionIdleTimeout: 1800,
        ssoSessionMaxLifespan: 36000,
      })

      // 5. 禁用 Review Profile 流程
      console.log(`[Keycloak Admin] Disabling review profile...`)
      const disableSuccess = await this.disableReviewProfile(realmName)
      if (!disableSuccess) {
        console.warn(`[Keycloak Admin] Failed to disable review profile, but continuing...`)
      }

      // 6. 配置 Identity Brokering（身份联邦）
      console.log(`[Keycloak Admin] Configuring identity brokering...`)
      const brokeringSuccess = await this.setupIdentityBrokering(realmName)
      if (!brokeringSuccess) {
        console.warn(`[Keycloak Admin] Identity brokering setup failed, but continuing...`)
      }

      // 7. 在新 Realm 中创建 desktop-portal Client
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

      // 8. 获取 Client Secret
      const clientId = clientResponse.id!
      const clientSecret = await this.client.clients.getClientSecret({
        id: clientId
      })

      // 9. 不再在新 realm 中创建独立用户，因为使用了 Identity Brokering
      // 用户将通过 Dreambuilder realm 自动同步
      console.log(`[Keycloak Admin] User will be auto-provisioned via Identity Brokering`)

      // 返回一个临时的 userId（将在首次登录时自动创建）
      const userId = 'auto-provisioned'

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
   * 
   * 在 Identity Brokering 架构下，我们返回所有配置了 DreamBuilder IDP 的 realm
   * 因为所有用户都通过 DreamBuilder realm 认证，然后可以 SSO 到其他 realm
   * 
   * @param userEmail - 用户邮箱
   */
  async getUserRealms(userEmail: string): Promise<any[]> {
    try {
      console.log(`[Keycloak Admin] Getting realms for user: ${userEmail}`)
      
      // 强制重新认证以确保token有效
      this.initialized = false
      await this.authenticate()

      // 获取所有 Realm
      console.log('[Keycloak Admin] Fetching all realms...')
      const allRealms = await this.client.realms.find()
      
      console.log(`[Keycloak Admin] Total realms found: ${allRealms.length}`)
      
      // 过滤掉 master 和 Dreambuilder realm
      const nonMasterRealms = allRealms.filter((r: any) => 
        r.realm !== 'master' && 
        r.realm !== 'Dreambuilder' &&
        r.enabled === true
      )

      console.log(`[Keycloak Admin] Non-master realms: ${nonMasterRealms.length}`)
      console.log(`[Keycloak Admin] Realm names: ${nonMasterRealms.map((r: any) => r.realm).join(', ')}`)

      // 检查每个 realm 是否配置了 DreamBuilder Identity Provider
      const accessibleRealms = []
      
      for (const realm of nonMasterRealms) {
        try {
          console.log(`[Keycloak Admin] Checking realm: ${realm.realm}`)
          
          // 切换到该 realm 的上下文
          this.client.setConfig({ realmName: realm.realm! })
          
          // 检查是否有 dreambuilder IDP
          const idps = await this.client.identityProviders.find()
          console.log(`[Keycloak Admin] Realm ${realm.realm} has ${idps.length} IDPs`)
          
          const hasDreambuilderIdp = idps.some((idp: any) => idp.alias === 'dreambuilder')
          
          if (hasDreambuilderIdp) {
            console.log(`[Keycloak Admin] ✓ Realm ${realm.realm} has DreamBuilder IDP - accessible via SSO`)
            accessibleRealms.push(realm)
          } else {
            console.log(`[Keycloak Admin] Realm ${realm.realm} does not have DreamBuilder IDP, checking direct user access...`)
            // 如果没有 IDP，检查用户是否直接存在于该 realm
            const users = await this.client.users.find({
              email: userEmail,
              exact: true,
            })
            
            if (users.length > 0) {
              console.log(`[Keycloak Admin] ✓ User found directly in realm: ${realm.realm}`)
              accessibleRealms.push(realm)
            } else {
              console.log(`[Keycloak Admin] ✗ User not found in realm: ${realm.realm}`)
            }
          }
        } catch (error) {
          console.error(`[Keycloak Admin] Error checking realm ${realm.realm}:`, error)
          if (error instanceof Error) {
            console.error(`[Keycloak Admin] Error details: ${error.message}`)
          }
          // 继续检查下一个 realm
        }
      }

      console.log(`[Keycloak Admin] Final result: User has access to ${accessibleRealms.length} realms`)
      console.log(`[Keycloak Admin] Accessible realms: ${accessibleRealms.map((r: any) => r.realm).join(', ')}`)
      
      return accessibleRealms
    } catch (error) {
      console.error('[Keycloak Admin] Error getting user realms:', error)
      if (error instanceof Error) {
        console.error('[Keycloak Admin] Error details:', error.message, error.stack)
      }
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

  /**
   * 获取指定 Realm 中 desktop-portal client 的密钥
   */
  async getClientSecret(realmName: string): Promise<string | null> {
    try {
      await this.authenticate()
      this.client.setConfig({ realmName })

      console.log(`[Keycloak Admin] Getting client secret for realm: ${realmName}`)

      // 查找 desktop-portal client
      const clients = await this.client.clients.find({
        clientId: 'desktop-portal'
      })

      if (!clients || clients.length === 0) {
        console.error(`[Keycloak Admin] desktop-portal client not found in realm: ${realmName}`)
        return null
      }

      const client = clients[0]
      
      // 获取 client secret
      const secretResponse = await this.client.clients.getClientSecret({
        id: client.id!
      })

      console.log(`[Keycloak Admin] Successfully retrieved client secret for realm: ${realmName}`)
      return secretResponse.value || null
    } catch (error) {
      console.error(`[Keycloak Admin] Failed to get client secret for realm ${realmName}:`, error)
      return null
    }
  }
}

// 单例实例
export const keycloakAdmin = new KeycloakAdminService()

