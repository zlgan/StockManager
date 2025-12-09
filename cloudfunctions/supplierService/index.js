const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
const _=db.command
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId) return {ok:false,code:'NO_SHOP',message:'未选择店铺'}
  if(action==='nextCode'){
    const r=await db.collection('suppliers').where({shopId,code:db.RegExp({regexp:'^SUP\\d{5}$'})}).orderBy('code','desc').limit(1).get()
    const last=(r.data&&r.data[0]&&r.data[0].code)||'SUP00000'
    const num=parseInt(last.slice(3))||0
    const next='SUP'+String(num+1).padStart(5,'0')
    return {ok:true,code:next}
  }
  if(action==='add'){
    const data=event.data||{}
    if(!data.name||!data.code) return {ok:false,code:'INVALID_PARAMS',message:'参数不完整'}
    const dup=await db.collection('suppliers').where({ shopId, code: data.code }).count()
    if(dup.total>0) return {ok:false,code:'CODE_EXISTS',message:'编号已存在'}
    const dupName=await db.collection('suppliers').where({ shopId, name: data.name }).count()
    if(dupName.total>0) return {ok:false,code:'NAME_EXISTS',message:'名称已存在'}
    data.shopId=shopId
    data.status=data.status||'active'
    data.createdAt=new Date()
    data.updatedAt=new Date()
    const r=await db.collection('suppliers').add({data})
    return {ok:true,id:r._id,code:data.code}
  }
  if(action==='update'){
    const id=event.id
    const data=event.data||{}
    if(!id) return {ok:false,code:'INVALID_ID',message:'ID无效'}
    if(data.code){
      const dupCode=await db.collection('suppliers').where({ shopId, code: data.code, _id: _.neq(id) }).count()
      if(dupCode.total>0) return {ok:false,code:'CODE_EXISTS',message:'编号已存在'}
    }
    if(data.name){
      const dupName=await db.collection('suppliers').where({ shopId, name: data.name, _id: _.neq(id) }).count()
      if(dupName.total>0) return {ok:false,code:'NAME_EXISTS',message:'名称已存在'}
    }
    data.updatedAt=new Date()
    await db.collection('suppliers').doc(id).update({data})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id) return {ok:false,code:'INVALID_ID',message:'ID无效'}
    await db.collection('suppliers').doc(id).update({data:{status:'inactive',updatedAt:new Date()}})
    return {ok:true}
  }
  return {ok:false,code:'UNKNOWN_ACTION',message:'未知操作'}
}
