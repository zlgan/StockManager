const cloud=require('wx-server-sdk')
const crypto=require('crypto')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  throw new Error("test error")
  const shopName=(event.shopName||'').trim()
  const username=(event.username||'').trim()
  const password=(event.password||'').trim()
  if(!shopName||!username||!password) return {ok:false,code:'INVALID_PARAMS',message:'参数不完整或格式不正确'}
  const dup=await db.collection('users').where({username}).count()
  if(dup.total>0) return {ok:false,code:'USERNAME_EXISTS',message:'用户名已存在'}
  const wxContext=cloud.getWXContext()
  const openId=wxContext.OPENID||''
  const staffPermissions={
    disableInbound:false,
    disableOutbound:false,
    adminApproval:false,
    hideInboundPrice:false,
    ownRecordsOnly:false,
    hideInventory:false,
    disableProductEdit:false,
    disableStockPoint:false
  }
  const shopAdd=await db.collection('shops').add({data:{shopName,staffPermissions,createdAt:new Date()}})
  const shopId=shopAdd._id
  const salt=Math.random().toString(36).slice(2)
  const passwordHash=crypto.createHash('md5').update(password+salt).digest('hex')
  const userAdd=await db.collection('users').add({data:{shopId,openId,username,passwordHash,passwordSalt:salt,realName:'',role:'owner',status:'active',createdAt:new Date(),updatedAt:new Date(),lastLogin:null}})
  const currentUser={_id:userAdd._id,shopId,username,role:'owner',openId,shopName}
  return {ok:true,currentUser}
}
