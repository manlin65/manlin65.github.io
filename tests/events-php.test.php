<?php
declare(strict_types=1);
define('RAUSZEIT_TEST_MODE',true);
require __DIR__.'/../wochenende/api/events.php';
function check(bool $condition,string $message): void {if (!$condition) throw new RuntimeException($message);}
$settings=['TICKETMASTER_API_KEY'=>'test-fixture-not-a-real-key','RAUSZEIT_ALLOWED_ORIGINS'=>'https://www.mlinner-software.de'];
function run_request(array $params=[],?callable $transport=null,?array $settings=null,string $method='GET',string $origin='https://www.mlinner-software.de'): array {
    $_GET=$params+['latitude'=>'49.89','longitude'=>'10.89','start'=>'2026-10-23','end'=>'2026-10-25','category'=>'all'];
    $_SERVER['REQUEST_METHOD']=$method;$_SERVER['HTTP_ORIGIN']=$origin;$_SERVER['HTTP_HOST']='backend.example';
    ob_start();rauszeit_handle($transport,$settings ?? $GLOBALS['settings']);$body=ob_get_clean();return [http_response_code(),json_decode($body,true),$body];
}
$noFetch=function(){throw new RuntimeException('Must not fetch upstream');};
[$status,$body]=run_request([],$noFetch,['RAUSZEIT_ALLOWED_ORIGINS'=>$settings['RAUSZEIT_ALLOWED_ORIGINS']]);check($status===503,'missing key');check(str_contains($body['error'],'rauszeit.env'),'configuration instructions');
foreach ([['latitude'=>'91'],['longitude'=>'not-a-number'],['start'=>'2026-02-30'],['end'=>'2026-10-01'],['end'=>'2026-12-31'],['latitude'=>[]],['category'=>[]]] as $params) {[$status]=run_request($params,$noFetch);check($status===400,'invalid input');}
[$status]=run_request([],$noFetch,null,'GET','https://untrusted.example');check($status===403,'disallowed origin');
[$status]=run_request([],$noFetch,null,'OPTIONS');check($status===204,'preflight');
[$status]=run_request([],$noFetch,null,'POST');check($status===405,'method');
function fixture(string $id,string $date,string $status='onsale',string $url='https://www.ticketmaster.de/event/123'): array {return ['id'=>$id,'name'=>'Concert <script>','url'=>$url,'dates'=>['start'=>['localDate'=>$date,'localTime'=>'19:30:00'],'status'=>['code'=>$status]],'_embedded'=>['venues'=>[['name'=>'Arena','city'=>['name'=>'Bamberg'],'country'=>['name'=>'Deutschland']]]]];}
$upstream=function($url){parse_str(parse_url($url,PHP_URL_QUERY),$query);check($query['apikey']==='test-fixture-not-a-real-key','server-side key');check($query['radius']==='20','radius');check(strlen($query['geoPoint'])===8,'geohash');return ['status'=>200,'body'=>json_encode(['_embedded'=>['events'=>[fixture('ok','2026-10-24'),fixture('cancel','2026-10-24','cancelled'),fixture('outside','2026-10-26'),fixture('unsafe','2026-10-25','onsale','https://ticketmaster.evil.example/')]],'page'=>['totalPages'=>2]])];};
[$status,$body,$raw]=run_request([],$upstream);check($status===200,'valid response');check(count($body['events'])===2,'filter invalid/cancelled dates');check($body['events'][0]['time']==='19:30','time normalization');check($body['events'][1]['url']===null,'unsafe URL');check($body['truncated']===true,'pagination warning');check(!str_contains($raw,$settings['TICKETMASTER_API_KEY']),'key must not be returned');
foreach ([401,403,429,500] as $upstreamStatus) {[$status,$body,$raw]=run_request([],fn()=>['status'=>$upstreamStatus,'body'=>'']);check($status===($upstreamStatus===429?429:502),'upstream error mapping');check(!str_contains($raw,$settings['TICKETMASTER_API_KEY']),'error must not expose key');}
[$status,$body]=run_request(['category'=>'markets'],$noFetch);check($status===200 && $body['events']===[],'honest market empty state');
[$status,$body,$raw]=run_request([],function(){throw new RuntimeException('https://upstream?apikey=test-fixture-not-a-real-key');});check($status===502 && !str_contains($raw,'apikey='),'transport error redaction');
$folder=sys_get_temp_dir().'/rauszeit-env-test-'.bin2hex(random_bytes(5));mkdir($folder);mkdir($folder.'/public');file_put_contents($folder.'/rauszeit.env',"TICKETMASTER_API_KEY=\"fixture-only\"\nRAUSZEIT_ALLOWED_ORIGINS=https://www.mlinner-software.de\n");
$oldRoot=$_SERVER['DOCUMENT_ROOT'] ?? null;$_SERVER['DOCUMENT_ROOT']=$folder.'/public';$saved=getenv('TICKETMASTER_API_KEY');putenv('TICKETMASTER_API_KEY');
try {check(rauszeit_env()['TICKETMASTER_API_KEY']==='fixture-only','read key only from outside document root');} finally {if($saved!==false)putenv('TICKETMASTER_API_KEY='.$saved);else putenv('TICKETMASTER_API_KEY');$_SERVER['DOCUMENT_ROOT']=$oldRoot;unlink($folder.'/rauszeit.env');rmdir($folder.'/public');rmdir($folder);}
echo "PASS PHP backend: missing key, validation, CORS, normalization, cancelled/out-of-range events, safe URLs, key redaction, upstream failures, and private env loading\n";
