const cloud=require('wx-server-sdk')
const crypto=require('crypto')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId)throw new Error('NO_SHOP')
  if(action==='add'){
    const data=event.data||{}
    const username=(data.username||'').trim()
    const password=(data.password||'').trim()
    if(!username||!password)throw new Error('INVALID_PARAMS')
    const dup=await db.collection('users').where({ username }).count()
    if(dup.total>0)throw new Error('USERNAME_EXISTS')
    const salt=Math.random().toString(36).slice(2)
    const passwordHash=crypto.createHash('md5').update(password+salt).digest('hex')
    const r=await db.collection('users').add({
      data:{
        shopId,
        username,
        passwordHash,
        passwordSalt:salt,
        realName:(data.realName||''),
        phone:(data.phone||''),
        role:'staff',
        status:'active',
        remarks:(data.remark||''),
        createdAt:new Date(),
        updatedAt:new Date(),
        lastLogin:null
      }
    })
    return {id:r._id}
  }
  if(action==='update'){
    const id=event.id
    if(!id)throw new Error('INVALID_ID')
    const data=event.data||{}
    const patch={
      realName:(data.realName||''),
      phone:(data.phone||''),
      remarks:(data.remark||''),
      updatedAt:new Date()
    }
    if(data.password){
      const salt=Math.random().toString(36).slice(2)
      const passwordHash=crypto.createHash('md5').update(data.password+salt).digest('hex')
      patch.passwordSalt=salt
      patch.passwordHash=passwordHash
    }
    await db.collection('users').doc(id).update({data:patch})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id)throw new Error('INVALID_ID')
    await db.collection('users').doc(id).update({data:{status:'inactive',updatedAt:new Date()}})
    return {ok:true}
  }
  throw new Error('UNKNOWN_ACTION')
}
