/* Shared interest matching for browser results and regression checks. */
'use strict';
(() => {
  const options={
    music:{label:'Konzerte',terms:'Konzerte Live-Musik'},
    party:{label:'Party',terms:'Party Clubnacht'},
    dance:{label:'Tanzen',terms:'Tanzabend Disco Rockdisco Salsa'},
    oldies:{label:'Oldies · 70er/80er/90er',terms:'Oldies 70er 80er 90er Dance Classics'},
    discofox:{label:'Discofox & Schlager',terms:'Discofox Schlager Tanzparty'},
    fair:{label:'Kirmes & Volksfeste',terms:'Kirmes Kirchweih Kerwa Volksfest',local:true},
    christmas:{label:'Weihnachtsmärkte',terms:'Weihnachtsmarkt Weihnachtsmärkte Christkindlesmarkt Christkindlmarkt Adventsmarkt',local:true},
    markets:{label:'Märkte & Stadtfeste',terms:'Markt Flohmarkt Stadtfest',local:true},
    culture:{label:'Kultur & Bühne',terms:'Kultur Theater Ausstellung'},
    family:{label:'Mit Kindern',terms:'Veranstaltungen Kinder Familie'},
    outdoor:{label:'Sport & Draußen',terms:'Sport Outdoor Wanderung'}
  };
  function score(event,selected=[]) {
    if(!selected.length) return 1;
    const text=[event.name,event.category,event.description,...(Array.isArray(event.classifications)?event.classifications:[])].join(' ').normalize('NFKC').toLocaleLowerCase('de-DE');
    const matches={
      music:/\b(music|musik|konzert|concert|live-musik|rock|pop|jazz|metal|hip.hop|schlager)\b/u,
      party:/\b(party|partys|parties|clubnacht|clubnight|disco|rockdisco|diskothek|rave|afterparty|ü30|ü40|ü50|ü60)\b/u,
      dance:/\b(dance|dancing|tanzen|tanz|tanzabend|tanzparty|discofox|salsa|bachata|kizomba|disco|rockdisco|rave|techno|electronic)\b/u,
      oldies:/\b(oldies|oldie|70er|80er|90er|seventies|eighties|nineties|dance classics)\b/u,
      discofox:/\b(discofox|schlager|schlagerparty|schlagernacht)\b/u,
      fair:/\b(kirmes|kirchweih|kerwa|kerwe|volksfest|jahrmarkt|oktoberfest)\b/u,
      christmas:/\b(weihnachtsmarkt|weihnachtsmärkte|weihnachtsmaerkte|christkindlesmarkt|christkindlmarkt|christkindelmarkt|adventsmarkt|adventsmärkte|wintermarkt|christmas market)\b/u,
      markets:/\b(markt|märkte|flohmarkt|weihnachtsmarkt|stadtfest|strassenfest|straßenfest)\b/u,
      culture:/\b(arts|theatre|theater|theatre|comedy|kabarett|ausstellung|museum|lesung|ballett|ballet|oper|opera|kultur)\b/u,
      family:/\b(family|familie|familien|kinder|kindertheater|kids|children|puppentheater)\b/u,
      outdoor:/\b(sports|sport|football|soccer|basketball|handball|eishockey|outdoor|wanderung|wandern|lauf|marathon)\b/u
    };
    return selected.filter(id=>matches[id]?.test(text)).length;
  }
  function matchesAudience(event,audience='all') {
    if(audience==='all') return true;
    if(!['30','40','50','60'].includes(audience)) return false;
    const text=[event.name,event.description,...(event.classifications || [])].join(' ').toLocaleLowerCase('de-DE');
    return new RegExp('(?:ü|ue|über|over|ab)\\s*[-–]?\\s*'+audience+'\\b|\\b'+audience+'\\s*\\+','u').test(text);
  }
  function top(items,dates,selected=[],audience='all') {
    const seen=new Set();
    return items.filter(event=>{
      const id=event.id || [event.name,event.date,event.venue].join('|');
      if(!dates.includes(event.date) || seen.has(id) || ['cancelled','canceled'].includes(event.status) || !score(event,selected) || !matchesAudience(event,audience)) return false;
      seen.add(id);return true;
    }).sort((a,b)=>score(b,selected)-score(a,selected) || `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)).slice(0,3);
  }
  const api={options,score,top,matchesAudience};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else window.RauszeitInterests=api;
})();
