const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId) return {ok:false,code:'NO_SHOP',message:'未选择店铺'}
  if(action==='add'){
    const data=event.data||{}
    if(!data.name||!data.code) return {ok:false,code:'INVALID_PARAMS',message:'参数不完整'}
    const dup=await db.collection('customers').where({ shopId, code: data.code }).count()
    if(dup.total>0) return {ok:false,code:'CODE_EXISTS',message:'编号已存在'}
    data.shopId=shopId
    data.status=data.status||'active'
    data.createdAt=new Date()
    data.updatedAt=new Date()
    const r=await db.collection('customers').add({data})
    return {ok:true,id:r._id}
  }
  if(action==='update'){
    const id=event.id
    const data=event.data||{}
    if(!id) return {ok:false,code:'INVALID_ID',message:'ID无效'}
    if(data.code){
      const dup=await db.collection('customers').where({ shopId, code: data.code, _id: db.command.neq(id) }).count()
      if(dup.total>0) return {ok:false,code:'CODE_EXISTS',message:'编号已存在'}
    }
    data.updatedAt=new Date()
    await db.collection('customers').doc(id).update({data})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id) return {ok:false,code:'INVALID_ID',message:'ID无效'}
    await db.collection('customers').doc(id).update({data:{status:'inactive',updatedAt:new Date()}})
    return {ok:true}
  }
  return {ok:false,code:'UNKNOWN_ACTION',message:'未知操作'}
}
