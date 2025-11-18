// app.js - Princess Portal (Ultra) - Single-file SPA logic

// QUIZ DATA (10 promises + 2 extras)
const QUESTIONS = [
  { q: "1) Gym Encouragement — How will you hype them?", choices: ["Drag them heroically to gym", "Spam gym memes", "Flex together", "Create a pink workout plan"] },
  { q: "2) Daily Sparkle — Glitter level?", choices: ["Subtle", "Cute", "Maximum", "Full princess makeover"] },
  { q: "3) Snack Pact — When they snack?", choices: ["Share happily", "Secretly steal", "Bring healthy disguised as candy", "Cheer them on"] },
  { q: "4) Birthday Drama — Your move?", choices: ["Overhype on socials", "Surprise gym party", "Write a heartfelt note", "All of the above"] },
  { q: "5) Meme Supply — Frequency?", choices: ["3/day", "10/day", "100 if ignored", "Gym memes Mondays"] },
  { q: "6) Roasting Protocol — Allowed when?", choices: ["Minor mistakes", "They miss reps", "They go emo", "Always lovingly"] },
  { q: "7) Secrets — Can you keep them?", choices: ["Yes", "Try my best", "Maybe", "I leak cute pics instead"] },
  { q: "8) Mood Lifters — Best method?", choices: ["Anime scenes", "Cute dog videos", "Chocolate delivery", "Gym sesh together"] },
  { q: "9) Silliness — Will you join cringe reels?", choices: ["Yes", "Only for them", "Absolutely", "Depends on outfit"] },
  { q: "10) Eternal Enrollment — Do you accept? (Only YES)", choices: ["YES"] },
  // extras (gym + anime fundamentals)
  { q: "11) Princess Gym Challenge — Kawaii Squats accepted?", choices: ["Y", "N"] },
  { q: "12) Anime Fundamentals — Will you strike a dramatic pose pre-lift?", choices: ["Y", "N"] }
];

const state = { idx: 0, answers: new Array(QUESTIONS.length).fill(null), sfxOn: true };

// UI refs
const overlay = document.getElementById('overlay');
const enterBtn = document.getElementById('enterBtn');
const sfxBtn = document.getElementById('sfxBtn');
const miniQR = document.getElementById('miniQR');
const quizContainer = document.getElementById('quizContainer');
const controls = document.getElementById('controls');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const extraActions = document.getElementById('extraActions');
const downloadBooklet = document.getElementById('downloadBooklet');
const showQR = document.getElementById('showQR');
const qrModal = document.getElementById('qrModal');
const pageQR = document.getElementById('pageQR');
const closeQR = document.getElementById('closeQR');

const resultCard = document.getElementById('resultCard');
const summary = document.getElementById('summary');
const certBtn = document.getElementById('certBtn');
const retakeBtn = document.getElementById('retakeBtn');

const certCard = document.getElementById('certCard');
const certCanvas = document.getElementById('certCanvas');
const downloadCert = document.getElementById('downloadCert');
const backToHome = document.getElementById('backToHome');

const playerName = document.getElementById('playerName');

// small sparkle SFX using WebAudio
let audioCtx = null;
function playSparkle() {
  if (!state.sfxOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
  o.stop(audioCtx.currentTime + 0.4);
}

// generate a tiny QR for overlay (points to data instructive text)
// use QRCode lib (qrcode.min.js loaded via CDN)
function makeMiniQR() {
  miniQR.innerHTML = '';
  // Use window.location.href if it looks hosted; otherwise encode simple instructions
  const url = (typeof window !== 'undefined' && window.location && window.location.href && !window.location.href.includes('file://')) ? window.location.href : 'Open the saved HTML file "princess-portal" on your device';
  new QRCode(miniQR, { text: url, width: 120, height: 120, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
}

// full-page QR generator (for modal). Point to current page URL (hosted).
function showPageQR() {
  pageQR.innerHTML = '';
  const url = window.location.href;
  new QRCode(pageQR, { text: url, width: 300, height: 300, colorDark: "#2f0b2a", colorLight: "#fff7fb", correctLevel: QRCode.CorrectLevel.H });
  qrModal.classList.remove('hidden');
}

// build sparkle background
function spawnSparkles() {
  const container = document.querySelector('.sparkles');
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    s.style.animationDuration = (4 + Math.random() * 6) + 's';
    container.appendChild(s);
  }
}

// RENDER current question
function renderQuestion() {
  const item = QUESTIONS[state.idx];
  quizContainer.innerHTML = '';
  const block = document.createElement('div');
  block.className = 'quizItem';
  block.innerHTML = `<strong>${item.q}</strong>`;
  const ch = document.createElement('div');
  ch.className = 'choices';
  item.choices.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'choice';
    el.tabIndex = 0;
    el.innerText = c;
    el.onclick = () => {
      selectChoice(i, c, el);
    };
    // mark selected if previously answered
    if (state.answers[state.idx] === c) el.classList.add('selected');
    ch.appendChild(el);
  });
  block.appendChild(ch);
  quizContainer.appendChild(block);
  updateProgress();
  controls.style.display = 'flex';
  extraActions.style.display = 'block';
}

// select choice
function selectChoice(i, text, el) {
  Array.from(el.parentNode.children).forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
  state.answers[state.idx] = text;
  playSparkle();
}

// navigation
prevBtn.onclick = () => {
  if (state.idx > 0) {
    state.idx--;
    renderQuestion();
  }
};
nextBtn.onclick = () => {
  // require selection (except for forced YES single-choice question)
  if (!state.answers[state.idx]) {
    if (QUESTIONS[state.idx].choices.length === 1) {
      // auto-fill
      state.answers[state.idx] = QUESTIONS[state.idx].choices[0];
    } else {
      alert('Please pick an option (princesses expect participation!)');
      return;
    }
  }
  if (state.idx < QUESTIONS.length - 1) {
    state.idx++;
    renderQuestion();
  } else {
    submitQuiz();
  }
};

function updateProgress() {
  const pct = Math.round((state.idx / (QUESTIONS.length - 1)) * 100);
  progressBar.style.width = pct + '%';
  progressText.textContent = `Question ${state.idx + 1} / ${QUESTIONS.length}`;
}

// SUBMIT and show summary
function submitQuiz() {
  document.getElementById('portalCard').classList.add('hidden');
  resultCard.classList.remove('hidden');
  renderSummary();
}

function renderSummary() {
  summary.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const d = document.createElement('div');
    d.style.padding = '8px 0';
    d.style.borderBottom = '1px dashed rgba(170,90,140,0.06)';
    d.innerHTML = `<strong>${q.q}</strong><div style="margin-top:6px">${state.answers[i] ? state.answers[i] : '<em style="color:#7a486b">No answer</em>'}</div>`;
    summary.appendChild(d);
  });
}

// show certificate canvas
certBtn.onclick = () => {
  resultCard.classList.add('hidden');
  certCard.classList.remove('hidden');
  drawCertificate();
};
retakeBtn.onclick = () => location.reload();

// Certificate drawing (high DPI)
function drawCertificate() {
  const canvas = certCanvas;
  const ctx = canvas.getContext('2d');
  // High-DPI scaling for crisp download
  const scale = 2;
  const w = canvas.width;
  const h = canvas.height;
  canvas.width = w * scale;
  canvas.height = h * scale;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = '#fff4fb';
  ctx.fillRect(0, 0, w, h);

  // border
  ctx.strokeStyle = '#ff9adf';
  ctx.lineWidth = 6;
  roundRect(ctx, 12, 12, w - 24, h - 24, 18, false, true);

  // title
  ctx.fillStyle = '#ff4fb6';
  ctx.font = '30px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Unescapable Friendship', w / 2, 80);

  // decorative crown shape
  ctx.fillStyle = '#ffd1ea';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 60, 110);
  ctx.lineTo(w / 2 - 30, 80);
  ctx.lineTo(w / 2, 110);
  ctx.lineTo(w / 2 + 30, 80);
  ctx.lineTo(w / 2 + 60, 110);
  ctx.closePath();
  ctx.fill();

  // message
  ctx.fillStyle = '#6b2350';
  ctx.font = '20px Arial';
  const text = `This certifies that ${playerName.textContent} is forcefully enrolled in this fabulous friendship. Escape is not an option.`;
  wrapText(ctx, text, w / 2, 170, w - 140, 26);

  // footer
  ctx.font = '18px Georgia';
  ctx.fillStyle = '#b24682';
  ctx.fillText('Signed with pink glitter and friendship', w / 2, h - 120);

  // hearts
  ctx.fillStyle = '#ff6fb5';
  drawHeart(ctx, w / 2 - 280, h - 60, 10);
  drawHeart(ctx, w / 2 + 280 - 40, h - 60, 10);

  // set download link when ready
  // (download button uses this canvas data)
}

// download certificate PNG
downloadCert.onclick = () => {
  // convert canvas to PNG and trigger download
  const canvas = certCanvas;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${playerName.textContent}_princess_certificate.png`;
  link.click();
};

// helper drawing functions
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof stroke === 'undefined') stroke = true;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  ctx.textAlign = 'center';
  var words = text.split(' ');
  var line = '';
  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  var topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size / 2, x, y + size);
  ctx.bezierCurveTo(x, y + size / 2, x + size / 2, y + size / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.fill();
}

// PDF booklet generation using jsPDF (CDN loaded)
downloadBooklet.onclick = async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // cover
  doc.setFillColor(255, 214, 243);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  doc.setFontSize(26); doc.setTextColor(79, 16, 58);
  doc.text('Princess Portal — Booklet', doc.internal.pageSize.getWidth() / 2, 120, { align: 'center' });
  doc.setFontSize(18);
  doc.text(`For: ${playerName.textContent}`, doc.internal.pageSize.getWidth() / 2, 160, { align: 'center' });
  doc.addPage();

  // questions pages (2 per page)
  doc.setFontSize(14);
  QUESTIONS.forEach((q, i) => {
    const y = 60 + (i % 4) * 80;
    const x = 40 + (i % 2) * 260;
    doc.text(`${q.q}`, x, y);
    doc.text(`Answer: ${state.answers[i] ? state.answers[i] : '—'}`, x, y + 20);
    if ((i % 4) === 3 && i !== QUESTIONS.length - 1) doc.addPage();
  });

  // certificate page
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Certificate', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`This certifies that ${playerName.textContent} is forcefully enrolled in this fabulous friendship. Escape is not an option.`, 60, 120, { maxWidth: doc.internal.pageSize.getWidth() - 120 });

  // download
  doc.save(`${playerName.textContent}_princess_booklet.pdf`);
};

// show QR modal
showQR.addEventListener('click', () => {
  // generate QR pointing to current page
  pageQR.innerHTML = '';
  const url = window.location.href;
  new QRCode(pageQR, { text: url, width: 300, height: 300, colorDark: "#2f0b2a", colorLight: "#fff7fb", correctLevel: QRCode.CorrectLevel.H });
  document.getElementById('qrModal').classList.remove('hidden');
});
closeQR.addEventListener('click', () => document.getElementById('qrModal').classList.add('hidden'));

// overlay enter logic
enterBtn.onclick = () => {
  overlay.style.display = 'none';
  startPortal();
};
sfxBtn.onclick = () => {
  state.sfxOn = !state.sfxOn;
  sfxBtn.textContent = state.sfxOn ? 'SFX: On' : 'SFX: Off';
};

// start portal
function startPortal() {
  spawnSparkles();
  makeMiniQR();
  renderQuestion();
}

// quick accessibility keys
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft') prevBtn.click();
  if (e.key === 'Enter' && overlay.style.display === 'none') nextBtn.click();
});

// small initialization
document.addEventListener('DOMContentLoaded', () => {
  quizContainer.innerHTML = '<p class="muted">Press Enter to begin your princess journey.</p>';
  controls.style.display = 'none';
  extraActions.style.display = 'none';
  // expose for debug/testing if needed
  window._PRINCESS_STATE = state;
});
