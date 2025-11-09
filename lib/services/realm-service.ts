/**
 * Realm 服务 - 统一的 Realm 获取逻辑
 * 
 * 提供通用的 realm 查询功能，避免代码重复
 */

export interface RealmInfo {
  realmName: string
  displayName: string
  enabled: boolean
}

interface FetchRealmsOptions {
  accessToken: string
  keycloakUrl: string
  logPrefix?: string
}

/**
 * 从 Keycloak 获取所有 realms
 */
export async function fetchAllRealms(options: FetchRealmsOptions): Promise<any[]> {
  const { accessToken, keycloakUrl, logPrefix = '[RealmService]' } = options

  const response = await fetch(`${keycloakUrl}/admin/realms`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch realms: ${response.status}`)
  }

  const allRealms = await response.json()
  console.log(`${logPrefix} Found ${allRealms.length} total realms`)

  return allRealms
}

/**
 * 过滤可用的 realms（排除 master 和 Dreambuilder）
 */
export function filterValidRealms(realms: any[]): any[] {
  return realms.filter((r: any) => 
    r.realm !== 'master' && 
    r.realm !== 'Dreambuilder' &&
    r.enabled === true
  )
}

/**
 * 检查单个 realm 是否配置了 DreamBuilder IDP
 */
export async function checkRealmHasDreambuilderIdp(
  realmName: string,
  accessToken: string,
  keycloakUrl: string
): Promise<boolean> {
  try {
    const idpResponse = await fetch(
      `${keycloakUrl}/admin/realms/${realmName}/identity-provider/instances`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!idpResponse.ok) {
      return false
    }

    const idps = await idpResponse.json()
    return idps.some((idp: any) => idp.alias === 'dreambuilder')
  } catch (error) {
    console.error(`[RealmService] Error checking realm ${realmName}:`, error)
    return false
  }
}

/**
 * 验证用户可以通过 SSO 访问的 realms
 */
export async function validateUserAccessToRealms(
  realms: any[],
  accessToken: string,
  keycloakUrl: string,
  logPrefix: string = '[RealmService]'
): Promise<RealmInfo[]> {
  const accessibleRealms: RealmInfo[] = []

  for (const realm of realms) {
    try {
      const hasAccess = await checkRealmHasDreambuilderIdp(
        realm.realm,
        accessToken,
        keycloakUrl
      )

      if (hasAccess) {
        console.log(`${logPrefix} ✓ Realm ${realm.realm} has DreamBuilder IDP`)
        accessibleRealms.push({
          realmName: realm.realm,
          displayName: realm.displayName || realm.realm,
          enabled: realm.enabled,
        })
      }
    } catch (error) {
      console.error(`${logPrefix} Error checking realm ${realm.realm}:`, error)
    }
  }

  console.log(`${logPrefix} User has access to ${accessibleRealms.length} realms`)
  return accessibleRealms
}

/**
 * 获取用户可访问的 realms（完整流程）
 */
export async function getUserAccessibleRealms(
  accessToken: string,
  keycloakUrl: string,
  logPrefix: string = '[RealmService]'
): Promise<RealmInfo[]> {
  console.log(`${logPrefix} Fetching realms with user token...`)

  // 1. 获取所有 realms
  const allRealms = await fetchAllRealms({ accessToken, keycloakUrl, logPrefix })

  // 2. 过滤有效的 realms
  const validRealms = filterValidRealms(allRealms)
  console.log(`${logPrefix} Found ${validRealms.length} valid realms (excluding master/Dreambuilder)`)

  // 3. 验证每个 realm 是否配置了 DreamBuilder IDP
  const accessibleRealms = await validateUserAccessToRealms(
    validRealms,
    accessToken,
    keycloakUrl,
    logPrefix
  )

  return accessibleRealms
}


