//导入云开发 SDK,cloud 变量成为操作云开发功能的入口对象
const cloud=require('wx-server-sdk')
//这个配置表示云函数会自动使用调用该云函数的小程序客户端所在的环境
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV})
//获取数据库实例
const db=cloud.database()
//获取数据库操作指令构造器
const _=db.command
async function getProductByName(shopId,name){
  const r=await db.collection('products').where({shopId,name}).limit(1).get()
  return r.data&&r.data[0]
}

//生成出库入库单号IN202512020001
async function ensureBillNo(shopId,direction,dateStr){
  const prefix=direction==='in'?'IN':'OUT'
  const day=dateStr.slice(0,10).replace(/-/g,'')
  const startNo=prefix+day+'0000'
  const endNo=prefix+day+'9999'
  const r=await db.collection('stockBills').where({shopId,direction,billNo:_.gte(startNo).and(_.lte(endNo))}).count()
  const seq=('0000'+(r.total+1)).slice(-4)
  return prefix+day+seq
}
async function updateStatsMonthly(shopId,year,month,delta){
  const id=shopId+'_'+year+'_'+month
  const col=db.collection('statsMonthly')
  const got=await col.where({shopId,year,month}).limit(1).get()
  if(!got.data||got.data.length===0){
    await col.add({data:{shopId,year,month,inboundAmount:0,inboundCount:0,outboundAmount:0,outboundCount:0,profit:0,generatedAt:new Date(),source:'onConfirm'}})
  }
  const inc={}
  Object.keys(delta).forEach(k=>{inc[k]=_.inc(delta[k])})
  await col.where({shopId,year,month}).update({data:inc})
}
async function applyInbound(shopId,item,createdBy,billRef){
  const balCol=db.collection('inventoryBalances')
  const now=new Date()
  let bal=await balCol.where({shopId,productId:item.productId}).limit(1).get()
  bal=bal.data&&bal.data[0]
  const oldQty=bal?bal.quantity:0
  const oldAvg=bal?bal.avgCost:0
  //old total coast
  const oldTC=oldQty*oldAvg
  const newQty=oldQty+item.quantity
  //new total coast
  const newTC=oldTC+item.quantity*item.unitPrice
  //新的加权平均价
  const newAvg=newQty>0?newTC/newQty:0
  if(bal){
    await balCol.doc(bal._id).update({data:{quantity:newQty,avgCost:newAvg,totalCost:newTC,updatedAt:now,updatedBy:createdBy}})
  }else{
    await balCol.add({data:{shopId,productId:item.productId,productName:item.productName,quantity:newQty,avgCost:newAvg,totalCost:newTC,updatedAt:now,updatedBy:createdBy}})
  }
  const led={shopId,productId:item.productId,productName:item.productName,direction:'in',quantity:item.quantity,unitPrice:item.unitPrice,amount:item.quantity*item.unitPrice,balanceQuantity:newQty,balanceAmount:newTC,billRef,createdAt:now,createdBy:createdBy,ext: billRef&&billRef.extAdjust? {adjustType: billRef.extAdjust}: undefined}
  await db.collection('stockLedger').add({data:led})
  const y=now.getFullYear(),m=now.getMonth()+1
  await updateStatsMonthly(shopId,y,m,{inboundAmount:item.quantity*item.unitPrice,inboundCount:0})
}
async function applyOutbound(shopId,item,createdBy,billRef){
  const balCol=db.collection('inventoryBalances')
  const now=new Date()
  let bal=await balCol.where({shopId,productId:item.productId}).limit(1).get()
  bal=bal.data&&bal.data[0]
  const oldQty=bal?bal.quantity:0
  const avg=bal?bal.avgCost:0
  const cost=item.quantity*avg
  const newQty=oldQty-item.quantity
  const newTC=newQty*avg
  if(newQty<0)throw new Error('INSUFFICIENT_STOCK')
  if(bal){
    await balCol.doc(bal._id).update({data:{quantity:newQty,totalCost:newTC,updatedAt:now,updatedBy:createdBy}})
  }else{
    throw new Error('NO_STOCK')
  }
  const led={shopId,productId:item.productId,productName:item.productName,direction:'out',quantity:item.quantity,unitPrice:item.unitPrice,amount:item.quantity*item.unitPrice,balanceQuantity:newQty,balanceAmount:newTC,billRef,createdAt:now,createdBy:createdBy,ext: billRef&&billRef.extAdjust? {adjustType: billRef.extAdjust}: undefined}
  await db.collection('stockLedger').add({data:led})
  const y=now.getFullYear(),m=now.getMonth()+1
  await updateStatsMonthly(shopId,y,m,{outboundAmount:item.quantity*item.unitPrice,profit:item.quantity*item.unitPrice-cost,outboundCount:0})
}
exports.main=async(event)=>{
  try{
  const action=event.action
  if(action==='homeOverview'){
    const {shopId}=event
    const day=new Date();const start=new Date(day.getFullYear(),day.getMonth(),day.getDate());const end=new Date(day.getFullYear(),day.getMonth(),day.getDate()+1)
    const billsCol=db.collection('stockBills')
    const inCnt=await billsCol.where({shopId,direction:'in',billDate:_.gte(start).and(_.lt(end))}).count()
    const outCnt=await billsCol.where({shopId,direction:'out',billDate:_.gte(start).and(_.lt(end))}).count()
    const inAmt=await billsCol.where({shopId,direction:'in',billDate:_.gte(start).and(_.lt(end))}).field({totals:true}).get()
    const outAmt=await billsCol.where({shopId,direction:'out',billDate:_.gte(start).and(_.lt(end))}).field({totals:true}).get()
    const sumIn=(inAmt.data||[]).reduce((s,x)=>s+(x.totals&&x.totals.totalAmount||0),0)
    const sumOut=(outAmt.data||[]).reduce((s,x)=>s+(x.totals&&x.totals.totalAmount||0),0)
    const ledger=await db.collection('stockLedger').where({shopId}).orderBy('createdAt','desc').limit(10).get()
    return {today:{inbound:{count:inCnt.total,amount:sumIn},outbound:{count:outCnt.total,amount:sumOut}},recent:ledger.data||[]}
  }
  if(action==='createBill'){
    const {shopId,direction,billType,billDate,counterparty,items,createdBy,remarks}=event
    const now=new Date()
    const billNo=await ensureBillNo(shopId,direction,billDate||now.toISOString())
    let totalQty=0,totalAmt=0
    const billAdd=await db.collection('stockBills').add({data:{shopId,direction,billNo,billType,billDate:new Date(billDate||now),counterparty,totals:{totalQuantity:0,totalAmount:0},remarks:remarks||'',status:'confirmed',approvalStatus:'approved',createdAt:now,updatedAt:now,createdBy}})
    const billId=billAdd._id
    for(const raw of items){
      let pid=raw.productId, pname=raw.productName
      if(!pid){
        const p=await getProductByName(shopId,pname)
        if(!p)throw new Error('PRODUCT_NOT_FOUND')
        pid=p._id; pname=p.name
      }
      const bal=await db.collection('inventoryBalances').where({shopId,productId:pid}).limit(1).get()
      const b=bal.data&&bal.data[0]
      const before=b?b.quantity:0
      const after=direction==='in'?before+raw.quantity:before-raw.quantity
      await db.collection('stockItems').add({data:{shopId,billId,direction,lineNo:raw.lineNo||1,productId:pid,productName:pname,productCode:raw.productCode||'',unit:raw.unit||'',specification:raw.specification||'',quantity:raw.quantity,unitPrice:raw.unitPrice,amount:raw.quantity*raw.unitPrice,stockBefore:before,stockAfter:after,createdAt:now,updatedAt:now,createdBy}})
      totalQty+=raw.quantity; totalAmt+=raw.quantity*raw.unitPrice
      const ref={billId,billNo,lineNo:raw.lineNo||1}
      if(direction==='in') await applyInbound(shopId,{productId:pid,productName:pname,quantity:raw.quantity,unitPrice:raw.unitPrice},createdBy,ref)
      else await applyOutbound(shopId,{productId:pid,productName:pname,quantity:raw.quantity,unitPrice:raw.unitPrice},createdBy,ref)
    }
    await db.collection('stockBills').doc(billId).update({data:{totals:{totalQuantity:totalQty,totalAmount:totalAmt}}})
    const y=now.getFullYear(),m=now.getMonth()+1
    if(direction==='in') await updateStatsMonthly(shopId,y,m,{inboundCount:1})
    else await updateStatsMonthly(shopId,y,m,{outboundCount:1})
    return {billId,billNo}
  }
  if(action==='adjustBillDelta'){
    const {billId,newItems,createdBy,remarks}=event
    console.log('adjustBillDelta start',{billId,len:(newItems&&newItems.length)||0})
    const bill=await db.collection('stockBills').doc(billId).get()
    const shopId=bill.data.shopId
    const direction=bill.data.direction
    const oldItems=await db.collection('stockItems').where({billId}).get()
    console.log('adjustBillDelta fetched oldItems',{count:(oldItems.data&&oldItems.data.length)||0})
    const mapOld={};
    (oldItems.data||[]).forEach(it=>{mapOld[it.productId]=it})
    let totalQty=0,totalAmt=0
    for(const raw of newItems){
      console.log('adjustBillDelta iterate',{pid:raw.productId,pname:raw.productName,qty:raw.quantity,price:raw.unitPrice})
      let pid=raw.productId, pname=raw.productName
      if(!pid){
        const p=await getProductByName(shopId,pname)
        if(!p)throw new Error('PRODUCT_NOT_FOUND')
        pid=p._id; pname=p.name
      }
      const prev=mapOld[pid]
      const oldQty=prev?prev.quantity:0
      const oldPrice=prev?prev.unitPrice:0
      const deltaQty=raw.quantity-oldQty
      const deltaAmt=raw.quantity*raw.unitPrice - oldQty*oldPrice
      if(deltaQty!==0){
        const ref={billId,billNo:bill.data.billNo,lineNo:raw.lineNo||1,extAdjust:'delta'}
        if(direction==='in'){
          const qty=Math.abs(deltaQty)
          const price=deltaQty>0?raw.unitPrice:oldPrice
          await applyInbound(shopId,{productId:pid,productName:pname,quantity:deltaQty>0?qty:-qty,unitPrice:price*(deltaQty>0?1:-1)},createdBy,ref)
        }else{
          const qty=Math.abs(deltaQty)
          const price=raw.unitPrice
          if(deltaQty>0) await applyOutbound(shopId,{productId:pid,productName:pname,quantity:qty,unitPrice:price},createdBy,ref)
          else{
            const balCol=db.collection('inventoryBalances')
            let bal=await balCol.where({shopId,productId:pid}).limit(1).get(); bal=bal.data&&bal.data[0]
            const avg=bal?bal.avgCost:0
            const now=new Date()
            const newQty=(bal?bal.quantity:0)+qty
            const newTC=newQty*avg
            if(bal) await balCol.doc(bal._id).update({data:{quantity:newQty,totalCost:newTC,updatedAt:now,updatedBy:createdBy}})
            else await balCol.add({data:{shopId,productId:pid,productName:pname,quantity:newQty,avgCost:avg,totalCost:newTC,updatedAt:now,updatedBy:createdBy}})
            await db.collection('stockLedger').add({data:{shopId,productId:pid,productName:pname,direction:'out',quantity:-qty,unitPrice:price,amount:-qty*price,balanceQuantity:newQty,balanceAmount:newTC,billRef:ref,createdAt:now,createdBy:createdBy,ext:{adjustType:'delta'}}})
            const y=now.getFullYear(),m=now.getMonth()+1
            await updateStatsMonthly(shopId,y,m,{outboundAmount:-qty*price,profit:-(qty*price - qty*avg)})
          }
        }
      }
      const costAdj=deltaAmt - (deltaQty*raw.unitPrice)
      totalQty+=raw.quantity; totalAmt+=raw.quantity*raw.unitPrice
      await db.collection('stockItems').where({billId,productId:pid}).update({data:{quantity:raw.quantity,unitPrice:raw.unitPrice,amount:raw.quantity*raw.unitPrice,updatedAt:new Date()}})
      if(!prev){
        const bal=await db.collection('inventoryBalances').where({shopId,productId:pid}).limit(1).get(); const b=bal.data&&bal.data[0]
        const before=b?b.quantity:0
        await db.collection('stockItems').add({data:{shopId,billId,direction,lineNo:raw.lineNo||1,productId:pid,productName:pname,productCode:raw.productCode||'',unit:raw.unit||'',specification:raw.specification||'',quantity:raw.quantity,unitPrice:raw.unitPrice,amount:raw.quantity*raw.unitPrice,stockBefore:before,stockAfter:before+(direction==='in'?raw.quantity:-raw.quantity),createdAt:new Date(),updatedAt:new Date(),createdBy}})
      }
      if(costAdj!==0 && direction==='in'){
        const balCol=db.collection('inventoryBalances')
        let bal=await balCol.where({shopId,productId:pid}).limit(1).get(); bal=bal.data&&bal.data[0]
        const now=new Date()
        const qty=bal?bal.quantity:0
        const tc=(bal?bal.avgCost:0)*qty + costAdj
        const avg=qty>0?tc/qty:0
        if(bal) await balCol.doc(bal._id).update({data:{totalCost:tc,avgCost:avg,updatedAt:now,updatedBy:createdBy}})
        else await balCol.add({data:{shopId,productId:pid,productName:pname,quantity:qty,avgCost:avg,totalCost:tc,updatedAt:now,updatedBy:createdBy}})
        await db.collection('stockLedger').add({data:{shopId,productId:pid,productName:pname,direction:'in',quantity:0,unitPrice:raw.unitPrice,amount:costAdj,balanceQuantity:qty,balanceAmount:tc,billRef:{billId,billNo:bill.data.billNo,lineNo:raw.lineNo||1},createdAt:now,createdBy:createdBy,ext:{adjustType:'costAdj'}}})
        const y=now.getFullYear(),m=now.getMonth()+1
        await updateStatsMonthly(shopId,y,m,{inboundAmount:costAdj})
      }
    }
    console.log('adjustBillDelta done totals',{totalQty,totalAmt})
    await db.collection('stockBills').doc(billId).update({data:{totals:{totalQuantity:totalQty,totalAmount:totalAmt},remarks:remarks||bill.data.remarks||'',updatedAt:new Date()}})
    return {ok:true}
  }
  if(action==='queryBills'){
    const {shopId,startDate,endDate,billTypeIndex,supplierName,customerName,keyword,page,pageSize}=event
    const base={shopId}
    if(billTypeIndex===1) base.direction='in'
    else if(billTypeIndex===2) base.direction='out'
    if(startDate&&endDate){
      const s=new Date(startDate)
      const e=new Date(endDate)
      e.setDate(e.getDate()+1)
      base.billDate=_.gte(s).and(_.lt(e))
    }
    if(supplierName) base['counterparty.supplierName']=supplierName
    if(customerName) base['counterparty.customerName']=customerName
    let queryExp=base
    if(keyword){
      const regex=db.RegExp({regexp:keyword,options:'i'})
      const items=await db.collection('stockItems').where({shopId,productName:regex}).field({billId:true}).limit(1000).get()
      const billIds=(items.data||[]).map(x=>x.billId)
      const orConds=[{billNo:regex},{createdBy:regex}]
      if(billIds.length>0) orConds.push({_id:_.in(billIds)})
      queryExp=_.and([base, _.or(orConds)])
    }
    const col=db.collection('stockBills')
    const totalRes=await col.where(queryExp).count()
    const p=page||0, ps=pageSize||20
    const res=await col.where(queryExp).orderBy('billDate','desc').skip(p*ps).limit(ps).get()
    const list=(res.data||[]).map(b=>({
      id:b._id,
      type:b.direction==='in'?'inbound':'outbound',
      billNumber:b.billNo,
      date:(b.billDate&&b.billDate.toISOString)?b.billDate.toISOString().slice(0,10):(b.billDate&&b.billDate.slice?b.billDate.slice(0,10):new Date(b.billDate).toISOString().slice(0,10)),
      billTypeName:b.billType,
      totalAmount:(b.totals&&b.totals.totalAmount)||0,
      creator:b.createdBy,
      createTime:new Date(b.createdAt).toISOString().replace('T',' ').slice(0,16),
      supplier:b.counterparty&&b.counterparty.supplierName,
      customer:b.counterparty&&b.counterparty.customerName,
      products:[]
    }))
    const hasMore=(res.data||[]).length===ps
    return {list,total:totalRes.total,hasMore}
  }
  return {error:'UNKNOWN_ACTION'}
  }catch(e){
    console.error('stockService error',e)
    throw e
  }
}
