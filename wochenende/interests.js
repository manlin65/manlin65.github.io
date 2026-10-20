/* Shared interest matching for browser results and regression checks. */
'use strict';
(() => {
  const options={
    music:{label:'Konzerte',terms:'Konzerte Live-Musik'},
    party:{label:'Party',terms:'Party Clubnacht'},
    dance:{label:'Tanzen',terms:'Tanzabend Disco Salsa'},
    fair:{label:'Kirmes & Volksfeste',terms:'Kirmes Kirchweih Kerwa Volksfest',local:true},
    markets:{label:'Märkte & Stadtfeste',terms:'Markt Flohmarkt Stadtfest',local:true},
    culture:{label:'Kultur & Bühne',terms:'Kultur Theater Ausstellung'},
    family:{label:'Mit Kindern',terms:'Veranstaltungen Kinder Familie'},
    outdoor:{label:'Sport & Draußen',terms:'Sport Outdoor Wanderung'}
  };
  function score(event,selected=[]) {
    if(!selected.length) return 1;
    const text=[event.name,event.category,...(Array.isArray(event.classifications)?event.classifications:[])].join(' ').normalize('NFKC').toLocaleLowerCase('de-DE');
    const matches={
      music:/\b(music|musik|konzert|concert|live-musik|rock|pop|jazz|metal|hip.hop|schlager)\b/u,
      party:/\b(party|partys|parties|clubnacht|clubnight|disco|diskothek|rave|afterparty)\b/u,
      dance:/\b(dance|dancing|tanzen|tanz|tanzabend|tanzparty|salsa|bachata|kizomba|disco|rave|techno|house|electronic)\b/u,
      fair:/\b(kirmes|kirchweih|kerwa|kerwe|volksfest|jahrmarkt|oktoberfest)\b/u,
      markets:/\b(markt|märkte|flohmarkt|weihnachtsmarkt|stadtfest|strassenfest|straßenfest)\b/u,
      culture:/\b(arts|theatre|theater|theatre|comedy|kabarett|ausstellung|museum|lesung|ballett|ballet|oper|opera|kultur)\b/u,
      family:/\b(family|familie|familien|kinder|kindertheater|kids|children|puppentheater)\b/u,
      outdoor:/\b(sports|sport|football|soccer|basketball|handball|eishockey|outdoor|wanderung|wandern|lauf|marathon)\b/u
    };
    return selected.filter(id=>matches[id]?.test(text)).length;
  }
  function top(items,dates,selected=[]) {
    const seen=new Set();
    return items.filter(event=>{
      const id=event.id || [event.name,event.date,event.venue].join('|');
      if(!dates.includes(event.date) || seen.has(id) || ['cancelled','canceled'].includes(event.status) || !score(event,selected)) return false;
      seen.add(id);return true;
    }).sort((a,b)=>score(b,selected)-score(a,selected) || `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)).slice(0,3);
  }
  const api={options,score,top};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else window.RauszeitInterests=api;
})();
