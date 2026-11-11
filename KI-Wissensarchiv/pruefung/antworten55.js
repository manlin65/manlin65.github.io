(() => {
  'use strict';
  const questions = (window.STARTPLATZ_PRUEFUNGSFRAGEN || [])
    .filter(question => question.isOriginal55)
    .map((question, originalIndex) => ({ question, originalIndex }))
    .sort((a, b) => a.question.week - b.question.week || a.originalIndex - b.originalIndex)
    .map(item => item.question);

  const topics = {
    1: 'KI-Grundlagen',
    2: 'Prompting & RAG',
    3: 'KI-Medien',
    4: 'Web-Apps & Backend',
    5: 'Agenten & Prozesse',
    6: 'Trends, Robotik & Quanten-KI',
    7: 'EU AI Act & vertrauenswürdige KI'
  };
  const host = document.querySelector('#answer-key-weeks');
  const count = document.querySelector('#answer-key-count');
  count.textContent = `${questions.length} Fragen`;
  let number = 0;
  const weeks = [...new Set(questions.map(question => question.week))];
  weeks.forEach(week => {
    const weekQuestions = questions.filter(question => question.week === week);
    const section = document.createElement('section');
    section.className = 'surface answer-key-week';
    const heading = document.createElement('div');
    heading.className = 'section-heading';
    const title = document.createElement('h2');
    title.textContent = `Woche ${week} · ${topics[week] || 'Prüfungsfragen'}`;
    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = `${weekQuestions.length} Fragen`;
    heading.append(title, badge);
    section.append(heading);

    weekQuestions.forEach(question => {
      number += 1;
      const article = document.createElement('article');
      article.className = 'answer-key-question';
      const meta = document.createElement('div');
      meta.className = 'source-meta';
      meta.textContent = `${number}. ${question.sourceId || 'Originalfrage'}`;
      const prompt = document.createElement('h3');
      prompt.textContent = question.question;
      const label = document.createElement('p');
      label.className = 'answer-key-label';
      label.textContent = question.correct.length > 1 ? 'Richtige Antworten' : 'Richtige Antwort';
      const list = document.createElement('ul');
      list.className = 'answer-key-list';
      question.correct.forEach(index => {
        const item = document.createElement('li');
        item.className = 'answer-option is-correct';
        item.textContent = question.options[index];
        list.append(item);
      });
      article.append(meta, prompt, label, list);
      section.append(article);
    });
    host.append(section);
  });

  document.querySelector('#answer-key-print').addEventListener('click', () => window.print());
  document.querySelector('#answer-key-to-exam').addEventListener('click', () => {
    document.querySelector('#tab-startplatz').click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
