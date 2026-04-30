/* ================= STORAGE ================= */
const STORAGE = {
  users: 'labexplain_users',
  currentUser: 'labexplain_current_user',
  drafts: 'labexplain_drafts',
  sentForms: 'labexplain_sent_forms',
  lang: 'labexplain_preferred_lang',
  font: 'labexplain_preferred_font'
};

/* ================= DEMO USERS ================= */
const testUsers = [
  {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'patient@test.com',
    password: '1235',
    role: 'patient',
    antecedents: 'Asthme',
    traitements: 'Ventoline',
    allergies: 'Pollen',
    birthdate: '2015-05-12',
    gender: 'M',
    weight: 35,
    height: 140,
    consent: true
  },
  {
    nom: 'Martin',
    prenom: 'Dr',
    email: 'medecin@test.com',
    password: '1234',
    role: 'medecin',
    consent: true
  }
];

/* ================= TRANSLATIONS ================= */
const translations = {
  fr: {
    home: 'Accueil',
    form: 'Formulaire',
    login: 'Connexion',
    logout: 'Déconnexion',
    signup: 'Créer un compte',
    account: 'Compte ▾',
    myProfile: 'Mon profil',
    welcome: 'Bienvenue sur LabExplain',
    desc: 'Préparez votre consultation en toute sérénité.',
    tagline: 'Accessibilité • Préparation • Clarté',
    startNow: 'Commencer',
    medicalFrameTitle: 'Cadre médical',
    medicalFrameText: 'LabExplain ne pose aucun diagnostic et ne remplace pas un professionnel de santé.',
    contextTitle: '📌 Contexte',
    contextText: 'Stress, barrière de la langue, troubles de l’attention ou de la lecture : beaucoup de patients ont du mal à expliquer clairement leur situation.',
    solutionTitle: '💡 Solution LabExplain',
    solutionText: 'Un assistant guidé qui aide le patient à décrire ses symptômes, ses traitements et ses antécédents pour générer un résumé clair.',
    positionTitle: '⚖️ Positionnement',
    positionText: 'Un outil d’aide à la communication, pensé pour gagner du temps et améliorer l’échange avec le médecin.',
    valueTitle: '🚀 Valeur ajoutée',
    forPatient: 'Pour le patient',
    forPatientText: 'Moins de stress, moins d’oublis, plus d’autonomie et une meilleure préparation avant la consultation.',
    forDoctor: 'Pour le professionnel',
    forDoctorText: 'Des informations structurées et exploitables rapidement pour rendre la consultation plus efficace.',
    accessibilityTitle: '🧩 Accessibilité',
    accessibilityText: 'Choix de langue, polices adaptées, interface simple, parcours guidé, jargon limité et navigation pensée pour les profils fragiles.',
    teamLabel: 'Projet réalisé par :',
    noaccount: 'Pas de compte ?',
    badLogin: 'Email ou mot de passe incorrect.',
    logoutConfirm: 'Déconnexion effectuée.',
    selectDoctor: 'Choisir un médecin',
    next: 'Continuer',
    newForm: 'Nouveau formulaire',
    myDrafts: 'Brouillons',
    mySent: 'Mes envois',
    consultReceived: 'Consultations reçues',
    bot_hello: 'Bonjour. Pour quel médecin est le rendez-vous ?',
    question_urgency: 'Comment vous sentez-vous aujourd’hui ?',
    urgent_bad: 'Très mal',
    urgent_medium: 'Un peu mal',
    urgent_routine: 'Visite normale',
    question_redflags: 'Avez-vous une douleur thoracique intense, une difficulté à parler ou à respirer ?',
    yes: 'Oui',
    no: 'Non',
    emergency: '⚠️ Urgence possible : appelez le 15 ou rendez-vous aux urgences.',
    question_symptom: 'Quel est votre problème principal ?',
    symptom_pain: 'Douleur',
    symptom_fever: 'Fièvre',
    symptom_breath: 'Respiration',
    symptom_digestion: 'Ventre / digestion',
    question_pain_location: 'Où se situe la douleur ?',
    head: 'Tête',
    chest: 'Thorax',
    belly: 'Ventre',
    limbs: 'Bras / jambes',
    question_intensity: 'Intensité de la douleur (1 à 10)',
    question_breath_type: 'Quel type de gêne respiratoire ?',
    breath_short: 'Essoufflement',
    breath_cough: 'Toux',
    question_cough_type: 'La toux est-elle sèche ou grasse ?',
    cough_dry: 'Sèche',
    cough_wet: 'Grasse',
    question_duration: 'Depuis combien de temps ?',
    question_meds: 'Prenez-vous déjà quelque chose pour cela ?',
    question_notes: 'Souhaitez-vous ajouter une note utile pour le médecin ?',
    completed: 'Le formulaire est terminé.'
  },

  en: {
    home: 'Home',
    form: 'Form',
    login: 'Login',
    logout: 'Logout',
    signup: 'Create account',
    account: 'Account ▾',
    myProfile: 'My profile',
    welcome: 'Welcome to LabExplain',
    desc: 'Prepare your consultation with more confidence.',
    tagline: 'Accessibility • Preparation • Clarity',
    startNow: 'Start',
    medicalFrameTitle: 'Medical scope',
    medicalFrameText: 'LabExplain does not diagnose and does not replace a health professional.',
    contextTitle: '📌 Context',
    contextText: 'Stress, language barriers, attention or reading disorders: many patients struggle to explain their situation clearly.',
    solutionTitle: '💡 LabExplain solution',
    solutionText: 'A guided assistant helping patients describe symptoms, treatments and medical history to generate a clear summary.',
    positionTitle: '⚖️ Positioning',
    positionText: 'A communication support tool designed to save time and improve exchanges with the doctor.',
    valueTitle: '🚀 Added value',
    forPatient: 'For the patient',
    forPatientText: 'Less stress, fewer omissions, more autonomy and better preparation before the consultation.',
    forDoctor: 'For the professional',
    forDoctorText: 'Structured information that can be used quickly to make the consultation more efficient.',
    accessibilityTitle: '🧩 Accessibility',
    accessibilityText: 'Language choice, adapted fonts, simple interface, guided flow and reduced jargon.',
    teamLabel: 'Project made by:',
    noaccount: 'No account?',
    badLogin: 'Incorrect email or password.',
    logoutConfirm: 'Logged out.',
    selectDoctor: 'Choose a doctor',
    next: 'Continue',
    newForm: 'New form',
    myDrafts: 'Drafts',
    mySent: 'My submissions',
    consultReceived: 'Received consultations',
    bot_hello: 'Hello. Which doctor is the appointment with?',
    question_urgency: 'How do you feel today?',
    urgent_bad: 'Very bad',
    urgent_medium: 'A bit bad',
    urgent_routine: 'Routine visit',
    question_redflags: 'Do you have severe chest pain or trouble speaking or breathing?',
    yes: 'Yes',
    no: 'No',
    emergency: '⚠️ Possible emergency: call emergency services immediately.',
    question_symptom: 'What is the main issue?',
    symptom_pain: 'Pain',
    symptom_fever: 'Fever',
    symptom_breath: 'Breathing',
    symptom_digestion: 'Stomach / digestion',
    question_pain_location: 'Where is the pain located?',
    head: 'Head',
    chest: 'Chest',
    belly: 'Belly',
    limbs: 'Arms / legs',
    question_intensity: 'Pain intensity (1 to 10)',
    question_breath_type: 'What kind of breathing problem?',
    breath_short: 'Shortness of breath',
    breath_cough: 'Cough',
    question_cough_type: 'Is the cough dry or wet?',
    cough_dry: 'Dry',
    cough_wet: 'Wet',
    question_duration: 'How long has it lasted?',
    question_meds: 'Are you already taking something for it?',
    question_notes: 'Any extra note for the doctor?',
    completed: 'The form is complete.'
  },

  es: {
    home: 'Inicio',
    form: 'Formulario',
    login: 'Acceder',
    logout: 'Salir',
    signup: 'Crear cuenta',
    account: 'Cuenta ▾',
    myProfile: 'Mi perfil',
    welcome: 'Bienvenido a LabExplain',
    desc: 'Prepare su consulta con más serenidad.',
    tagline: 'Accesibilidad • Preparación • Claridad',
    startNow: 'Comenzar',
    medicalFrameTitle: 'Marco médico',
    medicalFrameText: 'LabExplain no da ningún diagnóstico y no sustituye a un profesional de la salud.',
    contextTitle: '📌 Contexto',
    contextText: 'Estrés, barrera del idioma, trastornos de atención o lectura: muchos pacientes tienen dificultades para explicar claramente su situación.',
    solutionTitle: '💡 Solución LabExplain',
    solutionText: 'Un asistente guiado que ayuda al paciente a describir sus síntomas, tratamientos y antecedentes para generar un resumen claro.',
    positionTitle: '⚖️ Posicionamiento',
    positionText: 'Una herramienta de apoyo a la comunicación diseñada para ahorrar tiempo y mejorar el intercambio con el médico.',
    valueTitle: '🚀 Valor añadido',
    forPatient: 'Para el paciente',
    forPatientText: 'Menos estrés, menos olvidos, más autonomía y una mejor preparación antes de la consulta.',
    forDoctor: 'Para el profesional',
    forDoctorText: 'Información estructurada y utilizable rápidamente para hacer la consulta más eficaz.',
    accessibilityTitle: '🧩 Accesibilidad',
    accessibilityText: 'Elección de idioma, fuentes adaptadas, interfaz simple y recorrido guiado.',
    teamLabel: 'Proyecto realizado por:',
    noaccount: '¿No tienes cuenta?',
    badLogin: 'Correo o contraseña incorrectos.',
    logoutConfirm: 'Sesión cerrada.',
    selectDoctor: 'Elegir un médico',
    next: 'Continuar',
    newForm: 'Nuevo formulario',
    myDrafts: 'Borradores',
    mySent: 'Mis envíos',
    consultReceived: 'Consultas recibidas',
    bot_hello: 'Hola. ¿Con qué médico es la cita?',
    question_urgency: '¿Cómo se siente hoy?',
    urgent_bad: 'Muy mal',
    urgent_medium: 'Un poco mal',
    urgent_routine: 'Visita normal',
    question_redflags: '¿Tiene un dolor fuerte en el pecho o dificultad para hablar o respirar?',
    yes: 'Sí',
    no: 'No',
    emergency: '⚠️ Posible urgencia: llame a emergencias inmediatamente.',
    question_symptom: '¿Cuál es su problema principal?',
    symptom_pain: 'Dolor',
    symptom_fever: 'Fiebre',
    symptom_breath: 'Respiración',
    symptom_digestion: 'Vientre / digestión',
    question_pain_location: '¿Dónde se encuentra el dolor?',
    head: 'Cabeza',
    chest: 'Pecho',
    belly: 'Vientre',
    limbs: 'Brazos / piernas',
    question_intensity: 'Intensidad del dolor (1 a 10)',
    question_breath_type: '¿Qué tipo de dificultad respiratoria?',
    breath_short: 'Falta de aire',
    breath_cough: 'Tos',
    question_cough_type: '¿La tos es seca o con mucosidad?',
    cough_dry: 'Seca',
    cough_wet: 'Grasa',
    question_duration: '¿Desde hace cuánto tiempo?',
    question_meds: '¿Ya está tomando algo para esto?',
    question_notes: '¿Desea añadir una nota útil para el médico?',
    completed: 'El formulario está terminado.'
  },

  ar: {
    home: 'الرئيسية',
    form: 'النموذج',
    login: 'دخول',
    logout: 'خروج',
    signup: 'إنشاء حساب',
    account: 'الحساب ▾',
    myProfile: 'ملفي',
    welcome: 'مرحباً بكم في LabExplain',
    desc: 'حضّر استشارتك بسهولة أكبر.',
    tagline: 'إمكانية الوصول • التحضير • الوضوح',
    startNow: 'ابدأ',
    medicalFrameTitle: 'الإطار الطبي',
    medicalFrameText: 'LabExplain لا يقدّم أي تشخيص ولا يَحلّ محلّ مختص صحي.',
    contextTitle: '📌 السياق',
    contextText: 'التوتر، حاجز اللغة، صعوبات الانتباه أو القراءة: كثير من المرضى يجدون صعوبة في شرح حالتهم بوضوح.',
    solutionTitle: '💡 حل LabExplain',
    solutionText: 'مساعد موجّه يساعد المريض على وصف الأعراض والعلاجات والسوابق الطبية لإنشاء ملخص واضح.',
    positionTitle: '⚖️ التموضع',
    positionText: 'أداة دعم للتواصل تهدف إلى توفير الوقت وتحسين التبادل مع الطبيب.',
    valueTitle: '🚀 القيمة المضافة',
    forPatient: 'للمريض',
    forPatientText: 'توتر أقل، نسيان أقل، استقلالية أكبر وتحضير أفضل قبل الاستشارة.',
    forDoctor: 'للمهني الصحي',
    forDoctorText: 'معلومات منظمة وقابلة للاستغلال بسرعة لجعل الاستشارة أكثر فعالية.',
    accessibilityTitle: '🧩 سهولة الوصول',
    accessibilityText: 'اختيار اللغة، خطوط مناسبة، واجهة بسيطة ومسار موجه.',
    teamLabel: 'المشروع من إنجاز:',
    noaccount: 'ليس لديك حساب؟',
    badLogin: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    logoutConfirm: 'تم تسجيل الخروج.',
    selectDoctor: 'اختر طبيباً',
    next: 'متابعة',
    newForm: 'نموذج جديد',
    myDrafts: 'المسودات',
    mySent: 'إرسالاتي',
    consultReceived: 'الاستشارات المستلمة',
    bot_hello: 'مرحباً. مع أي طبيب الموعد؟',
    question_urgency: 'كيف تشعر اليوم؟',
    urgent_bad: 'سيئ جداً',
    urgent_medium: 'سيئ قليلاً',
    urgent_routine: 'زيارة عادية',
    question_redflags: 'هل لديك ألم شديد في الصدر أو صعوبة في الكلام أو التنفس؟',
    yes: 'نعم',
    no: 'لا',
    emergency: '⚠️ حالة طارئة محتملة: اتصل بالطوارئ فوراً.',
    question_symptom: 'ما هي مشكلتك الرئيسية؟',
    symptom_pain: 'ألم',
    symptom_fever: 'حمّى',
    symptom_breath: 'تنفس',
    symptom_digestion: 'بطن / هضم',
    question_pain_location: 'أين يوجد الألم؟',
    head: 'الرأس',
    chest: 'الصدر',
    belly: 'البطن',
    limbs: 'الذراعان / الساقان',
    question_intensity: 'شدة الألم (1 إلى 10)',
    question_breath_type: 'ما نوع مشكلة التنفس؟',
    breath_short: 'ضيق تنفس',
    breath_cough: 'سعال',
    question_cough_type: 'هل السعال جاف أم رطب؟',
    cough_dry: 'جاف',
    cough_wet: 'رطب',
    question_duration: 'منذ متى؟',
    question_meds: 'هل تتناول شيئاً لهذا الآن؟',
    question_notes: 'هل تريد إضافة ملاحظة مفيدة للطبيب؟',
    completed: 'تم الانتهاء من النموذج.'

  }
};
/* ================= BOT STEPS ================= */
const botSteps = {
  start: { key: 'bot_hello', type: 'doctor', next: 'urgency' },
  urgency: {
    key: 'question_urgency',
    type: 'choice',
    next: 'redflags',
    options: [
      { value: 'urgent_bad', label: 'urgent_bad' },
      { value: 'urgent_medium', label: 'urgent_medium' },
      { value: 'urgent_routine', label: 'urgent_routine' }
    ]
  },
  redflags: {
    key: 'question_redflags',
    type: 'choice',
    options: [
      { value: 'yes', label: 'yes', next: 'emergency_stop' },
      { value: 'no', label: 'no', next: 'symptoms' }
    ]
  },
  emergency_stop: { key: 'emergency', type: 'final' },
  symptoms: {
    key: 'question_symptom',
    type: 'choice',
    options: [
      { value: 'symptom_pain', label: 'symptom_pain', next: 'pain_location' },
      { value: 'symptom_fever', label: 'symptom_fever', next: 'duration' },
      { value: 'symptom_breath', label: 'symptom_breath', next: 'breath_type' },
      { value: 'symptom_digestion', label: 'symptom_digestion', next: 'duration' }
    ]
  },
  pain_location: {
    key: 'question_pain_location',
    type: 'choice',
    next: 'intensity',
    options: [
      { value: 'head', label: 'head' },
      { value: 'chest', label: 'chest' },
      { value: 'belly', label: 'belly' },
      { value: 'limbs', label: 'limbs' }
    ]
  },
  intensity: {
    key: 'question_intensity',
    type: 'range',
    min: 1,
    max: 10,
    next: 'duration'
  },
  breath_type: {
    key: 'question_breath_type',
    type: 'choice',
    options: [
      { value: 'breath_short', label: 'breath_short', next: 'duration' },
      { value: 'breath_cough', label: 'breath_cough', next: 'cough_type' }
    ]
  },
  cough_type: {
    key: 'question_cough_type',
    type: 'choice',
    next: 'duration',
    options: [
      { value: 'cough_dry', label: 'cough_dry' },
      { value: 'cough_wet', label: 'cough_wet' }
    ]
  },
  duration: { key: 'question_duration', type: 'text', next: 'meds' },
  meds: { key: 'question_meds', type: 'text', next: 'notes' },
  notes: { key: 'question_notes', type: 'text', next: 'end' },
  end: { key: 'completed', type: 'final' }
};

/* ================= STATE ================= */
let chatData = null;
let currentStep = 'start';

/* ================= HELPERS ================= */
function getLang() {
  return localStorage.getItem(STORAGE.lang) || 'fr';
}

function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || translations.fr[key] || key;
}

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ================= USERS ================= */
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE.users) || '[]');
}

function setUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE.currentUser) || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
}

function seedUsers() {
  if (!getUsers().length) {
    setUsers(testUsers);
  }
}

function getDoctors() {
  return getUsers().filter(u => u.role === 'medecin');
}

/* ================= GLOBAL PREFS ================= */
function applyPreferences() {
  const lang = localStorage.getItem(STORAGE.lang) || 'fr';
  const font = localStorage.getItem(STORAGE.font) || 'standard';

  const langSelect = document.getElementById('lang');
  if (langSelect) langSelect.value = lang;

  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) fontSelect.value = font;

  applyLanguageOnly(lang);
  applyFont(font);
}

function applyLanguageOnly(lang) {
  document.documentElement.lang = lang;
  document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if ((translations[lang] || translations.fr)[key]) {
      el.textContent = (translations[lang] || translations.fr)[key];
    }
  });
}

function updateLanguage() {
  const langSelect = document.getElementById('lang');
  const lang = langSelect ? langSelect.value : getLang();

  localStorage.setItem(STORAGE.lang, lang);

  applyPreferences();
  refreshHeaderState();

  if (document.body.dataset.page === 'form') {
    renderMenu();
    refreshDynamicContentTranslations();
  }
}

/* ================= HEADER ================= */
function refreshHeaderState() {
  const user = getCurrentUser();
  const accountMenu = document.getElementById('accountMenu');
  const loginLink = document.getElementById('loginLink');

  if (accountMenu) accountMenu.hidden = !user;
  if (loginLink) loginLink.hidden = !!user;
}

/* ================= BIONIC ================= */
function removeBionicReading() {
  document.querySelectorAll('[data-original]').forEach(el => {
    el.innerHTML = el.dataset.original;
    delete el.dataset.original;
  });
}

function applyBionicReading(element) {
  if (!element.dataset.original) {
    element.dataset.original = element.innerHTML;
  }

  const text = element.innerText;

  const newHTML = text.split(/(\s+)/).map(word => {
    if (!word.trim()) return word;
    if (word.length < 3) return word;

    const boldPart = Math.ceil(word.length * 0.4);
    return `<b>${word.substring(0, boldPart)}</b>${word.substring(boldPart)}`;
  }).join('');

  element.innerHTML = newHTML;
}

/* ================= FONT ================= */
function applyFont(type) {
  document.body.classList.remove('font-malvoyant', 'font-dyslexique', 'font-tdah');

  if (type !== 'standard') {
    document.body.classList.add('font-' + type);
  }

  removeBionicReading();

  if (type === 'tdah') {
    document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, a, .bot-msg, .user-msg').forEach(el => {
      if (
        el.closest('button') ||
        el.closest('input') ||
        el.closest('textarea') ||
        el.closest('select')
      ) return;

      applyBionicReading(el);
    });
  }
}

function changePolice(type, save = true) {
  if (save) {
    localStorage.setItem(STORAGE.font, type);
  }
  applyFont(type);
}

/* ================= AUTH ================= */
function login() {
  const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('loginPassword')?.value;

  const user = getUsers().find(
    u => u.email.toLowerCase() === email && u.password === password
  );

  if (!user) {
    alert(t('badLogin'));
    return;
  }

  setCurrentUser(user);
  window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem(STORAGE.currentUser);
  alert(t('logoutConfirm'));
  window.location.href = 'index.html';
}

function checkAuthAndRedirect() {
  window.location.href = getCurrentUser() ? 'form.html' : 'auth.html';
}

function showProfile() {
  alert('Page profil à compléter.');
}

/* ================= CHAT ================= */
function startNewChat() {
  chatData = {
    id: Date.now(),
    answers: {},
    history: []
  };

  currentStep = 'start';

  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div id="chat-box"></div>
    <div id="input-area"></div>
  `;

  renderBotStep();
  setTimeout(applyPreferences, 0);
}

function appendHistory(role, text, translationKey = null) {
  if (!chatData) return;

  chatData.history.push({ role, text, translationKey });

  const box = document.getElementById('chat-box');
  if (!box) return;

  const displayText = role === 'bot' && translationKey ? t(translationKey) : text;
  box.innerHTML += `<div class="${role}-msg">${esc(displayText)}</div>`;
}

function renderBotStep() {
  if (!chatData) return;

  const step = botSteps[currentStep];
  const area = document.getElementById('input-area');
  if (!step || !area) return;

  appendHistory('bot', t(step.key), step.key);
  area.innerHTML = '';

  if (step.type === 'doctor') {
    const doctors = getDoctors();

    if (!doctors.length) {
      area.innerHTML = `<p>Aucun médecin disponible.</p>`;
      return;
    }

    area.innerHTML = `
      <label for="doctorSelect">${t('selectDoctor')}</label>
      <select id="doctorSelect">
        ${doctors.map(doc => {
          const name = `${doc.nom} ${doc.prenom}`;
          return `<option value="${esc(name)}">${esc(name)}</option>`;
        }).join('')}
      </select>
      <button type="button" onclick="processStep(document.getElementById('doctorSelect').value, document.getElementById('doctorSelect').value)">
        ${t('next')}
      </button>
    `;
  }

  else if (step.type === 'choice') {
    step.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = t(opt.label);
      btn.onclick = () => processStep(opt.value, t(opt.label), opt.next);
      area.appendChild(btn);
    });
  }

  else if (step.type === 'text') {
    area.innerHTML = `
      <input id="stepText" type="text" placeholder="...">
      <button type="button" onclick="processStep(document.getElementById('stepText').value, document.getElementById('stepText').value)">
        ${t('next')}
      </button>
    `;
  }

  else if (step.type === 'range') {
    area.innerHTML = `
      <input id="stepRange" type="range" min="${step.min}" max="${step.max}" value="5"
             oninput="document.getElementById('rangeValue').textContent = this.value">
      <div><strong id="rangeValue">5</strong></div>
      <button type="button" onclick="processStep(document.getElementById('stepRange').value, document.getElementById('stepRange').value)">
        ${t('next')}
      </button>
    `;
  }

  else if (step.type === 'final') {
    area.innerHTML = `<p>${t(step.key)}</p>`;
  }

  setTimeout(applyPreferences, 0);
}

function processStep(value, label, next = null) {
  if (!chatData) return;

  const cleanValue = String(value || '').trim();
  if (!cleanValue) return;

  appendHistory('user', label);

  if (currentStep === 'start') {
    chatData.answers.doctor = cleanValue;
  } else {
    chatData.answers[currentStep] = cleanValue;
  }

  currentStep = next || botSteps[currentStep].next;

  if (!currentStep) return;
  renderBotStep();
}
function renderMenu() {
  const user = getCurrentUser();
  const menu = document.getElementById('menuForm');
  if (!menu || !user) return;

  if (user.role === 'medecin') {
    menu.innerHTML = `
      <button type="button" onclick="loadSent()">${t('consultReceived')}</button>
    `;
  } else {
    menu.innerHTML = `
      <button type="button" onclick="startNewChat()">${t('newForm')}</button>
      <button type="button" onclick="loadDrafts()">${t('myDrafts')}</button>
      <button type="button" onclick="loadSent()">${t('mySent')}</button>
    `;
  }
}

function loadDrafts() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `<div class="card">Brouillons à compléter.</div>`;
  setTimeout(applyPreferences, 0);
}

function loadSent() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `<div class="card">Aucun envoi pour le moment.</div>`;
  setTimeout(applyPreferences, 0);
}
function refreshDynamicContentTranslations() {
  const page = document.body.dataset.page;
  if (page !== 'form') return;

  const content = document.getElementById('content');
  if (!content) return;

  if (document.getElementById('chat-box') && chatData) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    chatBox.innerHTML = '';

    chatData.history.forEach(item => {
      const displayText =
        item.role === 'bot' && item.translationKey
          ? t(item.translationKey)
          : item.text;

      chatBox.innerHTML += `<div class="${item.role}-msg">${esc(displayText)}</div>`;
    });

    const area = document.getElementById('input-area');
    if (area) {
      area.innerHTML = '';
    }

    const current = botSteps[currentStep];
    if (!current) return;

    if (current.type === 'doctor') {
      const doctors = getDoctors();

      if (!doctors.length) {
        area.innerHTML = `<p>${esc(t('selectDoctor'))}</p>`;
        return;
      }

      area.innerHTML = `
        <label for="doctorSelect">${t('selectDoctor')}</label>
        <select id="doctorSelect">
          ${doctors.map(doc => {
            const name = `${doc.nom} ${doc.prenom}`;
            return `<option value="${esc(name)}">${esc(name)}</option>`;
          }).join('')}
        </select>
        <button type="button" onclick="processStep(document.getElementById('doctorSelect').value, document.getElementById('doctorSelect').value)">
          ${t('next')}
        </button>
      `;
    }

    else if (current.type === 'choice') {
      current.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = t(opt.label);
        btn.onclick = () => processStep(opt.value, t(opt.label), opt.next);
        area.appendChild(btn);
      });
    }

    else if (current.type === 'text') {
      area.innerHTML = `
        <input id="stepText" type="text" placeholder="...">
        <button type="button" onclick="processStep(document.getElementById('stepText').value, document.getElementById('stepText').value)">
          ${t('next')}
        </button>
      `;
    }

    else if (current.type === 'range') {
      area.innerHTML = `
        <input id="stepRange" type="range" min="${current.min}" max="${current.max}" value="5"
               oninput="document.getElementById('rangeValue').textContent = this.value">
        <div><strong id="rangeValue">5</strong></div>
        <button type="button" onclick="processStep(document.getElementById('stepRange').value, document.getElementById('stepRange').value)">
          ${t('next')}
        </button>
      `;
    }

    else if (current.type === 'final') {
      area.innerHTML = `<p>${t(current.key)}</p>`;
    }

    setTimeout(applyPreferences, 0);
    return;
  }

  const user = getCurrentUser();
  if (!user) return;

  renderMenu();

  if (user.role === 'medecin') {
    loadSent();
  }
}

/* ================= INIT ================= */
function initPage() {
  seedUsers();
  applyPreferences();
  refreshHeaderState();

  const langSelect = document.getElementById('lang');
  if (langSelect) {
    langSelect.addEventListener('change', updateLanguage);
  }

  const fontSelect = document.getElementById('fontSelect');
  if (fontSelect) {
    fontSelect.addEventListener('change', () => {
      const value = fontSelect.value;
      localStorage.setItem(STORAGE.font, value);
      applyFont(value);
    });
  }

  const page = document.body.dataset.page;

  if (page === 'form') {
    const user = getCurrentUser();

    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    renderMenu();

    if (user.role === 'patient') {
      startNewChat();
    } else {
      loadSent();
    }
  }
}
document.addEventListener('DOMContentLoaded', initPage);