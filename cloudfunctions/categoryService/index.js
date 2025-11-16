const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId)throw new Error('NO_SHOP')
  if(action==='add'){
    const name=(event.name||'').trim()
    if(!name)throw new Error('INVALID_NAME')
    const dup=await db.collection('categories').where({shopId,name,status:'active'}).count()
    if(dup.total>0)throw new Error('DUPLICATE')
    const r=await db.collection('categories').add({data:{shopId,name,status:'active'}})
    return {id:r._id}
  }
  if(action==='update'){
    const id=event.id
    const name=(event.name||'').trim()
    if(!id||!name)throw new Error('INVALID_PARAMS')
    await db.collection('categories').doc(id).update({data:{name}})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id)throw new Error('INVALID_ID')
    await db.collection('categories').doc(id).update({data:{status:'inactive'}})
    return {ok:true}
  }
  throw new Error('UNKNOWN_ACTION')
}