const cloud=require('wx-server-sdk')
const crypto=require('crypto')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const shopName=(event.shopName||'').trim()
  const username=(event.username||'').trim()
  const password=(event.password||'').trim()
  if(!shopName||!username||!password)throw new Error('INVALID_PARAMS')
  const dup=await db.collection('users').where({username}).count()
  if(dup.total>0)throw new Error('USERNAME_EXISTS')
  const wxContext=cloud.getWXContext()
  const openId=wxContext.OPENID||''
  const shopAdd=await db.collection('shops').add({data:{shopName,staffPermissions:{disableInbound:false,disableOutbound:false},createdAt:new Date()}})
  const shopId=shopAdd._id
  const salt=Math.random().toString(36).slice(2)
  const passwordHash=crypto.createHash('md5').update(password+salt).digest('hex')
  const userAdd=await db.collection('users').add({data:{shopId,openId,username,passwordHash,passwordSalt:salt,realName:'',role:'owner',status:'active',createdAt:new Date(),updatedAt:new Date(),lastLogin:null}})
  const currentUser={_id:userAdd._id,shopId,username,role:'owner',openId,shopName}
  return {currentUser}
}