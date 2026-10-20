<?php
// STRATO/shared-hosting backend. Requires PHP 8+ and cURL.
// Never put the API key in this file or anywhere inside the public web directory.
declare(strict_types=1);
ini_set('display_errors', '0');
function rauszeit_env(): array {
    $values=[];
    $root=realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    if ($root !== false) {
        $path=dirname($root).DIRECTORY_SEPARATOR.'rauszeit.env';
        if (is_readable($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                if (preg_match('/^\s*(TICKETMASTER_API_KEY|RAUSZEIT_ALLOWED_ORIGINS)\s*=\s*(.*?)\s*$/', $line, $match)) {
                    $value=$match[2];
                    if (strlen($value)>=2 && (($value[0]==='"' && substr($value,-1)==='"') || ($value[0]==="'" && substr($value,-1)==="'"))) $value=substr($value,1,-1);
                    $values[$match[1]]=$value;
                }
            }
        }
    }
    foreach (['TICKETMASTER_API_KEY','RAUSZEIT_ALLOWED_ORIGINS'] as $name) {
        $value=getenv($name);if ($value!==false && $value!=='') $values[$name]=$value;
    }
    return $values;
}
function rauszeit_date($value): bool {
    if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D',$value)) return false;
    $date=DateTimeImmutable::createFromFormat('!Y-m-d',$value,new DateTimeZone('UTC'));
    return $date!==false && $date->format('Y-m-d')===$value;
}
function rauszeit_hash(float $lat,float $lon): string {
    $alphabet='0123456789bcdefghjkmnpqrstuvwxyz';$latitude=[-90.0,90.0];$longitude=[-180.0,180.0];$result='';$value=0;$bits=0;$even=true;
    while (strlen($result)<8) {
        $range=$even?$longitude:$latitude;$coordinate=$even?$lon:$lat;$mid=($range[0]+$range[1])/2;$value*=2;
        if ($coordinate>=$mid) {$value++;$range[0]=$mid;} else $range[1]=$mid;
        if ($even) $longitude=$range;else $latitude=$range;
        $even=!$even;
        if (++$bits===5) {$result.=$alphabet[$value];$value=0;$bits=0;}
    }
    return $result;
}
function rauszeit_url($value): ?string {
    if (!is_string($value)) return null;
    $url=parse_url($value);
    if (!$url || ($url['scheme'] ?? '')!=='https' || isset($url['user']) || isset($url['pass'])) return null;
    $host=strtolower($url['host'] ?? '');
    $domains=['ticketmaster.com','ticketmaster.de','ticketmaster.at','ticketmaster.ch','ticketmaster.fr','ticketmaster.co.uk','ticketmaster.ie','ticketmaster.nl','ticketmaster.be','ticketmaster.es','ticketmaster.it','ticketmaster.pl','ticketmaster.cz','ticketmaster.dk','ticketmaster.se','ticketmaster.no','ticketmaster.fi','ticketmaster.ca','ticketmaster.com.au','ticketmaster.co.nz','ticketmaster.com.mx','ticketmaster.sg','ticketmaster.ae','ticketmaster.co.za','livenation.com','livenation.de','livenation.co.uk'];
    foreach ($domains as $domain) if ($host===$domain || str_ends_with($host,'.'.$domain)) return $value;
    return null;
}
function rauszeit_normalize(array $event): array {
    $venue=$event['_embedded']['venues'][0] ?? [];$start=$event['dates']['start'] ?? [];
    return ['id'=>substr((string)($event['id'] ?? ''),0,200),'name'=>substr((string)($event['name'] ?? 'Veranstaltung'),0,500),'date'=>$start['localDate'] ?? null,'time'=>!empty($start['noSpecificTime']) || !empty($start['timeTBA']) || !empty($start['timeTBD'])?null:(isset($start['localTime'])?substr($start['localTime'],0,5):null),'timezone'=>$event['dates']['timezone'] ?? $venue['timezone'] ?? null,'venue'=>$venue['name'] ?? '', 'city'=>$venue['city']['name'] ?? '', 'country'=>$venue['country']['name'] ?? '', 'status'=>$event['dates']['status']['code'] ?? 'unknown','url'=>rauszeit_url($event['url'] ?? null),'category'=>$event['classifications'][0]['segment']['name'] ?? '','timeNote'=>!empty($start['dateTBA']) || !empty($start['dateTBD'])?'Termin noch offen':null];
}
function rauszeit_reply(int $status,array $data,?string $origin): void {
    http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('Vary: Origin');header('X-Content-Type-Options: nosniff');
    if ($origin!==null && $origin!=='') header('Access-Control-Allow-Origin: '.$origin);
    if ($status!==204) echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);
}
function rauszeit_handle(?callable $transport=null,?array $settings=null): void {
    $env=$settings ?? rauszeit_env();$origin=$_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed=array_filter(array_map('trim',explode(',',$env['RAUSZEIT_ALLOWED_ORIGINS'] ?? 'https://www.mlinner-software.de,https://mlinner-software.de,https://manlin65.github.io')));
    $host=$_SERVER['HTTP_HOST'] ?? '';$scheme=(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off')?'https':'http';
    if ($host!=='' && $origin===$scheme.'://'.$host) $allowed[]=$origin;
    if ($origin!=='' && !in_array($origin,$allowed,true)) {rauszeit_reply(403,['error'=>'Diese Website ist für die Veranstaltungssuche nicht freigegeben.'],null);return;}
    $method=$_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method==='OPTIONS') {header('Access-Control-Allow-Methods: GET, OPTIONS');header('Access-Control-Allow-Headers: Content-Type');rauszeit_reply(204,[],$origin);return;}
    if ($method!=='GET') {header('Allow: GET, OPTIONS');rauszeit_reply(405,['error'=>'Nur GET-Anfragen sind erlaubt.'],$origin);return;}
    $p=$_GET;
    foreach (['latitude','longitude','start','end'] as $name) if (!isset($p[$name]) || !is_string($p[$name])) {rauszeit_reply(400,['error'=>'Bitte Koordinaten und einen Zeitraum angeben.'],$origin);return;}
    $lat=filter_var($p['latitude'],FILTER_VALIDATE_FLOAT);$lon=filter_var($p['longitude'],FILTER_VALIDATE_FLOAT);$category=$p['category'] ?? 'all';
    if ($lat===false || $lon===false || !is_finite($lat) || !is_finite($lon) || abs($lat)>90 || abs($lon)>180 || !rauszeit_date($p['start']) || !rauszeit_date($p['end']) || $p['start']>$p['end'] || (strtotime($p['end'].'T00:00:00Z')-strtotime($p['start'].'T00:00:00Z'))/86400>30 || !is_string($category) || !in_array($category,['all','music','culture','family','outdoor','markets'],true)) {rauszeit_reply(400,['error'=>'Bitte gültige Koordinaten und höchstens 31 Kalendertage angeben.'],$origin);return;}
    $key=$env['TICKETMASTER_API_KEY'] ?? '';
    if ($key==='') {rauszeit_reply(503,['error'=>'Ticketmaster ist noch nicht eingerichtet. Der Betreiber muss TICKETMASTER_API_KEY in der geschützten rauszeit.env hinterlegen.'],$origin);return;}
    if ($category==='markets') {rauszeit_reply(200,['events'=>[],'source'=>'Ticketmaster','truncated'=>false,'notice'=>'Ticketmaster bietet keinen verlässlichen Filter für Märkte und Stadtfeste. Nutze dafür den lokalen Kalender.'],$origin);return;}
    $cachePrefix=sys_get_temp_dir().'/rauszeit-'.substr(hash('sha256',__FILE__),0,12).'-';
    $cacheFile=$cachePrefix.hash('sha256',implode('|',[$lat,$lon,$p['start'],$p['end'],$category,$key])).'.json';
    if ($transport===null && is_file($cacheFile) && filemtime($cacheFile)>time()-300) {
        $cached=json_decode((string)file_get_contents($cacheFile),true);if (is_array($cached)) {rauszeit_reply(200,$cached,$origin);return;}
    }
    $segments=['music'=>['segmentId'=>'KZFzniwnSyZfZ7v7nJ'],'culture'=>['segmentId'=>'KZFzniwnSyZfZ7v7na'],'family'=>['classificationName'=>'Family'],'outdoor'=>['segmentId'=>'KZFzniwnSyZfZ7v7nE']];
    $start=new DateTimeImmutable($p['start'],new DateTimeZone('UTC'));$end=new DateTimeImmutable($p['end'],new DateTimeZone('UTC'));
    $query=['apikey'=>$key,'geoPoint'=>rauszeit_hash($lat,$lon),'radius'=>'20','unit'=>'km','startDateTime'=>$start->modify('-14 hours')->format('Y-m-d\TH:i:s\Z'),'endDateTime'=>$end->modify('+38 hours')->format('Y-m-d\TH:i:s\Z'),'size'=>'100','sort'=>'date,asc','locale'=>'*']+($segments[$category] ?? []);
    $url='https://app.ticketmaster.com/discovery/v2/events.json?'.http_build_query($query,'','&',PHP_QUERY_RFC3986);
    try {
        if ($transport!==null) {$upstream=$transport($url);$status=$upstream['status'];$body=$upstream['body'];}
        else {
            if (!function_exists('curl_init')) {rauszeit_reply(503,['error'=>'Auf dem Webhosting muss die PHP-Erweiterung cURL aktiviert sein.'],$origin);return;}
            $curl=curl_init($url);curl_setopt_array($curl,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>10,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_HTTPHEADER=>['Accept: application/json']]);
            $body=curl_exec($curl);$status=(int)curl_getinfo($curl,CURLINFO_HTTP_CODE);curl_close($curl);
            if ($body===false) throw new RuntimeException('upstream failed');
        }
        if ($status!==200) {
            $message=($status===401 || $status===403)?'Ticketmaster akzeptiert den hinterlegten API-Schlüssel nicht.':($status===429?'Das Abfragelimit von Ticketmaster ist erreicht. Bitte später erneut versuchen.':'Ticketmaster ist gerade nicht verfügbar.');
            if ($status===429) header('Retry-After: 60');rauszeit_reply($status===429?429:502,['error'=>$message],$origin);return;
        }
        $raw=json_decode((string)$body,true,512,JSON_THROW_ON_ERROR);
        if (isset($raw['fault']) || isset($raw['errors'])) throw new RuntimeException('upstream error');
        $events=[];
        foreach ($raw['_embedded']['events'] ?? [] as $item) {
            if (!is_array($item)) continue;$event=rauszeit_normalize($item);
            if (rauszeit_date($event['date']) && $event['date']>=$p['start'] && $event['date']<=$p['end'] && !in_array($event['status'],['cancelled','canceled'],true)) $events[]=$event;
        }
        $truncated=($raw['page']['totalPages'] ?? 0)>1;
        $data=['events'=>$events,'source'=>'Ticketmaster','truncated'=>$truncated,'notice'=>$truncated?'Es werden die ersten 100 Treffer des Zeitraums berücksichtigt. Bitte den Zeitraum bei Bedarf eingrenzen.':null];
        if ($transport===null) {
            $temp=tempnam(sys_get_temp_dir(),'rauszeit-');
            if ($temp!==false) {chmod($temp,0600);if (file_put_contents($temp,json_encode($data,JSON_INVALID_UTF8_SUBSTITUTE),LOCK_EX)!==false) rename($temp,$cacheFile);else @unlink($temp);}
            foreach (glob($cachePrefix.'*.json') ?: [] as $file) if (filemtime($file)<time()-3600) @unlink($file);
        }
        rauszeit_reply(200,$data,$origin);
    } catch (Throwable $error) {rauszeit_reply(502,['error'=>'Die Veranstaltungssuche ist gerade nicht erreichbar. Bitte erneut versuchen.'],$origin);}
}
if (!defined('RAUSZEIT_TEST_MODE')) rauszeit_handle();
