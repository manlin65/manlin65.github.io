(() => {
  'use strict';
  const startplatzQuestions = window.STARTPLATZ_PRUEFUNGSFRAGEN || [];
  const originalQuestions = startplatzQuestions.filter(q=>q.isOriginal55);
  const week67Questions = startplatzQuestions.filter(q=>q.isCrossSection);
  const archiveExtraIds = new Set([
    'q-6fb03c4e6c60','q-7b7ee0d81c40','q-b9f96cd11940','q-0c0f60c8c194','q-517d1a936af2',
    'q-459e656eca84','q-976b48d8c673','q-928b97e49fbb','q-8f0f414ca563','q-4b5166952c29',
    'q-227b28b0c08b','q-179db18cae9e','q-8533606691cc','q-c18f5fe86c88','q-7ff223161ff4',
    'q-fc6a06036ce5','q-686e37a155f1','q-d3a10da98945','q-6805db51549d','q-e1921abb2034',
    'q-a82330a5d843','q-311cf21db519','q-08049401ef42','q-58745ac878c0','q-a8cb194b9a2c',
    'q-050a974f47a0','q-e9323978875e','q-32fffeaec683','q-e35b28eb8cbb','q-60d84090d425',
    'q-41771df72302','q-b2a8f42aa4af','q-03538ddd360c','q-5e6cdca9db03','q-0c204eb4a7e5',
    'q-0bda560e8e8c','q-c7eafd09f0b5','q-132d4b16b5d0','q-503f6859baf2','q-be338772899d',
    'q-f068ae517c11','q-e7700ad1a2d4','q-4d94552632b4','q-b80d02625ba0','q-e0bd075aa244'
  ]);
  const archiveExtras = (window.PRUEFUNGSBANK?.questions || []).filter(g=>archiveExtraIds.has(g.id)).map(g=>{
    const v=g.canonical;
    return {id:'archive-'+g.id,sourceId:v.sourceId||g.id,week:Number(v.week),question:v.question,options:v.options,correct:v.correct,explanation:v.explanation||'',isArchiveExtra:true};
  });
  const questions=[...originalQuestions,...archiveExtras,...week67Questions];
  if(originalQuestions.length!==55 || archiveExtras.length!==45 || week67Questions.length!==20 || questions.length!==120){
    throw new Error('Poolprüfung fehlgeschlagen: '+originalQuestions.length+'+'+archiveExtras.length+'+'+week67Questions.length+' statt 120 Fragen.');
  }
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const sameSet = (a,b) => a.size===b.size && [...a].every(x=>b.has(x));
  const weekTopics={1:'KI-Grundlagen',2:'Prompting & RAG',3:'KI-Medien',4:'Web-Apps & Backend',5:'Agenten & Prozesse',6:'Trends, Robotik & Quanten-KI',7:'EU AI Act & vertrauenswürdige KI'};
  const missedKey='cross120-exam-missed-v1';
  const historyKey='cross120-exam-history-v1';
  let run=[],pos=0,seconds=0,timerId=null,finished=false;

  function selectedPool(){return questions;}
  function availableWeeks(){return [...new Set(selectedPool().map(q=>q.week))].sort((a,b)=>a-b);}
  function renderWeekOptions(){
    const host=$('#cx-week-options');host.replaceChildren();
    availableWeeks().forEach(week=>{
      const label=document.createElement('label');label.className='week-check';
      const input=document.createElement('input');input.type='checkbox';input.value=String(week);input.checked=true;input.addEventListener('change',syncWeeks);
      const name=document.createElement('span');name.className='week-name';const strong=document.createElement('strong');strong.textContent=`Woche ${week}`;const topic=document.createElement('small');topic.textContent=weekTopics[week]||'Themen';name.append(strong,topic);label.append(input,name);host.append(label);
    });
  }
  function selectedWeeks(){return new Set($$('#cx-week-options input:checked').map(input=>Number(input.value)));}
  function syncWeeks(){
    const weeks=availableWeeks();
    let selected=selectedWeeks();
    if(!selected.size){$$('#cx-week-options input').forEach(input=>input.checked=true);selected=selectedWeeks();}
    $('#cx-all-weeks').checked=selected.size===weeks.length;
    $('#cx-week-summary').textContent=selected.size===weeks.length?'Alle Wochen':`Woche ${[...selected].sort((a,b)=>a-b).map(w=>`${w} · ${weekTopics[w]||'Themen'}`).join(', ')}`;
    refreshPool();
  }
  renderWeekOptions();
  $('#cx-all-weeks').addEventListener('change',()=>{
    // Clearing the final checked week restores the full question pool, matching the archive simulation.
    if(!$('#cx-all-weeks').checked){$$('#cx-week-options input').forEach(input=>input.checked=true);}
    else{$$('#cx-week-options input').forEach(input=>input.checked=true);}
    syncWeeks();
  });
  function pool(){const selected=selectedWeeks();return selectedPool().filter(question=>selected.has(question.week));}
  function refreshPool(){const count=pool().length;$('#cx-total-count').textContent=`${questions.length} Fragen`;$('#cx-pool-count').textContent=count?`${count} Fragen in dieser Auswahl.`:'Keine Fragen in dieser Auswahl.';$('#cx-start').disabled=count===0;}

  function startExam(questionPool=pool(),forcedCount=null){
    if(timerId){clearInterval(timerId);timerId=null;}
    const requested=Math.min(30,forcedCount ?? Number($('#cx-count').value));
    run=shuffle(questionPool).slice(0,Math.min(requested,questionPool.length)).map(question=>({
      question,
      options:shuffle(question.options.map((text,index)=>({text,correct:question.correct.includes(index)}))),
      selected:new Set()
    }));
    if(!run.length)return;
    pos=0;finished=false;seconds=Number($('#cx-duration').value)*60;
    $('#cx-setup').hidden=true;$('#cx-result').hidden=true;$('#cx-run').hidden=false;
    renderQuestion();
    if(seconds>0){renderTimer();timerId=setInterval(()=>{seconds--;renderTimer();if(seconds<=0)finishExam();},1000);}
    else $('#cx-timer').textContent='Ohne Zeitlimit';
  }
  $('#cx-start').addEventListener('click',()=>startExam());

  function renderTimer(){$('#cx-timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} Minuten`;}
  function renderQuestion(){
    const item=run[pos],question=item.question,multi=question.correct.length>1,box=$('#cx-question-box');
    $('#cx-progress').textContent=`Frage ${pos+1} von ${run.length} · Woche ${question.week}`;
    $('#cx-progressbar').style.width=`${((pos+1)/run.length)*100}%`;
    $('#cx-prev').disabled=pos===0;$('#cx-next').hidden=pos===run.length-1;$('#cx-finish').hidden=pos!==run.length-1;
    box.replaceChildren();
    const meta=document.createElement('div');meta.className='source-meta';const origin=question.isArchiveExtra?'Ergänzende Frage aus dem Wissensarchiv':question.isCrossSection?'Ergänzende Frage aus Woche '+question.week:'Ursprüngliche Prüfungsfrage';meta.textContent=`${origin} · ${question.sourceId}${multi?` · Mehrfachauswahl (${question.correct.length} richtige Antworten)`:' · Eine Antwort'}`;box.append(meta);
    const title=document.createElement('h2');title.className='question-title';title.textContent=question.question;box.append(title);
    const choices=document.createElement('div');choices.className='question-options';
    item.options.forEach((option,index)=>{
      const label=document.createElement('label');label.className='option';
      const input=document.createElement('input');input.type=multi?'checkbox':'radio';input.name='sp-answer';input.value=String(index);input.checked=item.selected.has(index);
      input.addEventListener('change',()=>{if(!multi)item.selected.clear();if(input.checked)item.selected.add(index);else item.selected.delete(index);});
      const span=document.createElement('span');span.textContent=option.text;label.append(input,span);choices.append(label);
    });
    box.append(choices);
  }
  $('#cx-prev').addEventListener('click',()=>{if(pos>0){pos--;renderQuestion();}});
  $('#cx-next').addEventListener('click',()=>{if(pos<run.length-1){pos++;renderQuestion();}});
  $('#cx-abort').addEventListener('click',()=>{
    if(timerId){clearInterval(timerId);timerId=null;}
    run=[];pos=0;finished=false;$('#cx-run').hidden=true;$('#cx-result').hidden=true;$('#cx-setup').hidden=false;$('#cx-timer').textContent='';$('#cx-progress').textContent='';$('#cx-progressbar').style.width='0';
  });
  $('#cx-finish').addEventListener('click',finishExam);

  function correctSet(item){return new Set(item.options.flatMap((option,index)=>option.correct?[index]:[]));}
  function finishExam(){
    if(!run.length||finished)return;finished=true;
    if(timerId){clearInterval(timerId);timerId=null;}
    const score=run.reduce((total,item)=>total+(sameSet(item.selected,correctSet(item))?1:0),0);
    const missed=new Set(readMissed());run.forEach(item=>{if(!sameSet(item.selected,correctSet(item)))missed.add(item.question.id);});writeMissed([...missed]);renderMissed();
    $('#cx-run').hidden=true;$('#cx-result').hidden=false;
    const result=$('#cx-result');result.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Lernquerschnitt abgeschlossen';result.append(heading);
    const pct=Math.round(score/run.length*100);const summary=document.createElement('p');summary.className='result-score';summary.textContent=`${score} von ${run.length} richtig · ${pct}%`;result.append(summary);
    const history=readHistory();history.unshift({score,total:run.length,pct,date:new Date().toLocaleString('de-DE')});writeHistory(history.slice(0,8));renderHistory();
    const actions=document.createElement('div');actions.className='run-actions';
    const retry=document.createElement('button');retry.className='button button-secondary';retry.textContent='Falsche Fragen sofort wiederholen';retry.disabled=score===run.length;retry.addEventListener('click',()=>{const wrong=run.filter(item=>!sameSet(item.selected,correctSet(item))).map(item=>item.question);startExam(wrong,wrong.length);});
    const again=document.createElement('button');again.className='button button-orange';again.textContent='Neue Prüfung';again.addEventListener('click',()=>{run=[];result.hidden=true;$('#cx-setup').hidden=false;});
    actions.append(retry,again);result.append(actions);
    const review=document.createElement('div');review.innerHTML='<h2>Auswertung</h2><p class="quiet">Grün zeigt die richtige Antwort. Rot markiert deine falsche Auswahl.</p>';
    run.forEach((item,index)=>{
      const question=item.question,correct=correctSet(item),ok=sameSet(item.selected,correct);
      const article=document.createElement('article');article.className='review-item';
      const meta=document.createElement('div');meta.className='source-meta';meta.textContent=`${question.sourceId} · Woche ${question.week}`;article.append(meta);
      const status=document.createElement('h3');status.className=ok?'correct-text':'wrong-text';status.textContent=`${index+1}. ${ok?'Richtig':'Falsch oder nicht beantwortet'}`;article.append(status);
      const prompt=document.createElement('p');prompt.textContent=question.question;article.append(prompt);
      const list=document.createElement('ul');list.className='choice-list';
      item.options.forEach((option,optionIndex)=>{
        const isSelected=item.selected.has(optionIndex),wrongSelection=isSelected&&!option.correct;
        const li=document.createElement('li');li.className=option.correct?'answer-option is-correct':wrongSelection?'answer-option is-wrong':'answer-option';
        const text=document.createElement('span');text.textContent=option.text;li.append(text);
        if(option.correct||wrongSelection){const badge=document.createElement('span');badge.className=option.correct?'answer-badge':'answer-badge answer-badge-wrong';badge.textContent=option.correct?(isSelected?'Deine Auswahl · korrekt':'Richtige Antwort'):'Deine Auswahl';li.append(badge);}
        list.append(li);
      });
      article.append(list);
      if(question.explanation){const explanation=document.createElement('p');explanation.textContent=question.explanation;article.append(explanation);}
      review.append(article);
    });
    result.append(review);
  }

  function readMissed(){try{return JSON.parse(localStorage.getItem(missedKey)||'[]');}catch{return[];}}
  function writeMissed(ids){try{localStorage.setItem(missedKey,JSON.stringify(ids));}catch{}}
  function renderMissed(){const ids=readMissed();$('#cx-saved-count').textContent=`${ids.length} Fragen gemerkt`;$(`#cx-repeat-saved`).disabled=ids.length===0;$('#cx-clear-saved').disabled=ids.length===0;}
  $('#cx-repeat-saved').addEventListener('click',()=>{const ids=new Set(readMissed()),saved=questions.filter(question=>ids.has(question.id));if(saved.length)startExam(saved,saved.length);});
  $('#cx-clear-saved').addEventListener('click',()=>{localStorage.removeItem(missedKey);renderMissed();});
  function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]');}catch{return[];}}
  function writeHistory(history){try{localStorage.setItem(historyKey,JSON.stringify(history));}catch{}}
  function renderHistory(){const items=readHistory(),target=$('#cx-history-items');if(!items.length){target.textContent='Noch keine gespeicherten Durchläufe auf diesem Gerät.';return;}target.innerHTML=items.map(item=>`<div>${esc(item.date)} · <strong>${item.score}/${item.total} (${item.pct}%)</strong></div>`).join('');}
  $('#cx-clear-history').addEventListener('click',()=>{localStorage.removeItem(historyKey);renderHistory();});
  $('#cx-total-count').textContent=questions.length+' Fragen';
  renderMissed();renderHistory();syncWeeks();
})();
