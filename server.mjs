import http from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.env.PORT||3000);
const send=(r,s,d)=>{r.writeHead(s,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'https://saebom7.github.io','Vary':'Origin'});r.end(JSON.stringify(d))};
const get=async(u,headers={})=>{const r=await fetch(u,{headers,signal:AbortSignal.timeout(12000)});const d=await r.json();if(!r.ok)throw Error(d.error?.message||'외부 API 오류');return d};
const yt=(type,params)=>{if(!process.env.YOUTUBE_API_KEY)throw Error('서버에 유튜브 API 키가 설정되지 않았습니다.');return get('https://www.googleapis.com/youtube/v3/'+type+'?'+new URLSearchParams({...params,key:process.env.YOUTUBE_API_KEY}))};
const since=()=>{const d=new Date();d.setFullYear(d.getFullYear()-5);return d};
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
http.createServer(async(req,res)=>{try{
if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'https://saebom7.github.io','Access-Control-Allow-Methods':'GET, OPTIONS'});return res.end()}
if(req.method!=='GET')return send(res,405,{error:'GET 요청만 지원합니다.'});
const u=new URL(req.url,'http://localhost');
if(u.pathname==='/') {res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Bummy Research API online')}
if(u.pathname==='/api/status')return send(res,200,{youtubeConfigured:!!process.env.YOUTUBE_API_KEY,naverConfigured:!!(process.env.NAVER_CLIENT_ID&&process.env.NAVER_CLIENT_SECRET)});
if(u.pathname==='/api/channel'){
let id=(u.searchParams.get('id')||'').trim();const m=id.match(/youtube\.com\/(?:@([\w.-]+)|channel\/(UC[\w-]{22}))/);if(m)id=m[1]?'@'+m[1]:m[2];
const p=/^UC[\w-]{22}$/.test(id)?{part:'snippet,contentDetails',id}:/^@?[\w.-]+$/.test(id)?{part:'snippet,contentDetails',forHandle:id.startsWith('@')?id:'@'+id}:null;
if(!p)return send(res,400,{error:'유튜브 @핸들 또는 채널 ID를 입력하세요.'});
const d=await yt('channels',p),c=d.items?.[0];return c?send(res,200,{id:c.id,title:c.snippet.title,uploads:c.contentDetails.relatedPlaylists.uploads}):send(res,404,{error:'채널을 찾을 수 없습니다.'})}
if(u.pathname==='/api/videos'){
const uploads=u.searchParams.get('uploads')||'';
if(!/^UU[\\w-]{22}$/.test(uploads))return send(res,400,{error:'잘못된 요청입니다.'});
const days=7,cutoff=Date.now()-days*86400000;
const key=uploads+':'+Math.floor(Date.now()/600000);
if(!globalThis.videoCache)globalThis.videoCache=new Map();
const cache=globalThis.videoCache;
if(cache.has(key))return send(res,200,cache.get(key));
const found=new Map();let token='',pages=0,complete=false;
do{
 const p=await yt('playlistItems',{part:'contentDetails',playlistId:uploads,maxResults:'50',...(token?{pageToken:token}:{})});
 const recent=(p.items||[]).filter(x=>Date.parse(x.contentDetails?.videoPublishedAt||'')>=cutoff);
 const ids=recent.map(x=>x.contentDetails?.videoId).filter(Boolean);
 if(ids.length){const d=await yt('videos',{part:'snippet,statistics',id:ids.join(',')});for(const x of d.items||[]){
 if(Date.parse(x.snippet?.publishedAt||'')>=cutoff)found.set(x.id,{id:x.id,title:x.snippet.title,channel:x.snippet.channelTitle,date:x.snippet.publishedAt,views:x.statistics?.viewCount==null?null:Number(x.statistics.viewCount),thumbnail:x.snippet.thumbnails?.medium?.url||'',url:'https://www.youtube.com/watch?v='+x.id});
 }}
 pages++;token=p.nextPageToken||'';
 if(!token||recent.length<(p.items||[]).length){complete=true;break}
}while(pages<20);
const result={items:[...found.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)),nextPageToken:null,days,complete,pages};
if(cache.size>100)cache.clear();
cache.set(key,result);
return send(res,200,result)}
if(u.pathname==='/api/news'){
if(!process.env.NAVER_CLIENT_ID||!process.env.NAVER_CLIENT_SECRET)throw Error('서버에 네이버 API 인증정보가 설정되지 않았습니다.');
const q=(u.searchParams.get('q')||'').trim(),sort=u.searchParams.get('sort')==='sim'?'sim':'date',start=Number(u.searchParams.get('start')||1);
if(!q||q.length>100||!Number.isInteger(start)||start<1||start>901)return send(res,400,{error:'검색 조건을 확인하세요.'});
const d=await get('https://openapi.naver.com/v1/search/news.json?'+new URLSearchParams({query:q,sort,start:String(start),display:'100'}),{'X-Naver-Client-Id':process.env.NAVER_CLIENT_ID,'X-Naver-Client-Secret':process.env.NAVER_CLIENT_SECRET});
return send(res,200,{items:(d.items||[]).filter(x=>new Date(x.pubDate)>=since()).map(x=>({title:clean(x.title),url:x.originallink||x.link,date:x.pubDate,description:clean(x.description)})),nextStart:d.items?.length===100&&start<901?start+100:null})}
return send(res,404,{error:'찾을 수 없는 경로입니다.'});
}catch(e){send(res,500,{error:e.message})}}).listen(port,()=>console.log('Listening on '+port));
