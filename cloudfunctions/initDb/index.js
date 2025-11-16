const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async () => {
  const results = {}
  try { await db.createCollection('users'); results.users = 'created' } catch (e) { results.users = 'exists' }
  try { await db.createCollection('shops'); results.shops = 'created' } catch (e) { results.shops = 'exists' }
  return results
}