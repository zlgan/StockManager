const cloud=require('wx-server-sdk')
const crypto=require('crypto')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const username=(event.username||'').trim()
  const password=(event.password||'').trim()
  if(!username||!password)throw new Error('INVALID_PARAMS')
  const res=await db.collection('users').where({username}).get()
  if(!res.data||!res.data.length)throw new Error('USER_NOT_FOUND')
  const user=res.data[0]
  const hash=crypto.createHash('md5').update(password+(user.passwordSalt||'')).digest('hex')
  if(hash!==user.passwordHash)throw new Error('PASSWORD_INVALID')
  await db.collection('users').doc(user._id).update({data:{lastLogin:new Date(),updatedAt:new Date()}})
  let shopName=''
  try{
    const shop=await db.collection('shops').doc(user.shopId).get()
    shopName=(shop.data&&shop.data.shopName)||''
  }catch(e){}
  const currentUser={_id:user._id,shopId:user.shopId,username:user.username,role:user.role,openId:user.openId||'',shopName}
  return {currentUser}
}