(() => {
  'use strict';
  const questions = window.STARTPLATZ_PRUEFUNGSFRAGEN || [];
  const originalQuestions = questions.filter(question => question.isOriginal55);
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const sameSet = (a,b) => a.size===b.size && [...a].every(x=>b.has(x));
  const weekTopics={1:'KI-Grundlagen',2:'Prompting & RAG',3:'KI-Medien',4:'Web-Apps & Backend',5:'Agenten & Prozesse',6:'Trends, Robotik & Quanten-KI',7:'EU AI Act & vertrauenswürdige KI'};
  const missedKey='startplatz-exam-missed-v1';
  const historyKey='startplatz-exam-history-v1';
  const statsKey='startplatz-exam-question-stats-v1';
  let run=[],pos=0,seconds=0,timerId=null,finished=false,reviewOnly=false,startedAt=0;

  function availableWeeks(){return [...new Set(originalQuestions.map(question=>question.week))].sort((a,b)=>a-b);}
  function selectedWeeks(){return new Set($$('#sp-week-options input:checked').map(input=>Number(input.value)));}
  function pool(){const weeks=selectedWeeks();return originalQuestions.filter(question=>weeks.has(question.week));}
  function renderWeekOptions(){
    const host=$('#sp-week-options');host.replaceChildren();
    availableWeeks().forEach(week=>{
      const label=document.createElement('label');label.className='week-check';
      const input=document.createElement('input');input.type='checkbox';input.value=String(week);input.checked=true;input.addEventListener('change',syncWeeks);
      const name=document.createElement('span');name.className='week-name';const strong=document.createElement('strong');strong.textContent=`Woche ${week}`;const topic=document.createElement('small');topic.textContent=weekTopics[week]||'Themen';name.append(strong,topic);label.append(input,name);host.append(label);
    });
  }
  function syncWeeks(){
    const weeks=availableWeeks();let selected=selectedWeeks();
    if(!selected.size){$$('#sp-week-options input').forEach(input=>input.checked=true);selected=selectedWeeks();}
    $('#sp-all-weeks').checked=selected.size===weeks.length;
    $('#sp-week-summary').textContent=selected.size===weeks.length?'Alle Wochen':`Woche ${[...selected].sort((a,b)=>a-b).map(week=>`${week} · ${weekTopics[week]||'Themen'}`).join(', ')}`;
    refreshPool();
  }
  renderWeekOptions();
  $('#sp-all-weeks').addEventListener('change',()=>{$$('#sp-week-options input').forEach(input=>input.checked=true);syncWeeks();});
  $('#sp-count').addEventListener('change',refreshPool);
  function refreshPool(){const count=pool().length;$('#sp-total-count').textContent=`${originalQuestions.length} Originalfragen im Pool`;
    const fortyOption=$('#sp-count option[value="40"]'),allOption=$('#sp-count option[value="all"]');fortyOption.disabled=count<40;allOption.textContent=`Alle ${count} Fragen dieser Wochenauswahl`;
    if(count<40&&$('#sp-count').value==='40')$('#sp-count').value='all';
    $('#sp-pool-count').textContent=count<40?`Wochenauswahl: ${count} Originalfragen. Für die 40er-Prüfung bitte weitere Wochen auswählen; sonst kannst du alle Fragen dieser Auswahl beantworten.`:`Wochenauswahl: ${count} Originalfragen. Du kannst 40 zufällige Fragen oder alle Fragen dieser Auswahl wählen.`;
    $('#sp-start').disabled=count===0;}

  function startExam(questionPool=pool(),forcedCount=null,isReview=false){
    if(timerId){clearInterval(timerId);timerId=null;}
    const requested=forcedCount ?? ($('#sp-count').value==='all'?questionPool.length:Number($('#sp-count').value));
    run=shuffle(questionPool).slice(0,Math.min(requested,questionPool.length)).map(question=>({
      question,
      options:shuffle(question.options.map((text,index)=>({text,correct:question.correct.includes(index)}))),
      selected:new Set()
    }));
    if(!run.length)return;
    pos=0;finished=false;reviewOnly=isReview;seconds=Number($('#sp-duration').value)*60;startedAt=Date.now();
    $('#sp-setup').hidden=true;$('#sp-result').hidden=true;$('#sp-run').hidden=false;
    renderQuestion();
    if(seconds>0){renderTimer();timerId=setInterval(()=>{seconds--;renderTimer();if(seconds<=0)finishExam(true);},1000);}
    else $('#sp-timer').textContent='Ohne Zeitlimit';
  }
  $('#sp-start').addEventListener('click',()=>startExam());

  function renderTimer(){$('#sp-timer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} Minuten`;}
  function formatDuration(totalSeconds){
    const value=Math.max(0,Math.floor(totalSeconds||0)),hours=Math.floor(value/3600),minutes=Math.floor((value%3600)/60),secs=value%60;
    return hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')} Std.`:`${minutes}:${String(secs).padStart(2,'0')} Min.`;
  }
  function renderQuestion(){
    const item=run[pos],question=item.question,multi=question.correct.length>1,box=$('#sp-question-box');
    $('#sp-progress').textContent=`Frage ${pos+1} von ${run.length} · Woche ${question.week}`;
    $('#sp-progressbar').style.width=`${((pos+1)/run.length)*100}%`;
    $('#sp-prev').disabled=pos===0;$('#sp-next').hidden=pos===run.length-1;$('#sp-finish').hidden=false;
    box.replaceChildren();
    const meta=document.createElement('div');meta.className='source-meta';const origin=question.week===6?'Ergänzende Übungsfrage aus Woche 6':'Offizielle Startplatz-Prüfungsfrage';meta.textContent=`${origin} · ${question.sourceId}${multi?` · Mehrfachauswahl (${question.correct.length} richtige Antworten)`:' · Eine Antwort'}`;box.append(meta);
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
    if(!window.confirm('Prüfung wirklich abbrechen? Der aktuelle Versuch wird nicht ausgewertet.'))return;
    if(timerId){clearInterval(timerId);timerId=null;}
    run=[];pos=0;finished=false;startedAt=0;$('#sp-run').hidden=true;$('#sp-result').hidden=true;$('#sp-setup').hidden=false;$('#sp-timer').textContent='';$('#sp-progress').textContent='';$('#sp-progressbar').style.width='0';
  });
  $('#sp-finish').addEventListener('click',finishExam);

  function renderResultScene(passed){
    const scene=$('#sp-dialog-scene');scene.replaceChildren();
    const addEmoji=(className,text)=>{const el=document.createElement('span');el.className=className;el.textContent=text;el.setAttribute('aria-hidden','true');scene.append(el);return el;};
    const caption=document.createElement('p');caption.className='scene-caption';
    if(reviewOnly){
      scene.className='dialog-scene scene-review';addEmoji('hero-emoji','📚');addEmoji('scene-toast','✨');caption.textContent='Noch eine Runde geübt – das sitzt beim nächsten Mal besser.';
    }else if(passed){
      scene.className='dialog-scene scene-pass';
      for(let i=0;i<16;i++){const confetti=addEmoji('scene-confetti','');confetti.style.setProperty('--i',String(i));confetti.style.setProperty('--delay',`${(i%6)*-.31}s`);}
      addEmoji('scene-balloon left','🎈');addEmoji('scene-balloon right','🎈');addEmoji('hero-emoji','🕺');addEmoji('scene-toast','🥂');
      caption.textContent='Konfetti, Tanzfläche, Sekt – der KI-Manager-Cert-Check ist bestanden!';
    }else{
      scene.className='dialog-scene scene-fail';addEmoji('hero-emoji','😭');
      const cleanup=document.createElement('div');cleanup.className='scene-cleanup';cleanup.setAttribute('aria-hidden','true');
      const broom=document.createElement('span');broom.className='broom';broom.textContent='🧹';cleanup.append(broom);
      const bottles=document.createElement('span');bottles.className='bottle';bottles.textContent='🍾';cleanup.append(bottles);
      const secondBottle=document.createElement('span');secondBottle.className='bottle';secondBottle.textContent='🍾';cleanup.append(secondBottle);scene.append(cleanup);
      caption.textContent='Kurz die Sektflaschen einsammeln und einmal schniefen – dann greifen wir die falschen Fragen an.';
    }
    scene.append(caption);
  }

  function correctSet(item){return new Set(item.options.flatMap((option,index)=>option.correct?[index]:[]));}
  function finishExam(timeExpired=false){
    if(!run.length||finished)return;
    const unanswered=run.filter(item=>item.selected.size===0).length;
    if(unanswered&&!timeExpired&&!window.confirm(`${unanswered} ${unanswered===1?'Frage ist':'Fragen sind'} noch unbeantwortet und zählen als falsch. Prüfung trotzdem abgeben?`))return;
    finished=true;
    const elapsedSeconds=startedAt?Math.floor((Date.now()-startedAt)/1000):0;
    if(timerId){clearInterval(timerId);timerId=null;}
    const score=run.reduce((total,item)=>total+(sameSet(item.selected,correctSet(item))?1:0),0);
    const missed=new Set(readMissed());run.forEach(item=>{if(!sameSet(item.selected,correctSet(item)))missed.add(item.question.id);});writeMissed([...missed]);renderMissed();
    recordQuestionStats();renderWeaknesses();
    $('#sp-run').hidden=true;$('#sp-result').hidden=false;
    const result=$('#sp-result');result.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='Startplatz-Prüfung abgeschlossen';result.append(heading);
    const pct=Math.round(score/run.length*100);const passingScore=Math.ceil(run.length*.7);const passed=score>=passingScore;const summary=document.createElement('p');summary.className='result-score';summary.textContent=`${score} von ${run.length} richtig · ${pct}% · Benötigte Zeit: ${formatDuration(elapsedSeconds)}`;result.append(summary);
    const history=readHistory();history.unshift({score,total:run.length,pct,elapsedSeconds,date:new Date().toLocaleString('de-DE')});writeHistory(history.slice(0,8));renderHistory();
    const actions=document.createElement('div');actions.className='run-actions';
    const retry=document.createElement('button');retry.className='button button-secondary';retry.textContent='Falsche Fragen sofort wiederholen';retry.disabled=score===run.length;retry.addEventListener('click',()=>{const wrong=run.filter(item=>!sameSet(item.selected,correctSet(item))).map(item=>item.question);startExam(wrong,wrong.length,true);});
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
    const dialog=$('#sp-result-dialog');
    $('#sp-dialog-status').textContent=reviewOnly?'WIEDERHOLUNG ABGESCHLOSSEN':passed?'BESTANDEN':'NICHT BESTANDEN';
    $('#sp-dialog-status').className=`dialog-status ${reviewOnly?'passed':passed?'passed':'failed'}`;
    $('#sp-dialog-score').textContent=`${score} / ${run.length} richtig · ${pct} % · ${formatDuration(elapsedSeconds)}`;
    $('#sp-dialog-note').textContent=reviewOnly?'Diese Runde dient der Wiederholung und zählt nicht als Prüfungssimulation.':passed?`Bestanden: mindestens ${passingScore} von ${run.length} Fragen richtig (70 %).`:`Zum Bestehen brauchst du mindestens ${passingScore} von ${run.length} richtigen Antworten (70 %).`;
    renderResultScene(passed);
    if(!dialog.open)dialog.showModal();
  }

  $('#sp-dialog-close').addEventListener('click',()=>$('#sp-result-dialog').close());

  function readMissed(){try{return JSON.parse(localStorage.getItem(missedKey)||'[]');}catch{return[];}}
  function writeMissed(ids){try{localStorage.setItem(missedKey,JSON.stringify(ids));}catch{}}
  function renderMissed(){const ids=readMissed();$('#sp-saved-count').textContent=`${ids.length} Fragen gemerkt`;$(`#sp-repeat-saved`).disabled=ids.length===0;$('#sp-clear-saved').disabled=ids.length===0;}
  $('#sp-repeat-saved').addEventListener('click',()=>{const ids=new Set(readMissed()),saved=originalQuestions.filter(question=>ids.has(question.id));if(saved.length)startExam(saved,saved.length,true);});
  $('#sp-clear-saved').addEventListener('click',()=>{localStorage.removeItem(missedKey);renderMissed();});
  function readStats(){try{return JSON.parse(localStorage.getItem(statsKey)||'{}');}catch{return{};}}
  function recordQuestionStats(){
    const stats=readStats();
    run.forEach(item=>{
      const id=item.question.id,row=stats[id]||{attempts:0,wrong:0};
      row.attempts+=1;if(!sameSet(item.selected,correctSet(item)))row.wrong+=1;
      stats[id]=row;
    });
    try{localStorage.setItem(statsKey,JSON.stringify(stats));}catch{}
  }
  function weakestQuestions(){
    const stats=readStats();
    return originalQuestions.map(question=>({question,...(stats[question.id]||{attempts:0,wrong:0})}))
      .filter(item=>item.attempts>0&&item.wrong>0)
      .sort((a,b)=>(b.wrong/b.attempts)-(a.wrong/a.attempts)||b.wrong-a.wrong||b.attempts-a.attempts);
  }
  function renderWeaknesses(){
    const chart=$('#sp-weakness-chart'),empty=$('#sp-weakness-empty'),stats=readStats(),rows=weakestQuestions();chart.replaceChildren();
    const hasAttempts=Object.values(stats).some(item=>item.attempts>0);
    $('#sp-weakness-count').textContent=rows.length?`${rows.length} Fragen mit Fehlversuchen`:hasAttempts?'Keine Fehlversuche':'Noch keine Auswertung';
    empty.hidden=rows.length>0;empty.textContent=hasAttempts?'Bisher sind alle ausgewerteten Fragen richtig beantwortet.': 'Nach deinem ersten Versuch erscheinen hier deine Lernschwerpunkte.';
    $('#sp-repeat-weakest').disabled=rows.length===0;$('#sp-clear-stats').disabled=!hasAttempts;
    rows.slice(0,15).forEach(item=>{
      const rate=Math.round(item.wrong/item.attempts*100),row=document.createElement('article');row.className='weakness-row';
      const meta=document.createElement('div');meta.className='weakness-meta';
      const source=document.createElement('span');source.textContent=`${item.question.sourceId} · Woche ${item.question.week}`;
      const count=document.createElement('span');count.textContent=`${item.wrong} von ${item.attempts} falsch`;meta.append(source,count);
      const title=document.createElement('p');title.className='weakness-question';title.textContent=item.question.question;
      const line=document.createElement('div');line.className='weakness-bar-line';line.setAttribute('role','img');line.setAttribute('aria-label',`${rate} Prozent falsch`);
      const track=document.createElement('div');track.className='weakness-track';const fill=document.createElement('div');fill.className='weakness-fill';fill.style.width=`${rate}%`;track.append(fill);
      const percentage=document.createElement('span');percentage.className='weakness-rate';percentage.textContent=`${rate} % falsch`;
      line.append(track,percentage);row.append(meta,title,line);chart.append(row);
    });
  }
  $('#sp-repeat-weakest').addEventListener('click',()=>{
    const list=weakestQuestions().slice(0,10).map(item=>item.question);
    if(!list.length)return;
    $('#tab-startplatz').click();startExam(list,list.length,true);
  });
  $('#sp-clear-stats').addEventListener('click',()=>{
    if(!window.confirm('Deine Schwächen-Auswertung auf diesem Gerät zurücksetzen?'))return;
    localStorage.removeItem(statsKey);renderWeaknesses();
  });
  function readHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]');}catch{return[];}}
  function writeHistory(history){try{localStorage.setItem(historyKey,JSON.stringify(history));}catch{}}
  function renderHistory(){const items=readHistory(),target=$('#sp-history-items');if(!items.length){target.textContent='Noch keine gespeicherten Durchläufe auf diesem Gerät.';return;}target.innerHTML=items.map(item=>`<div>${esc(item.date)} · <strong>${item.score}/${item.total} (${item.pct}%)</strong> · Zeit: ${item.elapsedSeconds==null?'bei älteren Durchläufen nicht erfasst':esc(formatDuration(item.elapsedSeconds))}</div>`).join('');}
  $('#sp-clear-history').addEventListener('click',()=>{localStorage.removeItem(historyKey);renderHistory();});
  renderMissed();renderHistory();syncWeeks();renderWeaknesses();
})();
