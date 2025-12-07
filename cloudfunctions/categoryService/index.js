const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId) return {ok:false,code:'NO_SHOP',message:'未选择店铺'}
  if(action==='add'){
    const name=(event.name||'').trim()
    if(!name) return {ok:false,code:'INVALID_NAME',message:'类别名称不能为空'}
    const dup=await db.collection('categories').where({shopId,name,status:'active'}).count()
    if(dup.total>0) return {ok:false,code:'DUPLICATE',message:'类别已存在'}
    const r=await db.collection('categories').add({data:{shopId,name,status:'active'}})
    return {ok:true,id:r._id}
  }
  if(action==='update'){
    const id=event.id
    const name=(event.name||'').trim()
    if(!id||!name) return {ok:false,code:'INVALID_PARAMS',message:'参数不完整'}
    await db.collection('categories').doc(id).update({data:{name}})
    return {ok:true}
  }
  if(action==='delete'){
    const id=event.id
    if(!id) return {ok:false,code:'INVALID_ID',message:'ID无效'}
    await db.collection('categories').doc(id).update({data:{status:'inactive'}})
    return {ok:true}
  }
  return {ok:false,code:'UNKNOWN_ACTION',message:'未知操作'}
}
