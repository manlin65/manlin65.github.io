'use strict';
const {neon}=require('@neondatabase/serverless');
const {randomUUID,randomBytes,createHash}=require('node:crypto');
const {inspect,MAX_ROWS,FIELDS}=require('../../datencockpit/data.cjs');
const hash=token=>createHash('sha256').update(token).digest('hex');
function createHandler({connectionString=()=>process.env.DATABASE_URL,connect=neon}={}){
  return async event=>{
    const origin=event.headers?.origin || event.headers?.Origin;
    const allowed=new Set(['https://mlinner-software.de','https://www.mlinner-software.de','https://manlin65.github.io']);
    if(process.env.URL)allowed.add(process.env.URL);
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    const reply=(statusCode,data)=>({statusCode,headers,body:JSON.stringify(data)});
    if(origin && !allowed.has(origin))return reply(403,{error:'Diese Website ist nicht freigegeben.'});
    if(origin)headers['Access-Control-Allow-Origin']=origin;
    if(event.httpMethod==='OPTIONS'){
      Object.assign(headers,{'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'});
      return {statusCode:204,headers,body:''};
    }
    if(!['GET','POST','DELETE'].includes(event.httpMethod))return reply(405,{error:'Methode nicht unterstützt.'});
    if(!connectionString())return reply(503,{error:'Die Datenbank ist noch nicht eingerichtet.'});
    let checked;
    if(event.httpMethod==='POST'){
      if(event.isBase64Encoded || Buffer.byteLength(event.body || '')>1024*1024)return reply(413,{error:'Der Import ist zu groß.'});
      let body;try{body=JSON.parse(event.body || '');}catch{return reply(400,{error:'Ungültiges JSON.'});}
      if(!Array.isArray(body?.rows) || !body.rows.length || body.rows.length>MAX_ROWS)return reply(400,{error:'1 bis 1.000 Aufträge sind erlaubt.'});
      if(body.rows.some(row=>!row || typeof row!=='object' || FIELDS.some(f=>!['string','number'].includes(typeof row[f]) || String(row[f]).length>200)))return reply(400,{error:'Ungültige Felder im Import.'});
      checked=inspect(body.rows);
      const invalid=checked.map((r,index)=>({row:index+1,issues:r.issues})).filter(r=>r.issues.length);
      if(invalid.length)return reply(422,{error:'Bitte alle Auffälligkeiten korrigieren oder die Zeilen ausschließen.',invalid});
    }
    let batchId,token;
    if(event.httpMethod!=='POST'){
      batchId=event.queryStringParameters?.batchId;
      token=(event.headers?.authorization || event.headers?.Authorization || '').replace(/^Bearer /,'');
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId || '') || !/^[0-9a-f]{64}$/.test(token))return reply(401,{error:'Der Zugriffsschlüssel für diesen Import fehlt.'});
    }
    try{
      const sql=connect(connectionString());
      if(event.httpMethod==='POST'){
        batchId=randomUUID();token=randomBytes(32).toString('hex');
        const rows=checked.map(({row,amountCents})=>({order_number:row.orderNumber,order_date:row.date,customer:row.customer,amount_cents:amountCents,status:row.status}));
        await sql.transaction([
          sql`DELETE FROM datencockpit_batches WHERE expires_at <= now()`,
          sql`INSERT INTO datencockpit_batches (id,token_hash) VALUES (${batchId},${hash(token)})`,
          sql`INSERT INTO datencockpit_orders (batch_id,order_number,order_date,customer,amount_cents,status)
            SELECT ${batchId}::uuid,x.order_number,x.order_date,x.customer,x.amount_cents,x.status
            FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
            AS x(order_number text,order_date date,customer text,amount_cents bigint,status text)`
        ]);
        return reply(201,{batchId,accessToken:token,count:rows.length,expiresInHours:24});
      }
      const access=await sql`SELECT id FROM datencockpit_batches WHERE id=${batchId}::uuid AND token_hash=${hash(token)} AND expires_at>now()`;
      if(!access.length)return reply(404,{error:'Import nicht gefunden oder nach 24 Stunden abgelaufen.'});
      if(event.httpMethod==='DELETE'){
        await sql`DELETE FROM datencockpit_batches WHERE id=${batchId}::uuid AND token_hash=${hash(token)}`;
        return reply(200,{deleted:true});
      }
      const months=await sql`SELECT to_char(order_date,'YYYY-MM') AS month,
          count(*)::int AS orders,
          count(*) FILTER (WHERE status='offen')::int AS open_orders,
          coalesce(sum(amount_cents) FILTER (WHERE status='bezahlt'),0)::bigint::text AS revenue_cents,
          coalesce(sum(amount_cents) FILTER (WHERE status='offen'),0)::bigint::text AS open_cents,
          count(*) FILTER (WHERE status='storniert')::int AS cancelled_orders
        FROM datencockpit_orders WHERE batch_id=${batchId}::uuid GROUP BY 1 ORDER BY 1`;
      const result=months.map(r=>({month:r.month,orders:Number(r.orders),openOrders:Number(r.open_orders),revenueCents:Number(r.revenue_cents),openCents:Number(r.open_cents),cancelledOrders:Number(r.cancelled_orders)}));
      return reply(200,{batchId,months:result,totals:result.reduce((s,r)=>({orders:s.orders+r.orders,openOrders:s.openOrders+r.openOrders,revenueCents:s.revenueCents+r.revenueCents,openCents:s.openCents+r.openCents,cancelledOrders:s.cancelledOrders+r.cancelledOrders}),{orders:0,openOrders:0,revenueCents:0,openCents:0,cancelledOrders:0})});
    }catch{return reply(503,{error:'Speichern oder Abfragen momentan nicht möglich. Bitte erneut versuchen.'});}
  };
}
exports.createHandler=createHandler;
exports.handler=createHandler();
