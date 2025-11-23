const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId)throw new Error('NO_SHOP')
  if(action==='add'){
    const data=event.data||{}
    if(!data.name||!data.code)throw new Error('INVALID_PARAMS')
    const dup=await db.collection('customers').where({ shopId, code: data.code }).count()
    if(dup.total>0)throw new Error('CODE_EXISTS')
    data.shopId=shopId
    data.status=data.status||'active'
    data.createdAt=new Date()
    data.updatedAt=new Date()
    const r=await db.collection('customers').add({data})
    return {id:r._id}
  }
  if(action==='update'){
    const id=event.id
    const data=event.data||{}
    if(!id)throw new Error('INVALID_ID')
    data.updatedAt=new Date()
    await db.collection('customers').doc(id).update({data})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id)throw new Error('INVALID_ID')
    await db.collection('customers').doc(id).update({data:{status:'inactive',updatedAt:new Date()}})
    return {ok:true}
  }
  throw new Error('UNKNOWN_ACTION')
}