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
  const weekValues=[1,2,3,4,5,6];
  const missedKey='ki-archiv-pruefung-missed-questions';
  weekValues.forEach(w=>{const label=document.createElement('label');label.className='week-check';const input=document.createElement('input');input.type='checkbox';input.value=String(w);input.checked=true;input.addEventListener('change',syncWeekChecks);label.append(input,document.createTextNode(`Woche ${w}`));$('#week-options').append(label);});

  // Tabs
  $$('.tabs [role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    $$('.tabs [role="tab"]').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));
    $$('.tab-panel').forEach(p=>p.hidden=p.id!==tab.dataset.tab);
  }));

  function pool(){
    const weeks=selectedWeeks();
    return bank.questions.filter(q=>q.weeks?.some(w=>weeks.has(Number(w))));
  }
  function refreshPoolCount(){const n=pool().length; $('#pool-count').textContent=n?`${n} unterschiedliche Fragen in dieser Auswahl.`:'Bitte wähle mindestens eine Woche aus.';$('#start').disabled=n===0;}
  function selectedWeeks(){return new Set($$('#week-options input:checked').map(x=>Number(x.value)));}
  function syncWeekChecks(){let selected=selectedWeeks();if(!selected.size){$$('#week-options input').forEach(x=>x.checked=true);selected=selectedWeeks();}$('#all-weeks').checked=selected.size===weekValues.length;$('#week-summary').textContent=selected.size===weekValues.length?'Alle Fragen':`Woche ${[...selected].sort((a,b)=>a-b).join(', ')}`;refreshPoolCount();}
  $('#all-weeks').addEventListener('change',()=>{if($('#all-weeks').checked){$$('#week-options input').forEach(x=>x.checked=true);}else{$$('#week-options input').forEach(x=>x.checked=false);$$('#week-options input').forEach(x=>x.checked=true);}syncWeekChecks();});
  refreshPoolCount();

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
  function sameSet(a,b){return a.size===b.size&&[...a].every(x=>b.has(x));}
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
  $('#abort').addEventListener('click',()=>abortExam());
  function abortExam(){if(timerId){clearInterval(timerId);timerId=null;}run=[];pos=0;$('#run').hidden=true;$('#result').hidden=true;$('#setup').hidden=false;$('#timer').textContent='';$('#progress').textContent='';$('#progressbar').style.width='0';}
  function finishExam(){
    if(!run.length)return;if(timerId){clearInterval(timerId);timerId=null;}
    const score=run.reduce((n,item)=>n+(sameSet(item.selected,new Set(item.options.flatMap((o,i)=>o.correct?[i]:[])))?1:0),0);
    const missed=new Set(readMissed());run.forEach(item=>{const correct=new Set(item.options.flatMap((o,i)=>o.correct?[i]:[]));if(!sameSet(item.selected,correct))missed.add(item.group.id);});writeMissed([...missed]);renderMissed();
    $('#run').hidden=true;$('#result').hidden=false;
    const pct=Math.round(score/run.length*100);
    const result=$('#result');result.replaceChildren();
    const h=document.createElement('h2');h.textContent='Prüfung abgeschlossen';result.append(h);
    const p=document.createElement('p');p.className='result-score';p.textContent=`${score} von ${run.length} richtig · ${pct}%`;result.append(p);
    const mins=Number($('#duration').value);const history=readHistory();history.unshift({score,total:run.length,pct,date:new Date().toLocaleString('de-DE')});writeHistory(history.slice(0,8));renderHistory();
    const actions=document.createElement('div');actions.className='run-actions';
    const again=document.createElement('button');again.className='button button-orange';again.textContent='Neue Prüfung';again.onclick=()=>{ $('#setup').hidden=false;result.hidden=true;run=[];};
    const retry=document.createElement('button');retry.className='button button-secondary';retry.textContent='Falsche Fragen sofort wiederholen';retry.disabled=score===run.length;retry.onclick=()=>{const wrong=run.filter(it=>!sameSet(it.selected,new Set(it.options.flatMap((o,i)=>o.correct?[i]:[])))).map(it=>it.group);startExam(wrong,wrong.length);};
    actions.append(retry,again);result.append(actions);
    const detail=document.createElement('div');detail.innerHTML='<h2>Auswertung</h2>';
    run.forEach((it,i)=>{
      const correctSet=new Set(it.options.flatMap((o,j)=>o.correct?[j]:[])), ok=sameSet(it.selected,correctSet);
      const section=document.createElement('article');section.className='review-item';
      const title=document.createElement('h3');title.className=ok?'correct-text':'wrong-text';title.textContent=`${i+1}. ${ok?'Richtig':'Falsch oder nicht beantwortet'} · Woche ${it.variant.week||'–'}`;section.append(title);
      const question=document.createElement('p');question.textContent=it.variant.question;section.append(question);
      const list=document.createElement('ul');list.className='choice-list';it.options.forEach((o,j)=>{const li=document.createElement('li');li.className=o.correct?'answer-option is-correct':'answer-option';const text=document.createElement('span');text.textContent=`${o.text}${it.selected.has(j)&&!o.correct?' · Deine Auswahl':''}`;li.append(text);if(o.correct){const badge=document.createElement('span');badge.className='answer-badge';badge.textContent='Korrekt';li.append(badge);}list.append(li);});section.append(list);
      if(it.variant.explanation){const ex=document.createElement('p');ex.textContent=it.variant.explanation;section.append(ex);}detail.append(section);
    });result.append(detail);
  }
  function readHistory(){try{return JSON.parse(localStorage.getItem('ki-archiv-pruefung-history')||'[]');}catch{return[];}}
  function writeHistory(h){try{localStorage.setItem('ki-archiv-pruefung-history',JSON.stringify(h));}catch{}}
  function readMissed(){try{return JSON.parse(localStorage.getItem(missedKey)||'[]');}catch{return[];}}
  function writeMissed(ids){try{localStorage.setItem(missedKey,JSON.stringify(ids));}catch{}}
  function renderMissed(){const ids=readMissed();$('#saved-count').textContent=`${ids.length} Fragen gemerkt`;$('#repeat-saved').disabled=ids.length===0;$('#clear-saved').disabled=ids.length===0;}
  $('#repeat-saved').addEventListener('click',()=>{const ids=new Set(readMissed()),questions=bank.questions.filter(q=>ids.has(q.id));if(questions.length)startExam(questions,questions.length);});
  $('#clear-saved').addEventListener('click',()=>{localStorage.removeItem(missedKey);renderMissed();});renderMissed();
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
    const list=$('#catalog-list'), batch=filtered.slice(catalogShown,catalogShown+30),mode=$('#catalog-mode').value;
    batch.forEach(q=>{
      const v=q.canonical,multi=isMulti(q),article=document.createElement('article');article.className='catalog-item';
      const meta=document.createElement('div');meta.className='source-meta';meta.textContent=`Woche ${(q.weeks||[]).join(', ')} · ${multi?`Mehrfachauswahl (${v.correct.length})`:'Einfachauswahl'} · ${sources(q).join(' + ')}`;article.append(meta);
      const h=document.createElement('h3');h.textContent=v.question;article.append(h);
      if(mode==='solutions'){
      const answers=document.createElement('details');answers.className='answer-reveal';const reveal=document.createElement('summary');reveal.textContent='Antworten und Erklärung anzeigen';answers.append(reveal);
      const answerList=document.createElement('ul');answerList.className='answer-list';(v.options||[]).forEach((opt,i)=>{const correct=(v.correct||[]).includes(i),li=document.createElement('li');li.className=correct?'answer-option is-correct':'answer-option';const text=document.createElement('span');text.textContent=opt;li.append(text);if(correct){const badge=document.createElement('span');badge.className='answer-badge';badge.textContent='Korrekt';li.append(badge);}answerList.append(li);});answers.append(answerList);
      if(v.explanation){const ex=document.createElement('p');ex.className='practice-explanation';ex.textContent=v.explanation;answers.append(ex);}
      const alts=allVariants(q).filter(x=>x.question!==v.question);if(alts.length){const alt=document.createElement('details');alt.className='match-variants';const sm=document.createElement('summary');sm.textContent=`Weitere zusammengeführte Formulierung${alts.length>1?'en':''} (${alts.length})`;alt.append(sm);alts.forEach(x=>{const p=document.createElement('p');p.textContent=`${x.source||'Quelle'}: ${x.question}`;alt.append(p);});answers.append(alt);}
      article.append(answers);
      }else{
      const practice=document.createElement('div');practice.className='catalog-practice';
      const practiceTitle=document.createElement('h4');practiceTitle.className='practice-title';practiceTitle.textContent='Selbst lösen';practice.append(practiceTitle);
      const hint=document.createElement('p');hint.className='practice-hint';hint.textContent=multi?`Wähle ${v.correct.length} Antworten aus und prüfe dich selbst.`:'Wähle eine Antwort aus und prüfe dich selbst.';practice.append(hint);
      const ul=document.createElement('ul');ul.className='answer-list practice-options';const inputType=multi?'checkbox':'radio';const groupName=`practice-${q.id}`;
      (v.options||[]).forEach((opt,i)=>{const li=document.createElement('li');li.className='answer-option';const label=document.createElement('label');label.className='practice-option';const input=document.createElement('input');input.type=inputType;input.name=groupName;input.value=String(i);const text=document.createElement('span');text.textContent=opt;label.append(input,text);li.append(label);ul.append(li);});practice.append(ul);
      const feedback=document.createElement('div');feedback.className='practice-feedback';feedback.hidden=true;feedback.setAttribute('aria-live','polite');
      const actions=document.createElement('div');actions.className='practice-actions';const check=document.createElement('button');check.type='button';check.className='button button-cyan';check.textContent='Antwort prüfen';const reset=document.createElement('button');reset.type='button';reset.className='button button-secondary';reset.textContent='Neu versuchen';reset.hidden=true;
      check.addEventListener('click',()=>{const chosen=new Set($$('input:checked',ul).map(x=>Number(x.value))),correct=new Set(v.correct||[]);if(!chosen.size){feedback.hidden=false;feedback.className='practice-feedback wrong-text';feedback.textContent='Wähle zuerst eine Antwort aus.';return;}const ok=sameSet(chosen,correct);feedback.hidden=false;feedback.className=`practice-feedback ${ok?'correct-text':'wrong-text'}`;feedback.textContent=ok?'Richtig beantwortet!':`Noch nicht richtig. Markiert sind ${correct.size} richtige Antwort${correct.size===1?'':'en'}.`;$$('li',ul).forEach((li,i)=>{const isCorrect=correct.has(i);li.classList.toggle('is-correct',isCorrect);if(isCorrect){const badge=document.createElement('span');badge.className='answer-badge';badge.textContent='Korrekt';li.append(badge);}});if(v.explanation){const ex=document.createElement('p');ex.className='practice-explanation';ex.textContent=v.explanation;feedback.append(ex);}$$('input',ul).forEach(x=>x.disabled=true);check.hidden=true;reset.hidden=false;});
      reset.addEventListener('click',()=>{ul.querySelectorAll('input').forEach(x=>{x.checked=false;x.disabled=false;});ul.querySelectorAll('.answer-badge').forEach(x=>x.remove());ul.querySelectorAll('li').forEach(x=>x.classList.remove('is-correct'));feedback.replaceChildren();feedback.hidden=true;feedback.className='practice-feedback';check.hidden=false;reset.hidden=true;});actions.append(check,reset);practice.append(actions,feedback);
      article.append(practice);
      }
      list.append(article);
    });catalogShown+=batch.length;$('#load-more').hidden=catalogShown>=filtered.length;
  }
  ['search','filter-week','filter-source','filter-type','catalog-mode'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',applyFilters));$('#load-more').addEventListener('click',renderMore);applyFilters();
})();
