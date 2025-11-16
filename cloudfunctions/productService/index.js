const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId)throw new Error('NO_SHOP')
  if(action==='add'){
    const data=event.data||{}
    data.shopId=shopId
    data.createdAt=new Date()
    data.updatedAt=new Date()
    if(typeof data.isEnabled==='undefined')data.isEnabled=true
    const r=await db.collection('products').add({data})
    return {id:r._id}
  }
  if(action==='update'){
    const id=event.id
    const data=event.data||{}
    if(!id)throw new Error('INVALID_ID')
    data.updatedAt=new Date()
    await db.collection('products').doc(id).update({data})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id)throw new Error('INVALID_ID')
    await db.collection('products').doc(id).update({data:{isEnabled:false,updatedAt:new Date()}})
    return {ok:true}
  }
  throw new Error('UNKNOWN_ACTION')
}