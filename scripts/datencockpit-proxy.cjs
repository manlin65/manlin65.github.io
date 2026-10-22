'use strict';
// Use the cloud environment's proxy without changing TLS verification.
if(process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy){
  const {fetch,EnvHttpProxyAgent}=require('undici');
  const {neonConfig}=require('@neondatabase/serverless');
  const dispatcher=new EnvHttpProxyAgent();
  neonConfig.fetchFunction=(input,init)=>fetch(input,{...init,dispatcher});
}
