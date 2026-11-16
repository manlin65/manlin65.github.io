(() => {
  'use strict';
  const questions = window.STARTPLATZ_PRUEFUNGSFRAGEN || [];
  const originalQuestions = questions.filter(question => question.isOriginal55);
  const wordingVariants = {
  "startplatz-01-q1211": "Welche Neuerung aus dem Jahr 2017 veränderte die Entwicklung von Sprachmodellen grundlegend und wurde zur Basis moderner KI-Systeme?",
  "startplatz-02-q1213": "Welche Entwicklung gilt als entscheidender Durchbruch neuronaler Netze in der Bildverarbeitung?",
  "startplatz-03-q1311": "Wie lässt sich Machine Learning grundlegend definieren?",
  "startplatz-04-q1321": "Welche Beschreibung trifft Supervised Learning am besten?",
  "startplatz-05-q1351": "Welcher Arbeitsschritt beeinflusst die Qualität eines Machine-Learning-Modells besonders stark?",
  "startplatz-06-q1332": "Welche Aufgabe übernehmen die Hidden Layer in einem neuronalen Netzwerk hauptsächlich?",
  "startplatz-07-q1354": "Welche Funktion haben Tokens in aktuellen Transformer-Modellen?",
  "startplatz-08-q1452": "Wodurch kann die Qualität von KI-Ergebnissen verlässlich geprüft werden?",
  "startplatz-09-q1433": "Wie geht man am besten vor, wenn eine KI-Aufgabe besonders komplex ist?",
  "startplatz-10-q1511": "Welche grundlegende Abgrenzung gibt es bei den Methoden des maschinellen Lernens?",
  "startplatz-11-q1521": "Was ist typisch für die Transformer-Architektur moderner KI-Systeme?",
  "startplatz-12-q1543": "Warum ist die Qualität der Daten für KI-Anwendungen wichtig?",
  "startplatz-13-q2111": "Welches Ziel verfolgt Prompt Engineering in erster Linie?",
  "startplatz-14-q2112": "Welche zentralen Bausteine sollte ein gut aufgebauter Prompt enthalten?",
  "startplatz-15-q2121": "Worin unterscheiden sich Zero-Shot- und Few-Shot-Prompting?",
  "startplatz-16-q2131": "Wozu wird Chain-of-Thought-Prompting eingesetzt?",
  "startplatz-17-q2113": "Weshalb sollte ein Prompt die Rolle der KI festlegen?",
  "startplatz-18-q2231": "Welche Aussage zur Verarbeitung von Tokens trifft zu?",
  "startplatz-19-q2241": "Woran erkennt man eine Prompt-Injection?",
  "startplatz-20-q2221": "Welcher Parameter beeinflusst, wie kreativ die KI antwortet?",
  "startplatz-21-q2242": "Welche der folgenden Risiken für die KI-Sicherheit gibt es? (2 Antworten sind richtig)",
  "startplatz-22-q2323": "Was macht ein wirksames Konzept zur KI-Schulung aus?",
  "startplatz-23-q2411": "Welche grundlegenden Arten von Prompting-Techniken lassen sich unterscheiden?",
  "startplatz-24-q2412": "Ein Unternehmen möchte Kundenanfragen automatisch klassifizieren. Welche Prompting-Methode passt dafür am besten?",
  "startplatz-25-q2431": "Welche Aussage über die Chain-of-Thought-Technik ist richtig?",
  "startplatz-26-q2422": "Welche Bestandteile gehören in einen gut strukturierten Prompt für automatisierte Systeme? (2 von 5 Antworten sind richtig)",
  "startplatz-27-q2442": "Wozu dient die Formatierung mit Markdown beim Prompt Engineering?",
  "startplatz-28-q2531": "Welchen Zweck erfüllt Retrieval-Augmented Generation (RAG) in einem KI-System vor allem?",
  "startplatz-29-q2541": "Welche Eigenschaft beschreibt Fine-Tuning als Methode zur Optimierung von KI am treffendsten?",
  "startplatz-30-q2532": "Welche Bausteine gehören zu einem RAG-System? (2 von 4 Antworten sind richtig)",
  "startplatz-31-q3111": "Wodurch unterscheidet sich Claude von Anthropic bei der ethischen Ausrichtung von anderen KI-Modellen?",
  "startplatz-32-q3211": "Wie funktionieren Diffusionsmodelle grundsätzlich bei der Erzeugung von Bildern?",
  "startplatz-33-q4111": "Wie lässt sich das Frontend einer Anwendung am besten beschreiben?",
  "startplatz-34-q4112": "Welche Aussage über das Backend einer modernen Webanwendung stimmt?",
  "startplatz-35-q5311": "Was braucht es, um einen einfachen KI-Workflow für automatisch erstellte Social-Media-Inhalte zu planen?",
  "startplatz-36-q5321": "Für welche praktische Aufgabe eignen sich KI-gestützte Automatisierungstools besonders?",
  "startplatz-37-q5411": "Wie ist ein KI-Agent definiert?",
  "startplatz-38-q5421": "Aus welchen drei wesentlichen Elementen besteht ein KI-Agent grundsätzlich?",
  "startplatz-39-q7111": "Welche Rolle spielten die 2019 veröffentlichten EU-Leitlinien für vertrauenswürdige KI bei der europäischen KI-Regulierung?",
  "startplatz-40-q7121": "Welches Prinzip der EU-Leitlinien verlangt, dass KI ihre Entscheidungen erklären kann?",
  "startplatz-41-q7122": "Welche Punkte gehören laut EU-Leitlinien zu „Technische Robustheit und Sicherheit“?",
  "startplatz-42-q7131": "Was erschwert die praktische Umsetzung des Transparenz-Prinzips bei komplexen neuronalen Netzen besonders?",
  "startplatz-43-q7211": "Welches der folgenden Systeme zählt nach der KI-Verordnung NICHT als KI-System?",
  "startplatz-44-q7221": "Nach welchem Grundprinzip ist die EU-KI-Verordnung aufgebaut?",
  "startplatz-45-q7331": "Wie viele gewerbliche Nutzer muss ein KI-Modell mit allgemeinem Verwendungszweck mindestens erreichen, damit es als Modell mit systemischem Risiko eingestuft wird?",
  "startplatz-46-q7411": "Was gehört nach der KI-Verordnung zur „KI-Kompetenz“?",
  "startplatz-47-q7232": "Welche Tätigkeiten fallen unter die Regulierung der KI-Verordnung? (2 Antworten)",
  "startplatz-48-q7511": "Welche Aussage zum Zusammenspiel der EU-KI-Verordnung mit anderen Rechtsgebieten ist korrekt?",
  "startplatz-49-q7611": "Worin liegt im AI Act der wichtigste Unterschied zwischen Anbieter und Betreiber?",
  "startplatz-50-q7614": "Durch welche Handlung übernimmt ein Betreiber die Pflichten eines Anbieters?",
  "startplatz-51-q7623": "Was folgt regulatorisch daraus, wenn ein KI-System als „minimales Risiko“ eingestuft wird?",
  "startplatz-52-q7712": "Wann muss ein Arbeitgeber seine Beschäftigten über den Einsatz von Hochrisiko-KI am Arbeitsplatz informieren?",
  "startplatz-53-q7113": "Welche KI-Anwendung ist nach Artikel 5 der KI-Verordnung verboten?",
  "startplatz-54-q7121": "Welche Aussage über Social-Scoring-Systeme nach Artikel 5 der KI-Verordnung stimmt?",
  "startplatz-55-q7132": "Welche Methode zur Erstellung von Gesichtserkennungsdatenbanken verbietet Artikel 5 der KI-Verordnung?"
};
  const answerRewrites = [
  [
    "ausschließlich",
    "nur"
  ],
  [
    "Ausschließlich",
    "Nur"
  ],
  [
    "ausschließliche",
    "alleinige"
  ],
  [
    "Ausschließliche",
    "Alleinige"
  ],
  [
    "vollständige",
    "komplette"
  ],
  [
    "Vollständige",
    "Komplette"
  ],
  [
    "vollständig",
    "komplett"
  ],
  [
    "Vollständig",
    "Komplett"
  ],
  [
    "grundlegende",
    "wesentliche"
  ],
  [
    "Grundlegende",
    "Wesentliche"
  ],
  [
    "entscheidenden",
    "maßgeblichen"
  ],
  [
    "Entscheidenden",
    "Maßgeblichen"
  ],
  [
    "entscheidende",
    "maßgebliche"
  ],
  [
    "Entscheidende",
    "Maßgebliche"
  ],
  [
    "entscheidend",
    "maßgeblich"
  ],
  [
    "Entscheidend",
    "Maßgeblich"
  ],
  [
    "wichtigsten",
    "zentralen"
  ],
  [
    "Wichtigsten",
    "Zentralen"
  ],
  [
    "wichtigste",
    "zentrale"
  ],
  [
    "Wichtigste",
    "Zentrale"
  ],
  [
    "insbesondere",
    "vor allem"
  ],
  [
    "Insbesondere",
    "Vor allem"
  ],
  [
    "Verwendung",
    "Nutzung"
  ],
  [
    "Nutzung",
    "Verwendung"
  ],
  [
    "Erstellung",
    "Erzeugung"
  ],
  [
    "Analyse",
    "Auswertung"
  ],
  [
    "Bewertung",
    "Beurteilung"
  ],
  [
    "Definition",
    "Begriffsbestimmung"
  ],
  [
    "Möglichkeit",
    "Option"
  ],
  [
    "Möglichkeiten",
    "Optionen"
  ],
  [
    "Rolle",
    "Funktion"
  ],
  [
    "erfolgreich",
    "wirksam"
  ],
  [
    "Erfolgreiche",
    "Wirksame"
  ],
  [
    "komplexe",
    "anspruchsvolle"
  ],
  [
    "Komplexe",
    "Anspruchsvolle"
  ],
  [
    "komplexen",
    "anspruchsvollen"
  ],
  [
    "verschiedene",
    "unterschiedliche"
  ],
  [
    "Verschiedene",
    "Unterschiedliche"
  ],
  [
    "verschiedenen",
    "unterschiedlichen"
  ],
  [
    "kontinuierliche",
    "fortlaufende"
  ],
  [
    "Kontinuierliche",
    "Fortlaufende"
  ],
  [
    "präzise",
    "genaue"
  ],
  [
    "Präzise",
    "Genaue"
  ],
  [
    "erhöhte",
    "gesteigerte"
  ],
  [
    "Erhöhte",
    "Gesteigerte"
  ],
  [
    "reduzierte",
    "verringerte"
  ],
  [
    "Reduzierte",
    "Verringerte"
  ],
  [
    "bereitgestellten",
    "gelieferten"
  ],
  [
    "eigenständig",
    "selbstständig"
  ],
  [
    "Eigenständig",
    "Selbstständig"
  ],
  [
    "vorherigen",
    "zuvor erstellten"
  ],
  [
    "späteren",
    "nachfolgenden"
  ],
  [
    "gemeinsam",
    "zusammen"
  ],
  [
    "Verarbeitung",
    "Bearbeitung"
  ],
  [
    "Ergebnisse",
    "Resultate"
  ],
  [
    "Ergebnis",
    "Resultat"
  ],
  [
    "Grundlage",
    "Basis"
  ],
  [
    "bedeutet",
    "heißt"
  ],
  [
    "Bedeutet",
    "Heißt"
  ],
  [
    "definiert",
    "beschreibt"
  ],
  [
    "Definiert",
    "Beschreibt"
  ],
  [
    "beschreibt",
    "charakterisiert"
  ],
  [
    "Beschreibt",
    "Charakterisiert"
  ],
  [
    "erkennen",
    "identifizieren"
  ],
  [
    "Erkennen",
    "Identifizieren"
  ],
  [
    "Unterstützung",
    "Hilfe"
  ],
  [
    "unterstützen",
    "helfen"
  ],
  [
    "ersetzen",
    "ablösen"
  ],
  [
    "Ersetzen",
    "Ablösen"
  ],
  [
    "bestimmte",
    "konkrete"
  ],
  [
    "Bestimmte",
    "Konkrete"
  ],
  [
    "unabhängig",
    "eigenständig"
  ],
  [
    "Unabhängig",
    "Eigenständig"
  ],
  [
    "Funktion",
    "Aufgabe"
  ],
  [
    "Ziel",
    "Zweck"
  ],
  [
    "Kriterien",
    "Merkmale"
  ],
  [
    "Risiken",
    "Gefahren"
  ],
  [
    "regelbasiert",
    "regelgestützt"
  ],
  [
    "regelbasierten",
    "regelgestützten"
  ],
  [
    "Technologie",
    "Technik"
  ],
  [
    "technologische",
    "technische"
  ],
  [
    "Methode",
    "Verfahren"
  ],
  [
    "Methoden",
    "Verfahren"
  ],
  [
    "Umsetzung",
    "Realisierung"
  ],
  [
    "Einbindung",
    "Integration"
  ],
  [
    "Integration",
    "Einbindung"
  ],
  [
    "Verbindung",
    "Verknüpfung"
  ],
  [
    "Kombination",
    "Verknüpfung"
  ],
  [
    "Lösungen",
    "Ergebnisse"
  ],
  [
    "Informationen",
    "Angaben"
  ],
  [
    "Information",
    "Angabe"
  ],
  [
    "Nutzer",
    "Anwender"
  ],
  [
    "Nutzern",
    "Anwendern"
  ],
  [
    "Nutzerin",
    "Anwenderin"
  ],
  [
    "Anpassbarkeit",
    "Flexibilität"
  ],
  [
    "Speicherung",
    "Ablage"
  ],
  [
    "Verantwortung",
    "Zuständigkeit"
  ],
  [
    "Widerstandsfähigkeit",
    "Robustheit"
  ],
  [
    "Zuverlässigkeit",
    "Verlässlichkeit"
  ],
  [
    "Präzision",
    "Genauigkeit"
  ],
  [
    "Geschäftsmodell",
    "Geschäftskonzept"
  ],
  [
    "Anpassung",
    "Abstimmung"
  ],
  [
    "verwendet",
    "nutzt"
  ],
  [
    "Verwendet",
    "Nutzt"
  ],
  [
    "nutzen",
    "verwenden"
  ],
  [
    "Nutzen",
    "Verwenden"
  ],
  [
    "verhindert",
    "unterbindet"
  ],
  [
    "Verhindert",
    "Unterbindet"
  ],
  [
    "ermöglicht",
    "erlaubt"
  ],
  [
    "Ermöglicht",
    "Erlaubt"
  ],
  [
    "umfasst",
    "beinhaltet"
  ],
  [
    "Umfasst",
    "Beinhaltet"
  ],
  [
    "beinhaltet",
    "umfasst"
  ],
  [
    "Beinhaltet",
    "Umfasst"
  ],
  [
    "basiert auf",
    "beruht auf"
  ],
  [
    "Basiert auf",
    "Beruht auf"
  ],
  [
    "kombiniert",
    "verbindet"
  ],
  [
    "Kombiniert",
    "Verbindet"
  ],
  [
    "kombinieren",
    "verbinden"
  ],
  [
    "entwickelt",
    "erarbeitet"
  ],
  [
    "Erstellt",
    "Generiert"
  ],
  [
    "erstellt",
    "generiert"
  ],
  [
    "erhält",
    "bekommt"
  ],
  [
    "Erhält",
    "Bekommt"
  ],
  [
    "verarbeitet",
    "bearbeitet"
  ],
  [
    "Verarbeitet",
    "Bearbeitet"
  ],
  [
    "Computer",
    "Rechner"
  ],
  [
    "Computer",
    "Rechner"
  ]
];
  function rewordAnswer(text,intensity=1) {
    const candidates=[];
    for (const [from,to] of answerRewrites) {
      const escaped=from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern=new RegExp('(^|[^\\p{L}\\p{N}_])'+escaped+'(?=$|[^\\p{L}\\p{N}_])','u');
      const match=pattern.exec(text);
      if(!match) continue;
      const start=match.index+match[1].length,end=start+from.length;
      if(candidates.some(item=>start<item.end&&end>item.start)) continue;
      candidates.push({start,end,to});
    }
    const selected=shuffle(candidates).slice(0,Math.min(intensity,candidates.length)).sort((x,y)=>y.start-x.start);
    let result=text;
    for(const item of selected) result=result.slice(0,item.start)+item.to+result.slice(item.end);
    return result;
  }
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
    run=shuffle(questionPool).slice(0,Math.min(requested,questionPool.length)).map(question=>{
      const wordingIntensity=$('#sp-vary-wording')?.checked ? 1+Math.floor(Math.random()*3) : 0;
      const baseQuestion=wordingVariants[question.id] || question.question;
      return {
        question,
        displayQuestion: wordingIntensity && Math.random()>=0.2 ? rewordAnswer(baseQuestion,wordingIntensity) : question.question,
        options:shuffle(question.options.map((text,index)=>({text:wordingIntensity && Math.random()>=0.5 ? rewordAnswer(text,wordingIntensity) : text,correct:question.correct.includes(index)}))),
        selected:new Set()
      };
    });
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
    const title=document.createElement('h2');title.className='question-title';title.textContent=item.displayQuestion;box.append(title);
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
      const prompt=document.createElement('p');prompt.textContent=item.displayQuestion || question.question;article.append(prompt);
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
