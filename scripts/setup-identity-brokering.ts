/**
 * 自动配置 Identity Brokering
 * 
 * 此脚本将：
 * 1. 在 master realm 中创建 broker clients
 * 2. 在组织 realms 中配置 Identity Provider
 * 3. 配置 attribute mappers
 */

import { keycloakAdmin } from '../lib/keycloak/admin-client'

const organizationRealms = [
  { realm: 'Dreambuilder', clientId: 'dreambuilder-broker' },
  { realm: 'df6c0e9c-techinno', clientId: 'techinno-broker' },
  { realm: '81ada61e-macstyle', clientId: 'macstyle-broker' },
]

async function setupIdentityBrokering() {
  try {
    console.log('🚀 开始配置 Identity Brokering...\n')

    // 步骤 1: 在 master realm 中创建 broker clients
    console.log('步骤 1: 在 master realm 中创建 broker clients')
    console.log('=' .repeat(50))
    
    for (const org of organizationRealms) {
      console.log(`\n创建 ${org.clientId}...`)
      
      try {
        const clientSecret = await keycloakAdmin.createBrokerClient('master', {
          clientId: org.clientId,
          name: `${org.realm} Identity Broker`,
          description: `Identity Provider for ${org.realm} realm`,
          redirectUris: [
            `http://localhost:8080/realms/${org.realm}/broker/master-idp/endpoint`,
            'http://localhost:3000/*'
          ],
          webOrigins: [
            'http://localhost:8080',
            'http://localhost:3000'
          ]
        })
        
        console.log(`✅ ${org.clientId} 创建成功`)
        console.log(`   Client Secret: ${clientSecret}`)
        
        // 保存 client secret 供后续使用
        org['clientSecret'] = clientSecret
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️  ${org.clientId} 已存在，跳过创建`)
          // 获取现有 client 的 secret
          const existingSecret = await keycloakAdmin.getClientSecret('master', org.clientId)
          org['clientSecret'] = existingSecret
          console.log(`   使用现有 Client Secret: ${existingSecret}`)
        } else {
          throw error
        }
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ 步骤 1 完成\n')

    // 步骤 2: 在组织 realms 中配置 Identity Provider
    console.log('步骤 2: 在组织 realms 中配置 Identity Provider')
    console.log('=' .repeat(50))
    
    for (const org of organizationRealms) {
      console.log(`\n在 ${org.realm} 中配置 master-idp...`)
      
      try {
        await keycloakAdmin.configureMasterIdP(
          org.realm,
          org.clientId,
          org['clientSecret']
        )
        
        console.log(`✅ ${org.realm} 的 Identity Provider 配置成功`)
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️  ${org.realm} 的 Identity Provider 已存在`)
        } else {
          console.error(`❌ 配置失败:`, error.message)
        }
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ 步骤 2 完成\n')

    // 步骤 3: 配置 attribute mappers
    console.log('步骤 3: 配置 attribute mappers')
    console.log('=' .repeat(50))
    
    for (const org of organizationRealms) {
      console.log(`\n为 ${org.realm} 配置 mappers...`)
      
      try {
        await keycloakAdmin.configureIdPMappers(org.realm, 'master-idp')
        console.log(`✅ ${org.realm} 的 mappers 配置成功`)
      } catch (error) {
        console.error(`❌ 配置失败:`, error.message)
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ 步骤 3 完成\n')

    console.log('🎉 Identity Brokering 配置完成！')
    console.log('\n下一步：')
    console.log('1. 访问任意组织的登录页面')
    console.log('2. 点击 "统一登录 (Master SSO)" 按钮')
    console.log('3. 在 master realm 登录')
    console.log('4. 自动返回组织并完成认证\n')
    
  } catch (error) {
    console.error('\n❌ 配置过程中出现错误:', error)
    process.exit(1)
  }
}

// 运行脚本
setupIdentityBrokering()


