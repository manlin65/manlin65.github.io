(() => {
  'use strict';
  const questions = window.STARTPLATZ_PRUEFUNGSFRAGEN || [];
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const sameSet = (a,b) => a.size===b.size && [...a].every(x=>b.has(x));
  const weeks=[...new Set(questions.map(q=>q.week))].sort((a,b)=>a-b);
  const missedKey='startplatz-exam-missed-v1';
  const historyKey='startplatz-exam-history-v1';
  let run=[],pos=0,seconds=0,timerId=null,finished=false;

  weeks.forEach(week=>{
    const label=document.createElement('label');label.className='week-check';
    const input=document.createElement('input');input.type='checkbox';input.value=String(week);input.checked=true;input.addEventListener('change',syncWeeks);
    label.append(input,document.createTextNode(`Woche ${week}`));$('#sp-week-options').append(label);
  });
  function selectedWeeks(){return new Set($$('#sp-week-options input:checked').map(input=>Number(input.value)));}
  function syncWeeks(){
    let selected=selectedWeeks();
    if(!selected.size){$$('#sp-week-options input').forEach(input=>input.checked=true);selected=selectedWeeks();}
    $('#sp-all-weeks').checked=selected.size===weeks.length;
    $('#sp-week-summary').textContent=selected.size===weeks.length?'Alle Fragen':`Woche ${[...selected].sort((a,b)=>a-b).join(', ')}`;
    refreshPool();
  }
  $('#sp-all-weeks').addEventListener('change',()=>{
    // Clearing the final checked week restores the full question pool, matching the archive simulation.
    if(!$('#sp-all-weeks').checked){$$('#sp-week-options input').forEach(input=>input.checked=true);}
    else{$$('#sp-week-options input').forEach(input=>input.checked=true);}
    syncWeeks();
  });
  function pool(){const selected=selectedWeeks();return questions.filter(question=>selected.has(question.week));}
  function refreshPool(){const count=pool().length;$('#sp-pool-count').textContent=count?`${count} offizielle Fragen in dieser Auswahl.`:'Keine Fragen in dieser Auswahl.';$('#sp-start').disabled=count===0;}

  function startExam(questionPool=pool(),forcedCount=null){
    if(timerId){clearInterval(timerId);timerId=null;}
    const requested=forcedCount ?? ($('#sp-count').value==='all'?questionPool.length:Number($('#sp-count').value));
    run=shuffle(questionPool).slice(0,Math.min(requested,questionPool.length)).map(question=>({
      question,
      options:shuffle(question.options.map((text,index)=>({text,correct:question.correct.includes(index)}))),
      selected:new Set()
    }));
    if(!run.length)return;
    pos=0;finished=false;seconds=Number($('#sp-duration').value)*60;
    $('#sp-setup').hidden=true;$('#sp-result').hidden=true;$('#sp-run').hidden=false;
    renderQuestion();
    if(seconds>0){renderTimer();timerId=setInterval(()=>{seconds--;renderTimer();if(seconds<=0)finishExam();},1000);}
    else $('#sp-timer').textContent='Ohne Zeitlimit';
  }
  $('#sp-start').addEventListener('click',()=>startExam());

  function renderTimer(){$('#sp-timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} Minuten`;}
  function renderQuestion(){
    const item=run[pos],question=item.question,multi=question.correct.length>1,box=$('#sp-question-box');
    $('#sp-progress').textContent=`Frage ${pos+1} von ${run.length} · Woche ${question.week}`;
    $('#sp-progressbar').style.width=`${((pos+1)/run.length)*100}%`;
    $('#sp-prev').disabled=pos===0;$('#sp-next').hidden=pos===run.length-1;$('#sp-finish').hidden=pos!==run.length-1;
    box.replaceChildren();
    const meta=document.createElement('div');meta.className='source-meta';meta.textContent=`Offizielle Startplatz-Frage · ${question.sourceId}${multi?` · Mehrfachauswahl (${question.correct.length} richtige Antworten)`:' · Eine Antwort'}`;box.append(meta);
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
  $('#sp-prev').addEventListener('click',()=>{if(pos>0){pos--;renderQuestion();}});
  $('#sp-next').addEventListener('click',()=>{if(pos<run.length-1){pos++;renderQuestion();}});
  $('#sp-abort').addEventListener('click',()=>{
    if(timerId){clearInterval(timerId);timerId=null;}
    run=[];pos=0;finished=false;$('#sp-run').hidden=true;$('#sp-result').hidden=true;$('#sp-setup').hidden=false;$('#sp-timer').textContent='';$('#sp-progress').textContent='';$('#sp-progressbar').style.width='0';
  });
  $('#sp-finish').addEventListener('click',finishExam);

  function correctSet(item){return new Set(item.options.flatMap((option,index)=>option.correct?[index]:[]));}
  function finishExam(){
    if(!run.length||finished)return;finished=true;
    if(timerId){clearInterval(timerId);timerId=null;}
    const score=run.reduce((total,item)=>total+(sameSet(item.selected,correctSet(item))?1:0),0);
    const missed=new Set(readMissed());run.forEach(item=>{if(!sameSet(item.selected,correctSet(item)))missed.add(item.question.id);});writeMissed([...missed]);renderMissed();
    $('#sp-run').hidden=true;$('#sp-result').hidden=false;
    const result=$('#sp-result');result.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Startplatz-Prüfung abgeschlossen';result.append(heading);
    const pct=Math.round(score/run.length*100);const summary=document.createElement('p');summary.className='result-score';summary.textContent=`${score} von ${run.length} richtig · ${pct}%`;result.append(summary);
    const history=readHistory();history.unshift({score,total:run.length,pct,date:new Date().toLocaleString('de-DE')});writeHistory(history.slice(0,8));renderHistory();
    const actions=document.createElement('div');actions.className='run-actions';
    const retry=document.createElement('button');retry.className='button button-secondary';retry.textContent='Falsche Fragen sofort wiederholen';retry.disabled=score===run.length;retry.addEventListener('click',()=>{const wrong=run.filter(item=>!sameSet(item.selected,correctSet(item))).map(item=>item.question);startExam(wrong,wrong.length);});
    const again=document.createElement('button');again.className='button button-orange';again.textContent='Neue Prüfung';again.addEventListener('click',()=>{run=[];result.hidden=true;$('#sp-setup').hidden=false;});
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
  function renderMissed(){const ids=readMissed();$('#sp-saved-count').textContent=`${ids.length} Fragen gemerkt`;$(`#sp-repeat-saved`).disabled=ids.length===0;$('#sp-clear-saved').disabled=ids.length===0;}
  $('#sp-repeat-saved').addEventListener('click',()=>{const ids=new Set(readMissed()),saved=questions.filter(question=>ids.has(question.id));if(saved.length)startExam(saved,saved.length);});
  $('#sp-clear-saved').addEventListener('click',()=>{localStorage.removeItem(missedKey);renderMissed();});
  function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]');}catch{return[];}}
  function writeHistory(history){try{localStorage.setItem(historyKey,JSON.stringify(history));}catch{}}
  function renderHistory(){const items=readHistory(),target=$('#sp-history-items');if(!items.length){target.textContent='Noch keine gespeicherten Durchläufe auf diesem Gerät.';return;}target.innerHTML=items.map(item=>`<div>${esc(item.date)} · <strong>${item.score}/${item.total} (${item.pct}%)</strong></div>`).join('');}
  $('#sp-clear-history').addEventListener('click',()=>{localStorage.removeItem(historyKey);renderHistory();});
  $('#sp-total-count').textContent=`${questions.length} offizielle Fragen`;
  renderMissed();renderHistory();syncWeeks();
})();
