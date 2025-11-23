const cloud=require('wx-server-sdk')
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
const db=cloud.database()
exports.main=async(event)=>{
  const action=event.action
  const shopId=(event.shopId||'').trim()
  if(!shopId)throw new Error('NO_SHOP')
  if(action==='getStaffPermissions' || action==='getSettings'){
    const doc=await db.collection('shops').doc(shopId).get()
    return { staffPermissions: (doc.data && doc.data.staffPermissions) || { disableInbound:false, disableOutbound:false } }
  }
  if(action==='updateStaffPermissions'){
    const { disableInbound, disableOutbound } = event
    const doc=await db.collection('shops').doc(shopId).get()
    const old=(doc.data&&doc.data.staffPermissions)||{}
    await db.collection('shops').doc(shopId).update({ data: { staffPermissions: { ...old, disableInbound: !!disableInbound, disableOutbound: !!disableOutbound } } })
    return { ok:true }
  }
  if(action==='updateSettings'){
    const settings=event.settings||{}
    await db.collection('shops').doc(shopId).update({ data: { staffPermissions: settings } })
    return { ok:true }
  }
  throw new Error('UNKNOWN_ACTION')
}