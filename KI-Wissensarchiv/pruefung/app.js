(() => {
  'use strict';
  const bank = window.PRUEFUNGSBANK;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const isMulti = q => q.matchType === 'multiple' || (q.canonical?.correct?.length || 0) > 1;
  const sources = q => [...new Set((q.variants || [q.canonical]).map(v=>v.source).filter(Boolean))];
  const allVariants = q => q.variants?.length ? q.variants : [q.canonical];
  const getQuestionVariant = q => shuffle(allVariants(q))[0] || q.canonical;
  let run=[], pos=0, seconds=0, timerId=null, catalogShown=0, filtered=[];

  // Tabs
  $$('.tabs [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    $$('.tabs [role="tab"]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));
    $$('.tab-panel').forEach(p=>p.hidden=p.id!==tab.dataset.tab);
  }));

  function pool(){
    const week=$('#week').value;
    return bank.questions.filter(q=>week==='all'||q.weeks?.includes(Number(week)));
  }
  function refreshPoolCount(){const n=pool().length; $('#pool-count').textContent=`${n} unterschiedliche Fragen in dieser Auswahl.`;}
  $('#week').addEventListener('change',refreshPoolCount); refreshPoolCount();

  function startExam(questionPool=pool(), forcedCount=null){
    if(timerId){clearInterval(timerId);timerId=null;}
    const requested=forcedCount ?? ($('#count').value==='all'?questionPool.length:Number($('#count').value));
    const picked=shuffle(questionPool).slice(0,Math.min(requested,questionPool.length));
    run=picked.map(group=>{
      const v=getQuestionVariant(group);
      const options=shuffle((v.options||[]).map((text,i)=>({text,correct:(v.correct||[]).includes(i)})));
      return {group,variant:v,options,selected:new Set()};
    });
    if(!run.length)return;
    pos=0; seconds=Number($('#duration').value)*60;
    $('#setup').hidden=true; $('#result').hidden=true; $('#run').hidden=false;
    $('#finish').hidden=false; $('#next').hidden=false;
    renderQuestion();
    if(seconds>0){renderTimer(); timerId=setInterval(()=>{seconds--;renderTimer();if(seconds<=0)finishExam();},1000);} else $('#timer').textContent='Ohne Zeitlimit';
  }
  $('#start').addEventListener('click',()=>startExam());
  function renderTimer(){ $('#timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} Minuten`; }
  function renderQuestion(){
    const item=run[pos], v=item.variant, box=$('#question-box'), multi=isMulti(item.group);
    $('#progress').textContent=`Frage ${pos+1} von ${run.length}${v.week?` · Woche ${v.week}`:''}`;
    $('#progressbar').style.width=`${((pos+1)/run.length)*100}%`;
    $('#next').hidden=pos===run.length-1; $('#finish').hidden=pos!==run.length-1;
    $('#prev').disabled=pos===0;
    $('#unanswered-note').textContent='';
    box.replaceChildren();
    const meta=document.createElement('div');meta.className='source-meta';meta.textContent=`${v.topic||'KI-Wissen'} · ${v.source||'Archiv'}${multi?` · Mehrfachauswahl: ${v.correct.length} richtige Antworten`:' · Eine Antwort'}`;box.append(meta);
    const h=document.createElement('h2');h.className='question-title';h.textContent=v.question;box.append(h);
    const choices=document.createElement('div');choices.className='question-options';
    item.options.forEach((opt,i)=>{
      const label=document.createElement('label');label.className='option';
      const input=document.createElement('input');input.type=multi?'checkbox':'radio';input.name='answer';input.value=i;input.checked=item.selected.has(i);
      input.addEventListener('change',()=>{if(!multi)item.selected.clear(); if(input.checked)item.selected.add(i);else item.selected.delete(i);});
      const span=document.createElement('span');span.textContent=opt.text;label.append(input,span);choices.append(label);
    });box.append(choices);
  }
  $('#prev').addEventListener('click',()=>{if(pos>0){pos--;renderQuestion();}});
  $('#next').addEventListener('click',()=>{if(pos<run.length-1){pos++;renderQuestion();}});
  $('#finish').addEventListener('click',()=>finishExam());
  function finishExam(){
    if(!run.length)return;if(timerId){clearInterval(timerId);timerId=null;}
    const score=run.reduce((n,item)=>n+(sameSet(item.selected,new Set(item.options.flatMap((o,i)=>o.correct?[i]:[])))?1:0),0);
    $('#run').hidden=true;$('#result').hidden=false;
    const pct=Math.round(score/run.length*100);
    const result=$('#result');result.replaceChildren();
    const h=document.createElement('h2');h.textContent='Prüfung abgeschlossen';result.append(h);
    const p=document.createElement('p');p.className='result-score';p.textContent=`${score} von ${run.length} richtig · ${pct}%`;result.append(p);
    const mins=Number($('#duration').value);const history=readHistory();history.unshift({score,total:run.length,pct,date:new Date().toLocaleString('de-DE')});writeHistory(history.slice(0,8));renderHistory();
    const actions=document.createElement('div');actions.className='run-actions';
    const again=document.createElement('button');again.className='button button-orange';again.textContent='Neue Prüfung';again.onclick=()=>{ $('#setup').hidden=false;result.hidden=true;run=[];};
    const retry=document.createElement('button');retry.className='button button-secondary';retry.textContent='Falsche Fragen wiederholen';retry.disabled=score===run.length;retry.onclick=()=>{const wrong=run.filter(it=>!sameSet(it.selected,new Set(it.options.flatMap((o,i)=>o.correct?[i]:[])))).map(it=>it.group);$('#week').value='all';startExam(wrong,wrong.length);};
    actions.append(retry,again);result.append(actions);
    const detail=document.createElement('div');detail.innerHTML='<h2>Auswertung</h2>';
    run.forEach((it,i)=>{
      const correctSet=new Set(it.options.flatMap((o,j)=>o.correct?[j]:[])), ok=sameSet(it.selected,correctSet);
      const section=document.createElement('article');section.className='review-item';
      const title=document.createElement('h3');title.className=ok?'correct-text':'wrong-text';title.textContent=`${i+1}. ${ok?'Richtig':'Falsch oder nicht beantwortet'} · Woche ${it.variant.week||'–'}`;section.append(title);
      const question=document.createElement('p');question.textContent=it.variant.question;section.append(question);
      const list=document.createElement('ul');list.className='choice-list';it.options.forEach((o,j)=>{const li=document.createElement('li');li.textContent=`${o.correct?'✓ Richtig':'○'} ${o.text}${it.selected.has(j)&&!o.correct?' · Deine Auswahl':''}`;if(o.correct)li.className='correct-text';list.append(li);});section.append(list);
      if(it.variant.explanation){const ex=document.createElement('p');ex.textContent=it.variant.explanation;section.append(ex);}detail.append(section);
    });result.append(detail);
  }
  function sameSet(a,b){return a.size===b.size&&[...a].every(x=>b.has(x));}
  function readHistory(){try{return JSON.parse(localStorage.getItem('ki-archiv-pruefung-history')||'[]');}catch{return[];}}
  function writeHistory(h){try{localStorage.setItem('ki-archiv-pruefung-history',JSON.stringify(h));}catch{}}
  function renderHistory(){const h=readHistory(), el=$('#history-items');if(!h.length){el.textContent='Noch keine gespeicherten Durchläufe auf diesem Gerät.';return;}el.innerHTML=h.map(x=>`<div>${esc(x.date)} · <strong>${x.score}/${x.total} (${x.pct}%)</strong></div>`).join('');}
  $('#clear-history').addEventListener('click',()=>{localStorage.removeItem('ki-archiv-pruefung-history');renderHistory();});renderHistory();

  // Filterable catalogue, rendered in small batches.
  function applyFilters(){
    const term=$('#search').value.trim().toLocaleLowerCase('de'), week=$('#filter-week').value, source=$('#filter-source').value, type=$('#filter-type').value;
    filtered=bank.questions.filter(q=>{
      const v=q.canonical, text=[v.question,v.topic,v.explanation,...(v.options||[])].join(' ').toLocaleLowerCase('de');
      return (!term||text.includes(term))&&(week==='all'||q.weeks?.includes(Number(week)))&&(source==='all'||sources(q).includes(source))&&(type==='all'||(type==='multiple')===isMulti(q));
    });catalogShown=0;$('#catalog-list').replaceChildren();$('#catalog-count').textContent=`${filtered.length} Fragen`;renderMore();
  }
  function renderMore(){
    const list=$('#catalog-list'), batch=filtered.slice(catalogShown,catalogShown+30);
    batch.forEach(q=>{
      const v=q.canonical,multi=isMulti(q),article=document.createElement('article');article.className='catalog-item';
      const meta=document.createElement('div');meta.className='source-meta';meta.textContent=`Woche ${(q.weeks||[]).join(', ')} · ${multi?`Mehrfachauswahl (${v.correct.length})`:'Einfachauswahl'} · ${sources(q).join(' + ')}`;article.append(meta);
      const h=document.createElement('h3');h.textContent=v.question;article.append(h);
      const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Antworten und Erklärung anzeigen';details.append(summary);
      const ul=document.createElement('ul');(v.options||[]).forEach((opt,i)=>{const li=document.createElement('li');li.textContent=`${(v.correct||[]).includes(i)?'✓ Richtig: ':'○ '}${opt}`;ul.append(li);});details.append(ul);
      if(v.explanation){const ex=document.createElement('p');ex.textContent=v.explanation;details.append(ex);}
      const alts=allVariants(q).filter(x=>x.question!==v.question);if(alts.length){const alt=document.createElement('details');alt.className='match-variants';const sm=document.createElement('summary');sm.textContent=`Weitere zusammengeführte Formulierung${alts.length>1?'en':''} (${alts.length})`;alt.append(sm);alts.forEach(x=>{const p=document.createElement('p');p.textContent=`${x.source||'Quelle'}: ${x.question}`;alt.append(p);});details.append(alt);}
      article.append(details);list.append(article);
    });catalogShown+=batch.length;$('#load-more').hidden=catalogShown>=filtered.length;
  }
  ['search','filter-week','filter-source','filter-type'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',applyFilters));$('#load-more').addEventListener('click',renderMore);applyFilters();
})();
