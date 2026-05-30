// ═══════════════════════════════════════════════════════
// CONFIG — Change BASE_IP to match your server
// ═══════════════════════════════════════════════════════
const BASE_IP = 'localhost';
const API_BASE = `http://${BASE_IP}/hospiq/`;
const IMAGE_BASE = `http://${BASE_IP}/hospiq/`;

// ═══════════════════════════════════════════════════════
// SESSION MANAGER
// ═══════════════════════════════════════════════════════
const Session = {
  save(data) {
    localStorage.setItem('hospiq_token', data.token || '');
    localStorage.setItem('hospiq_user_id', String(data.user_id || ''));
    localStorage.setItem('hospiq_role', data.role || '');
    localStorage.setItem('hospiq_name', data.name || '');
    localStorage.setItem('hospiq_phone', data.phone || '');
    localStorage.setItem('hospiq_profile_photo', data.profile_photo || '');
    localStorage.setItem('hospiq_hospital_id', String(data.hospital_id || ''));
    localStorage.setItem('hospiq_doctor_id', String(data.doctor_id || ''));
  },
  update(fields) { Object.entries(fields).forEach(([k, v]) => localStorage.setItem('hospiq_' + k, v || '')); },
  getToken() { return localStorage.getItem('hospiq_token'); },
  getUserId() { return parseInt(localStorage.getItem('hospiq_user_id')) || 0; },
  getRole() { return localStorage.getItem('hospiq_role') || ''; },
  getName() { return localStorage.getItem('hospiq_name') || ''; },
  getPhone() { return localStorage.getItem('hospiq_phone') || ''; },
  getProfilePhoto() { return localStorage.getItem('hospiq_profile_photo') || ''; },
  getHospitalId() { return parseInt(localStorage.getItem('hospiq_hospital_id')) || 0; },
  getDoctorId() { return parseInt(localStorage.getItem('hospiq_doctor_id')) || 0; },
  isLoggedIn() { return !!this.getToken(); },
  getInitials() {
    const parts = (this.getName() || '?').trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (this.getName() || '?').substring(0, 2).toUpperCase();
  },
  clear() { localStorage.clear(); }
};

// ═══════════════════════════════════════════════════════
// API LAYER
// ═══════════════════════════════════════════════════════
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (Session.getToken()) headers['Authorization'] = 'Bearer ' + Session.getToken();
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, options);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  } catch (e) { throw e; }
}

async function apiUpload(endpoint, formData) {
  const headers = {};
  if (Session.getToken()) headers['Authorization'] = 'Bearer ' + Session.getToken();
  const res = await fetch(API_BASE + endpoint, { method: 'POST', headers, body: formData });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Upload failed');
  return json.data;
}

const API = {
  login: (email, password) => apiCall('auth/login.php', 'POST', { email, password }),
  registerPatient: (body) => apiCall('auth/register_patient.php', 'POST', body),
  registerDoctor: (fd) => apiUpload('auth/register_doctor.php', fd),
  updateProfile: (fd) => apiUpload('auth/update_profile.php', fd),

  getAllHospitals: (lat, lng) => apiCall(`hospitals/get_all.php${lat ? `?lat=${lat}&lng=${lng}` : ''}`),
  getHospitalById: (id) => apiCall(`hospitals/get_by_id.php?id=${id}`),
  getNearbyHospitals: (lat, lng) => apiCall(`hospitals/get_nearby.php?lat=${lat}&lng=${lng}`),
  rateHospital: (body) => apiCall('hospitals/rate.php', 'POST', body),

  getDoctorsByHospital: (hospital_id) => apiCall(`doctors/get_by_hospital.php?hospital_id=${hospital_id}`),
  getDoctorProfile: (doctor_id) => apiCall(`doctors/get_profile.php?doctor_id=${doctor_id}`),
  getDoctorPatients: (doctor_id) => apiCall(`doctors/get_patients.php?doctor_id=${doctor_id}`),
  getAllDoctors: () => apiCall('doctors/get_all.php'),
  updateDoctorStatus: (doctor_id, status) => apiCall('doctors/update_status.php', 'POST', { doctor_id, status }),

  getAvailableSlots: (doctor_id, date) => apiCall(`slots/get_available.php?doctor_id=${doctor_id}&date=${date}`),
  createCustomSlots: (body) => apiCall('slots/create_custom_slots.php', 'POST', body),

  bookAppointment: (body) => apiCall('appointments/book.php', 'POST', body),
  getPatientAppointments: (patient_id) => apiCall(`appointments/get_patient.php?patient_id=${patient_id}`),
  getDoctorAppointments: (doctor_id) => apiCall(`appointments/get_doctor.php?doctor_id=${doctor_id}`),
  acceptAppointment: (appointment_id) => apiCall('appointments/accept.php', 'POST', { appointment_id }),
  rejectAppointment: (appointment_id) => apiCall('appointments/reject.php', 'POST', { appointment_id }),
  rescheduleAppointment: (body) => apiCall('appointments/reschedule.php', 'POST', body),
  cancelAppointment: (appointment_id) => apiCall('appointments/cancel.php', 'POST', { appointment_id }),
  submitAdvice: (appointment_id, doctor_advice) => apiCall('appointments/submit_advice.php', 'POST', { appointment_id, doctor_advice }),

  submitReport: (fd) => apiUpload('reports/submit_report.php', fd),
  getReports: (patient_id) => apiCall(`reports/get_report.php?patient_id=${patient_id}`),
  getReportByAppointment: (appointment_id) => apiCall(`reports/get_report.php?appointment_id=${appointment_id}`),
  editReport: async (report_id, health_status, notes) => {
    const fd = new FormData();
    fd.append('report_id', report_id);
    fd.append('health_status', health_status);
    fd.append('notes', notes);
    return apiUpload('reports/edit_report.php', fd);
  },
  deleteReport: (report_id) => apiCall(`reports/delete_report.php?report_id=${report_id}`, 'POST', {}),
  getNotifications: (user_id) => apiCall(`notifications/get.php?user_id=${user_id}`),
};

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
  const el = document.getElementById(viewId);
  if (el) { el.style.display = 'block'; el.classList.add('active'); }
  window.scrollTo(0, 0);
}

function goTo(page) { window.location.href = page; }

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('visible'), 10);
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3500);
}

function showLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'flex'; }
function hideLoader() { const l = document.getElementById('loader'); if (l) l.style.display = 'none'; }

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(s) {
  if (!s) return '';
  const [h, m] = s.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusBadge(status) {
  const map = {
    pending: ['#E0F4F4', '#0B6E6E', '⏳ Pending'],
    accepted: ['#E6F7F1', '#27AE7A', '✅ Accepted'],
    rejected: ['#FEF0ED', '#F26D50', '❌ Rejected'],
    completed: ['#E6F7F1', '#27AE7A', '✔ Completed'],
    rescheduled: ['#FFF8E1', '#F59E0B', '🔄 Rescheduled'],
    cancelled: ['#FEF0ED', '#F26D50', '🚫 Cancelled'],
  };
  const [bg, color, label] = map[status] || ['#E5E7EB', '#6B7280', status];
  return `<span class="badge" style="background:${bg};color:${color}">${label}</span>`;
}

function doctorStatusBadge(status) {
  const map = { available: ['#4CAF50', '✅ Available'], busy: ['#FF9800', '🕐 Busy'], in_surgery: ['#E91E63', '🔪 In Surgery'] };
  const [color, label] = map[status] || ['#9E9E9E', 'Offline'];
  return `<span class="pulse-badge" style="--pc:${color};background:${color}18;color:${color}"><span class="pulse-dot" style="background:${color}"></span>${label}</span>`;
}

function avatarHtml(photoPath, initials, size = 40, bg = '#0B6E6E') {
  if (photoPath) return `<img src="${IMAGE_BASE}${photoPath}" class="avatar" style="width:${size}px;height:${size}px;object-fit:cover" alt="">`;
  return `<div class="avatar-init" style="width:${size}px;height:${size}px;font-size:${Math.floor(size / 3)}px;background:${bg}">${initials}</div>`;
}

function starRatingHtml(rating) {
  let h = '';
  const r = parseFloat(rating) || 0;
  for (let i = 1; i <= 5; i++) {
    if (i <= r) h += `<i class="fas fa-star" style="color:#F59E0B;font-size:12px"></i>`;
    else if (i - 0.5 <= r) h += `<i class="fas fa-star-half-alt" style="color:#F59E0B;font-size:12px"></i>`;
    else h += `<i class="far fa-star" style="color:#E5E7EB;font-size:12px"></i>`;
  }
  return h;
}

function shimmer(count = 3, height = 80) {
  return Array(count).fill(`<div class="shimmer-card" style="height:${height}px"></div>`).join('');
}

function emptyState(emoji, title, subtitle, btnLabel = '', btnClick = '') {
  return `<div class="empty-state">
    <div class="empty-emoji">${emoji}</div>
    <h3>${title}</h3><p>${subtitle}</p>
    ${btnLabel ? `<button class="btn-primary" style="margin-top:16px;width:auto;padding:10px 24px" onclick="${btnClick}">${btnLabel}</button>` : ''}
  </div>`;
}

function hospitalCardHtml(h, onclick) {
  const img = h.photo ? `<img src="${IMAGE_BASE}uploads/hospitals/${h.photo}" alt="${h.name}" onerror="this.parentElement.innerHTML='<div class=card-img-placeholder>🏥</div>'">` : `<div class="card-img-placeholder">🏥</div>`;
  return `<div class="hospital-card" onclick="${onclick}">
    <div class="card-img">${img}</div>
    <div class="card-body">
      <div class="card-title">${h.name}</div>
      <div class="card-sub"><i class="fas fa-map-marker-alt"></i> ${h.city || ''}</div>
      <div class="card-row">
        <span class="type-badge">${h.type || ''}</span>
        <span style="font-size:12px">${starRatingHtml(h.avg_rating)} <small style="color:#6B7280">${parseFloat(h.avg_rating || 0).toFixed(1)} (${h.total_reviews || 0})</small></span>
      </div>
      <div class="card-sub"><i class="far fa-clock"></i> ${h.opening_hours || '9AM–9PM'} &nbsp;|&nbsp; <i class="fas fa-user-md"></i> ${h.doctor_count || 0} doctors</div>
      ${h.distance ? `<div class="card-sub"><i class="fas fa-location-arrow"></i> ${parseFloat(h.distance).toFixed(1)} km away</div>` : ''}
    </div>
  </div>`;
}

function appointmentCardHtml(appt, isDoctor = false) {
  const barColor = { pending: '#0B6E6E', accepted: '#27AE7A', completed: '#27AE7A', cancelled: '#F26D50', rejected: '#F26D50', rescheduled: '#F59E0B' }[appt.status] || '#6B7280';
  const name = isDoctor ? (appt.patient_name || 'Patient') : (appt.doctor_name || 'Doctor');
  const sub = isDoctor ? 'Patient' : (appt.specialization || '');
  return `<div class="appt-card" style="border-left:4px solid ${barColor}">
    <div class="appt-top">
      ${avatarHtml('', (name || '?').substring(0, 2).toUpperCase(), 44, isDoctor ? '#4F46E5' : '#0B6E6E')}
      <div class="appt-info">
        <div class="appt-name">${name}</div>
        <div class="appt-sub">${sub}${appt.hospital_name ? ' · ' + appt.hospital_name : ''}</div>
        <div class="appt-time"><i class="far fa-calendar"></i> ${formatDate(appt.appointment_date)} &nbsp; <i class="far fa-clock"></i> ${formatTime(appt.appointment_time)}</div>
        <div class="appt-type">${appt.consultation_type === 'video_call' ? '📹 Video Call' : '🏥 In-person'}</div>
      </div>
      ${statusBadge(appt.status)}
    </div>
    ${appt.illness_name ? `<div class="appt-illness">🤒 ${appt.illness_name}</div>` : ''}
    ${appt.doctor_advice ? `<div class="advice-box"><i class="fas fa-stethoscope"></i> ${appt.doctor_advice}</div>` : ''}
  </div>`;
}

function updateNav(active) {
  document.querySelectorAll('.nav-link, .nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('nav-' + active);
  if (el) el.classList.add('active');
}

function updateDoctorNav(active) {
  document.querySelectorAll('.nav-link, .nav-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('dnav-' + active);
  if (el) el.classList.add('active');
}

function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

function confirmDialog(msg, onYes) { if (confirm(msg)) onYes(); }

function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.innerHTML = '<i class="far fa-eye-slash"></i>'; }
  else { inp.type = 'password'; btn.innerHTML = '<i class="far fa-eye"></i>'; }
}

function previewPhoto(input, previewId) {
  if (!input.files || !input.files[0]) return;
  const preview = document.getElementById(previewId);
  if (!preview) return;
  const reader = new FileReader();
  reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
  reader.readAsDataURL(input.files[0]);
}

function showFieldError(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  if (show) el.classList.add('visible'); else el.classList.remove('visible');
}

function setFieldError(inputId, errId, show) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) { if (show) inp.classList.add('error'); else inp.classList.remove('error'); }
  if (err) { if (show) err.classList.add('visible'); else err.classList.remove('visible'); }
  return !show;
}

// ═══════════════════════════════════════════════════════
// NOTIFICATION POLLING
// ═══════════════════════════════════════════════════════
let _lastNotifCount = 0;
let _notifInterval = null;

async function pollNotifications() {
  if (!Session.isLoggedIn()) return;
  try {
    const data = await API.getNotifications(Session.getUserId());
    const notifs = data?.notifications || data || [];
    const unread = notifs.filter(n => !n.is_read);
    const count = unread.length;
    document.querySelectorAll('.notif-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    if (count > _lastNotifCount && count > 0) {
      const n = unread[0];
      showToast(`🔔 ${n.title}: ${n.body}`, 'info');
    }
    _lastNotifCount = count;
  } catch (e) { /* silent */ }
}

function startNotifPolling() {
  if (_notifInterval) clearInterval(_notifInterval);
  pollNotifications();
  _notifInterval = setInterval(pollNotifications, 30000);
}

// ═══════════════════════════════════════════════════════
// AUTH GUARDS
// ═══════════════════════════════════════════════════════
function requireAuth() {
  if (!Session.isLoggedIn()) { window.location.href = 'index.html'; return false; }
  return true;
}
function requirePatient() {
  if (!requireAuth()) return false;
  if (Session.getRole() !== 'patient') { window.location.href = 'doctor.html'; return false; }
  return true;
}
function requireDoctor() {
  if (!requireAuth()) return false;
  if (Session.getRole() !== 'doctor') { window.location.href = 'patient.html'; return false; }
  return true;
}

// ═══════════════════════════════════════════════════════
// INDEX PAGE LOGIC
// ═══════════════════════════════════════════════════════
function initSplash() {
  // Skip splash if already logged in — go straight to app
  if (Session.isLoggedIn()) {
    if (Session.getRole() === 'doctor') { goTo('doctor.html'); return; }
    else { goTo('patient.html'); return; }
  }
  showView('view-splash');
  setTimeout(() => {
    const splash = document.getElementById('view-splash');
    if (splash) splash.classList.add('fade-out');
    setTimeout(() => showView('view-login'), 500);
  }, 1500);
}

async function doLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass = document.getElementById('login-password')?.value;
  let valid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('login-email', 'login-email-err', true); valid = false;
  } else setFieldError('login-email', 'login-email-err', false);
  if (!pass) {
    setFieldError('login-password', 'login-pass-err', true); valid = false;
  } else setFieldError('login-password', 'login-pass-err', false);
  if (!valid) return;
  try {
    showLoader();
    const data = await API.login(email, pass);
    Session.save(data);
    hideLoader();
    if (data.role === 'doctor') goTo('doctor.html');
    else goTo('patient.html');
  } catch (e) {
    hideLoader();
    showToast(e.message || 'Login failed', 'error');
  }
}

async function doPatientSignup() {
  const name = document.getElementById('ps-name')?.value.trim();
  const email = document.getElementById('ps-email')?.value.trim();
  const phone = document.getElementById('ps-phone')?.value.trim();
  const pass = document.getElementById('ps-password')?.value;
  const confirm = document.getElementById('ps-confirm')?.value;
  let valid = true;
  if (!name) { setFieldError('ps-name', 'ps-name-err', true); valid = false; } else setFieldError('ps-name', 'ps-name-err', false);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('ps-email', 'ps-email-err', true); valid = false; } else setFieldError('ps-email', 'ps-email-err', false);
  if (!phone || !/^\d{10}$/.test(phone)) { setFieldError('ps-phone', 'ps-phone-err', true); valid = false; } else setFieldError('ps-phone', 'ps-phone-err', false);
  if (!pass || pass.length < 8) { setFieldError('ps-password', 'ps-pass-err', true); valid = false; } else setFieldError('ps-password', 'ps-pass-err', false);
  if (pass !== confirm) { setFieldError('ps-confirm', 'ps-confirm-err', true); valid = false; } else setFieldError('ps-confirm', 'ps-confirm-err', false);
  if (!valid) return;
  try {
    showLoader();
    const data = await API.registerPatient({ name, email, phone, password: pass });
    Session.save(data);
    hideLoader();
    goTo('patient.html');
  } catch (e) {
    hideLoader();
    showToast(e.message || 'Registration failed', 'error');
  }
}

// Doctor Register - 3-step wizard
let _drCurrentStep = 1;
let _drHospMode = 'join';
let _drHospList = [];

function drGoStep(step) {
  document.getElementById('dr-step-' + _drCurrentStep).classList.remove('active');
  _drCurrentStep = step;
  document.getElementById('dr-step-' + step).classList.add('active');
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('step-dot-' + i);
    if (i < step) { dot.classList.remove('active'); dot.classList.add('done'); }
    else if (i === step) { dot.classList.add('active'); dot.classList.remove('done'); }
    else { dot.classList.remove('active', 'done'); }
    if (i < 3) {
      const line = document.getElementById('step-line-' + i);
      if (line) { if (i < step) line.classList.add('done'); else line.classList.remove('done'); }
    }
  }
}

function drStep1Next() {
  const name = document.getElementById('dr-name')?.value.trim();
  const email = document.getElementById('dr-email')?.value.trim();
  const phone = document.getElementById('dr-phone')?.value.trim();
  const pass = document.getElementById('dr-password')?.value;
  const confirm = document.getElementById('dr-confirm')?.value;
  let valid = true;
  if (!name) { setFieldError('dr-name', 'dr-name-err', true); valid = false; } else setFieldError('dr-name', 'dr-name-err', false);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('dr-email', 'dr-email-err', true); valid = false; } else setFieldError('dr-email', 'dr-email-err', false);
  if (!phone || !/^\d{10}$/.test(phone)) { setFieldError('dr-phone', 'dr-phone-err', true); valid = false; } else setFieldError('dr-phone', 'dr-phone-err', false);
  if (!pass || pass.length < 8) { setFieldError('dr-password', 'dr-pass-err', true); valid = false; } else setFieldError('dr-password', 'dr-pass-err', false);
  if (pass !== confirm) { setFieldError('dr-confirm', 'dr-confirm-err', true); valid = false; } else setFieldError('dr-confirm', 'dr-confirm-err', false);
  if (valid) drGoStep(2);
}

function drStep2Next() {
  const license = document.getElementById('dr-license')?.value.trim();
  const spec = document.getElementById('dr-spec')?.value;
  const exp = document.getElementById('dr-exp')?.value;
  let valid = true;
  if (!license) { setFieldError('dr-license', 'dr-license-err', true); valid = false; } else setFieldError('dr-license', 'dr-license-err', false);
  if (!spec) { setFieldError('dr-spec', 'dr-spec-err', true); valid = false; } else setFieldError('dr-spec', 'dr-spec-err', false);
  if (!exp && exp !== '0') { setFieldError('dr-exp', 'dr-exp-err', true); valid = false; } else setFieldError('dr-exp', 'dr-exp-err', false);
  if (valid) {
    drGoStep(3);
    drLoadHospitals();
  }
}

async function drLoadHospitals() {
  try {
    const data = await API.getAllHospitals();
    _drHospList = data?.hospitals || data || [];
  } catch (e) { _drHospList = []; }
}

async function drSearchHospitals(q) {
  const dropdown = document.getElementById('dr-hosp-dropdown');
  if (!dropdown) return;
  if (!q.trim()) { dropdown.classList.remove('open'); return; }
  const results = _drHospList.filter(h => h.name?.toLowerCase().includes(q.toLowerCase()));
  if (!results.length) { dropdown.innerHTML = '<div class="dropdown-item text-gray">No hospitals found</div>'; dropdown.classList.add('open'); return; }
  dropdown.innerHTML = results.slice(0, 6).map(h =>
    `<div class="dropdown-item" onclick="drSelectHospital(${h.id},'${(h.name || '').replace(/'/g, "\\'")}')">
      🏥 ${h.name} <span style="color:var(--gray);font-size:12px">— ${h.city}</span>
    </div>`
  ).join('');
  dropdown.classList.add('open');
}

function drSelectHospital(id, name) {
  document.getElementById('dr-hosp-id').value = id;
  document.getElementById('dr-hosp-search').value = name;
  document.getElementById('dr-hosp-dropdown').classList.remove('open');
  const sel = document.getElementById('dr-hosp-selected');
  const selName = document.getElementById('dr-hosp-selected-name');
  if (sel) sel.style.display = 'block';
  if (selName) selName.textContent = '✅ ' + name;
}

function drToggleHospMode(mode) {
  _drHospMode = mode;
  document.getElementById('dr-hosp-join').style.display = mode === 'join' ? 'block' : 'none';
  document.getElementById('dr-hosp-new').style.display = mode === 'new' ? 'block' : 'none';
  document.getElementById('hosp-join-btn').classList.toggle('active', mode === 'join');
  document.getElementById('hosp-new-btn').classList.toggle('active', mode === 'new');
}

async function doDoctorRegister() {
  const fd = new FormData();
  fd.append('name', document.getElementById('dr-name')?.value.trim() || '');
  fd.append('email', document.getElementById('dr-email')?.value.trim() || '');
  fd.append('phone', document.getElementById('dr-phone')?.value.trim() || '');
  fd.append('password', document.getElementById('dr-password')?.value || '');
  fd.append('license_number', document.getElementById('dr-license')?.value.trim() || '');
  fd.append('specialization', document.getElementById('dr-spec')?.value || '');
  fd.append('years_experience', document.getElementById('dr-exp')?.value || '0');
  fd.append('bio', document.getElementById('dr-bio')?.value.trim() || '');
  fd.append('languages', document.getElementById('dr-langs')?.value.trim() || 'English');
  const photo = document.getElementById('dr-photo')?.files[0];
  if (photo) fd.append('profile_photo', photo);

  if (_drHospMode === 'join') {
    const hospId = document.getElementById('dr-hosp-id')?.value;
    if (!hospId) { setFieldError('dr-hosp-search', 'dr-hosp-err', true); return; }
    setFieldError('dr-hosp-search', 'dr-hosp-err', false);
    fd.append('hospital_id', hospId);
    fd.append('hospital_mode', 'join');
  } else {
    const nhName = document.getElementById('nh-name')?.value.trim();
    const nhCity = document.getElementById('nh-city')?.value.trim();
    const nhType = document.getElementById('nh-type')?.value;
    let valid = true;
    if (!nhName) { setFieldError('nh-name', 'nh-name-err', true); valid = false; } else setFieldError('nh-name', 'nh-name-err', false);
    if (!nhCity) { setFieldError('nh-city', 'nh-city-err', true); valid = false; } else setFieldError('nh-city', 'nh-city-err', false);
    if (!nhType) { setFieldError('nh-type', 'nh-type-err', true); valid = false; } else setFieldError('nh-type', 'nh-type-err', false);
    if (!valid) return;
    fd.append('hospital_mode', 'new');
    fd.append('hospital_name', nhName);
    fd.append('hospital_address', document.getElementById('nh-address')?.value.trim() || '');
    fd.append('hospital_city', nhCity);
    fd.append('hospital_type', nhType);
    const nhPhoto = document.getElementById('nh-photo')?.files[0];
    if (nhPhoto) fd.append('hospital_photo', nhPhoto);
  }

  try {
    showLoader();
    const data = await API.registerDoctor(fd);
    Session.save(data);
    hideLoader();
    goTo('doctor.html');
  } catch (e) {
    hideLoader();
    showToast(e.message || 'Registration failed', 'error');
  }
}

// ═══════════════════════════════════════════════════════
// PATIENT PAGE LOGIC
// ═══════════════════════════════════════════════════════
let _allHospitals = [];
let _filterType = 'all';
let _filterRating = 0;
let _allPatientAppts = [];
let _currentHospitalId = null;
let _currentDoctorId = null;
let _currentDoctorHospitalId = null;
let _selectedSlotId = null;
let _selectedDate = null;
let _selectedTime = null;
let _consultType = 'in_person';
let _userLat = 13.0827; // Default fallback to Chennai (matches Android app)
let _userLng = 80.2707;

// Try to get geolocation once on load
function tryGetLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        _userLat = pos.coords.latitude;
        _userLng = pos.coords.longitude;
        resolve({ lat: _userLat, lng: _userLng });
      },
      () => {
        // Silently resolve with defaults on deny/error
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}

async function loadHome() {
  updateNav('home');
  // Try get location first (await so we have coords before fetching)
  await tryGetLocation();

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greetEl = document.getElementById('home-greeting');
  if (greetEl) greetEl.textContent = `${greet}, ${Session.getName().split(' ')[0]} 👋`;

  // Avatar
  const avatarEl = document.getElementById('home-avatar');
  if (avatarEl) avatarEl.innerHTML = avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 36);

  // Load hospitals with location if available
  const hospEl = document.getElementById('home-hospitals');
  if (hospEl) {
    hospEl.innerHTML = shimmer(3, 200);
    try {
      const data = await API.getAllHospitals(_userLat, _userLng);
      _allHospitals = data?.hospitals || data || [];

      // "Near You" section: if we have location, sort by distance; else show all
      let nearbyList = [..._allHospitals];
      const locBanner = document.getElementById('home-loc-banner');
      if (_userLat && _userLng) {
        nearbyList = nearbyList.filter(h => h.distance != null && h.distance > 0).sort((a, b) => (a.distance || 999) - (b.distance || 999));
        if (locBanner) {
          locBanner.textContent = (_userLat === 13.0827 && _userLng === 80.2707) 
            ? '📍 Showing nearby hospitals (default location)' 
            : '📍 Sorted by distance from your location';
        }
      } else {
        if (locBanner) locBanner.textContent = '📍 Enable location for distance info';
      }
      hospEl.innerHTML = nearbyList.length ? nearbyList.map(h =>
        hospitalCardHtml(h, `openHospital(${h.id})`)
      ).join('') : emptyState('🏥', 'No hospitals', 'No hospitals found nearby');

      // Top rated section: always sorted by rating
      const topEl = document.getElementById('home-top-hospitals');
      if (topEl) {
        const sorted = [..._allHospitals].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        const displayList = sorted.slice(0, 3);
        topEl.innerHTML = displayList.map(h => hospitalCardHtml(h, `openHospital(${h.id})`)).join('');

        // Show "See All" link if there are more than 3 hospitals
        const seeAllBtn = document.getElementById('home-top-see-all');
        if (seeAllBtn) {
          seeAllBtn.style.display = sorted.length > 3 ? 'inline-block' : 'none';
        }
      }
    } catch (e) {
      hospEl.innerHTML = emptyState('⚠️', 'Failed to load', e.message || 'Could not load hospitals');
    }
  }

  // Load appointments
  const apptsEl = document.getElementById('home-appts');
  if (apptsEl) {
    apptsEl.innerHTML = shimmer(2, 80);
    try {
      const data = await API.getPatientAppointments(Session.getUserId());
      _allPatientAppts = data?.appointments || data || [];
      const active = _allPatientAppts.filter(a => a.status !== 'cancelled');
      if (!active.length) {
        apptsEl.innerHTML = `<div class="mini-appt-card" style="min-width:180px;border-left-color:var(--gray)">
          <div class="mini-appt-name" style="color:var(--gray)">No appointments</div>
          <div class="mini-appt-date">Book your first one!</div>
        </div>`;
      } else {
        apptsEl.innerHTML = active.slice(0, 5).map(a => `
          <div class="mini-appt-card" style="border-left-color:${{ pending: '#0B6E6E', accepted: '#27AE7A', completed: '#27AE7A', rescheduled: '#F59E0B', cancelled: '#F26D50', rejected: '#F26D50' }[a.status] || '#6B7280'}" onclick="openApptModal(${a.id})">
            <div class="mini-appt-name">${a.doctor_name || 'Doctor'}</div>
            <div class="mini-appt-date">${formatDate(a.appointment_date)} · ${statusBadge(a.status)}</div>
          </div>`
        ).join('');
      }

      // Doctor's advice
      const withAdvice = _allPatientAppts.filter(a => a.doctor_advice);
      const adviceSection = document.getElementById('home-advice-section');
      const adviceEl = document.getElementById('home-advice');
      if (withAdvice.length && adviceSection && adviceEl) {
        adviceSection.style.display = 'block';
        const grouped = {};
        withAdvice.forEach(a => {
          const key = a.doctor_name || 'Doctor';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(a);
        });
        adviceEl.innerHTML = Object.entries(grouped).map(([doc, appts]) => `
          <div class="card mb-12">
            <div style="font-weight:700;margin-bottom:8px;color:var(--teal)">👨‍⚕️ Dr. ${doc}</div>
            ${appts.map(a => `<div class="advice-box" style="margin-bottom:8px"><i class="fas fa-stethoscope"></i> ${a.doctor_advice}</div>`).join('')}
          </div>`
        ).join('');
      }
    } catch (e) {
      apptsEl.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
    }
  }
}

function openHospital(id) {
  _currentHospitalId = id;
  window._prevView = 'view-home';
  window._prevNav = 'home';
  showView('view-hospital-detail');
  loadHospitalDetail(id);
}

async function loadHospitalDetail(id) {
  const container = document.getElementById('hosp-detail-content');
  if (!container) return;
  container.innerHTML = shimmer(3, 120);
  try {
    // get_by_id.php returns the hospital object DIRECTLY (not nested under 'hospital')
    // and includes doctors[], facilities[], specialties[] directly on the object
    const data = await API.getHospitalById(id);
    // The PHP responds with the hospital as a flat object in data
    const h = data;
    const doctors = Array.isArray(data?.doctors) ? data.doctors : [];
    const facilities = Array.isArray(data?.facilities) ? data.facilities : [];
    const specialties = Array.isArray(data?.specialties) ? data.specialties : [];

    const img = h.photo ? `<img src="${IMAGE_BASE}uploads/hospitals/${h.photo}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=font-size:48px;display:flex;align-items:center;justify-content:center;height:100%>🏥</div>'">` : `<div style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%">🏥</div>`;

    container.innerHTML = `
      <div class="hero-img">${img}
        <div class="hero-overlay"><div class="hero-title">${h.name}</div><div class="hero-sub"><i class="fas fa-map-marker-alt"></i> ${h.city}</div></div>
      </div>

      <div class="detail-section">
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
          <span class="type-badge">${h.type}</span>
          <span>${starRatingHtml(h.avg_rating)} <span style="font-size:12px;color:#6B7280">${parseFloat(h.avg_rating || 0).toFixed(1)} (${h.total_reviews || 0} reviews)</span></span>
        </div>
        <div class="card-sub mt-8"><i class="far fa-clock"></i> ${h.opening_hours || '9:00 AM - 8:00 PM'}</div>
        <div class="card-sub mt-4"><i class="fas fa-map-marker-alt"></i> ${h.address || ''}
          ${h.latitude ? `<a href="https://maps.google.com/?q=${h.latitude},${h.longitude}" target="_blank" style="color:var(--teal);margin-left:6px;font-size:12px"><i class="fas fa-external-link-alt"></i> Map</a>` : ''}
        </div>
      </div>

      ${facilities.length ? `<div class="detail-section"><h3>Facilities</h3><div class="pill-row">${facilities.map(f => `<span class="pill pill-teal">${f.facility_name || f}</span>`).join('')}</div></div>` : ''}
      ${specialties.length ? `<div class="detail-section"><h3>Specialties</h3><div class="pill-row">${specialties.map(s => `<span class="pill pill-indigo">${s}</span>`).join('')}</div></div>` : ''}

      ${doctors.length ? `
      <div class="detail-section">
        <h3>Doctors at this hospital</h3>
        <div class="h-scroll" style="padding:0;margin-top:8px">
          ${doctors.map(d => {
            // get_by_id returns profile_photo field from the joined users table
            const photoField = d.profile_photo || d.photo || '';
            const docId = d.id || d.doctor_id;
            return `<div class="doctor-card" onclick="openDoctorProfile(${docId},${id})">
              ${avatarHtml(photoField, (d.name || 'Dr').substring(0, 2).toUpperCase(), 56, '#4F46E5')}
              <div class="doctor-card-name">${d.name}</div>
              <div class="doctor-card-spec">${d.specialization}</div>
              ${doctorStatusBadge(d.status)}
            </div>`;
          }).join('')}
        </div>
      </div>` : `<div class="detail-section"><p style="color:var(--gray);font-size:14px">No doctors listed at this hospital yet.</p></div>`}

      <div class="detail-section">
        <h3>Rate this Hospital</h3>
        <div class="star-interactive" id="hosp-stars">
          ${[1,2,3,4,5].map(i => `<i class="far fa-star" data-val="${i}" onclick="setHospRating(${i})"></i>`).join('')}
        </div>
        <textarea id="hosp-review" class="form-input mt-8" placeholder="Write a review (optional)..." rows="2"></textarea>
        <button class="btn-primary btn-sm mt-8" onclick="submitHospRating(${h.id})">Submit Rating</button>
      </div>
    `;
    window._currentHospData = { id, doctors };
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

let _hospRating = 0;
function setHospRating(val) {
  _hospRating = val;
  document.querySelectorAll('#hosp-stars i').forEach((el, i) => {
    el.className = i < val ? 'fas fa-star' : 'far fa-star';
    el.style.color = i < val ? '#F59E0B' : '#E5E7EB';
  });
}

async function submitHospRating(hospitalId) {
  if (!_hospRating) { showToast('Please select a rating', 'error'); return; }
  const review = document.getElementById('hosp-review')?.value.trim();
  try {
    showLoader();
    await API.rateHospital({ hospital_id: hospitalId, patient_id: Session.getUserId(), rating: _hospRating, review });
    hideLoader();
    showToast('Thank you! Rating submitted successfully.', 'success');
    // Reset stars and textarea
    _hospRating = 0;
    setHospRating(0);
    const rv = document.getElementById('hosp-review');
    if (rv) rv.value = '';
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

function bookFromHospital() {
  const data = window._currentHospData;
  if (data?.doctors?.length) {
    openDoctorProfile(data.doctors[0].id || data.doctors[0].doctor_id, data.id);
  } else {
    showToast('No doctors available at this hospital', 'info');
  }
}

function openDoctorProfile(doctorId, hospitalId) {
  _currentDoctorId = doctorId;
  _currentDoctorHospitalId = hospitalId || _currentHospitalId;
  // Track where we came from so back button works correctly
  if (!window._prevView || window._prevView === 'view-doctor-profile') {
    window._prevView = _currentHospitalId ? 'view-hospital-detail' : 'view-home';
  }
  showView('view-doctor-profile');
  loadDoctorProfile(doctorId);
}

async function loadDoctorProfile(doctorId) {
  const container = document.getElementById('doc-profile-content');
  if (!container) return;
  container.innerHTML = shimmer(2, 120);
  try {
    const data = await API.getDoctorProfile(doctorId);
    // get_profile.php returns the doctor as a FLAT object directly in data (not nested)
    // Fields: id, user_id, hospital_id, specialization, years_experience, bio, status,
    //         rating, total_patients, languages, name, email, phone, photo, hospital_name
    const d = data;
    if (!d || !d.name) throw new Error('Doctor not found. Please try again.');
    _currentDoctorId = d.id; // Always set to resolved doctor profile ID to avoid collisions
    // Photo field from get_profile is 'photo' (aliased from users.profile_photo)
    const doctorPhoto = d.photo || '';
    _selectedSlotId = null; _selectedDate = null; _selectedTime = null; _consultType = 'in_person';

    container.innerHTML = `
      <div class="doctor-hero">
        ${avatarHtml(doctorPhoto, (d.name || 'Dr').substring(0, 2).toUpperCase(), 88, '#4F46E5')}
        <div class="doctor-hero-name">${d.name}</div>
        <div class="doctor-hero-spec">${d.specialization || ''}</div>
        <div class="doctor-hero-meta">
          <span><i class="fas fa-briefcase"></i> ${d.years_experience || 0} yrs exp</span>
          <span><i class="fas fa-hospital"></i> ${d.hospital_name || ''}</span>
          ${doctorStatusBadge(d.status)}
        </div>
        <div class="doctor-stats-row">
          <div class="doctor-stat"><div class="doctor-stat-num">${d.total_patients || 0}</div><div class="doctor-stat-label">Patients</div></div>
          <div class="doctor-stat"><div class="doctor-stat-num">${parseFloat(d.rating || 0).toFixed(1)}</div><div class="doctor-stat-label">Rating</div></div>
          <div class="doctor-stat"><div class="doctor-stat-num">${d.years_experience || 0}</div><div class="doctor-stat-label">Exp (yrs)</div></div>
        </div>
      </div>

      <div class="tab-bar">
        <button class="tab-btn" onclick="switchDrTab('about',this)">About</button>
        <button class="tab-btn active" onclick="switchDrTab('schedule',this)">Schedule</button>
        <button class="tab-btn" onclick="switchDrTab('reviews',this)">Reviews</button>
      </div>

      <!-- About Tab -->
      <div id="dr-tab-about" class="tab-panel" style="padding:16px">
        <div class="card mb-12">
          <h4 style="font-size:13px;color:var(--gray);margin-bottom:6px">ABOUT</h4>
          <p style="font-size:14px;line-height:1.6">${d.bio || 'No bio available.'}</p>
          <button class="btn-primary mt-12" onclick="switchDrTab('schedule', document.querySelectorAll('.tab-bar .tab-btn')[1])">Book Appointment Now</button>
        </div>
        <div class="card mb-12">
          <h4 style="font-size:13px;color:var(--gray);margin-bottom:6px">LANGUAGES</h4>
          <div class="pill-row">${(d.languages || 'English').split(',').map(l => `<span class="pill pill-teal">${l.trim()}</span>`).join('')}</div>
        </div>
        <div class="card">
          <h4 style="font-size:13px;color:var(--gray);margin-bottom:8px">STATS</h4>
          <div style="display:flex;gap:20px">
            <div><div style="font-size:22px;font-weight:800;color:var(--teal)">${d.total_patients || 0}</div><div style="font-size:12px;color:var(--gray)">Patients</div></div>
            <div><div style="font-size:22px;font-weight:800;color:var(--teal)">${d.years_experience || 0}</div><div style="font-size:12px;color:var(--gray)">Yrs Exp</div></div>
            <div><div style="font-size:22px;font-weight:800;color:var(--teal)">${parseFloat(d.rating || 0).toFixed(1)}</div><div style="font-size:12px;color:var(--gray)">Rating</div></div>
          </div>
        </div>
      </div>

      <!-- Schedule Tab -->
      <div id="dr-tab-schedule" class="tab-panel active" style="padding:0">
        <div class="date-strip" id="dr-date-strip"></div>
        <div id="dr-slot-area"><p style="padding:16px;color:var(--gray);font-size:14px">Select a date to see available slots</p></div>
        <div style="padding:0 16px 8px">
          <p class="form-label">Consultation Type</p>
          <div class="consult-type-row" style="padding:0;margin-top:8px">
            <button class="consult-btn active" id="ctype-inperson" onclick="setConsultType('in_person')">🏥 In-person</button>
            <button class="consult-btn" id="ctype-video" onclick="setConsultType('video_call')">📹 Video Call</button>
          </div>
        </div>
        <div style="padding:16px">
          <button class="btn-primary" id="confirm-appt-btn" onclick="openBookingSymptomsModal()" disabled style="opacity:0.5">Select a date and slot to book</button>
        </div>
      </div>

      <!-- Reviews Tab -->
      <div id="dr-tab-reviews" class="tab-panel" style="padding:16px">
        <div class="card">
          <div style="text-align:center;margin-bottom:16px">
            <div style="font-size:48px;font-weight:800;color:var(--teal)">${parseFloat(d.rating || 0).toFixed(1)}</div>
            <div>${starRatingHtml(d.rating)}</div>
            <div style="font-size:13px;color:var(--gray);margin-top:4px">${d.total_patients || 0} patients</div>
          </div>
        </div>
      </div>
    `;

    // Build 7-day date strip
    buildDateStrip(d.id);
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

function switchDrTab(name, btn) {
  ['about', 'schedule', 'reviews'].forEach(t => {
    const panel = document.getElementById('dr-tab-' + t);
    if (panel) panel.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('dr-tab-' + name);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

function buildDateStrip(doctorId) {
  const strip = document.getElementById('dr-date-strip');
  if (!strip) return;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    html += `<div class="date-pill" data-date="${dateStr}" onclick="selectBookingDate('${dateStr}', ${doctorId}, this)">
      <span class="day">${days[d.getDay()]}</span>
      <span class="num">${d.getDate()}</span>
    </div>`;
  }
  strip.innerHTML = html;
  setTimeout(() => {
    const firstPill = strip.querySelector('.date-pill');
    if (firstPill) firstPill.click();
  }, 50);
}

async function selectBookingDate(date, doctorId, el) {
  _selectedDate = date;
  _selectedSlotId = null; _selectedTime = null;
  document.querySelectorAll('.date-pill').forEach(p => p.classList.remove('selected'));
  if (el) el.classList.add('selected');
  const slotArea = document.getElementById('dr-slot-area');
  if (!slotArea) return;
  slotArea.innerHTML = `<div style="padding:16px">${shimmer(1, 60)}</div>`;
  try {
    const data = await API.getAvailableSlots(doctorId, date);
    const slots = data?.slots || data || [];
    if (!slots.length) {
      slotArea.innerHTML = `<p style="padding:16px;color:var(--gray);font-size:14px">No slots available for this date</p>`;
      return;
    }
    slotArea.innerHTML = `<div class="slot-grid">
      ${slots.map(s => `<div class="slot-pill ${s.is_booked ? 'booked' : ''}" id="slot-${s.id}"
        onclick="${s.is_booked ? '' : `selectSlot(${s.id}, '${s.slot_time}', this)`}">
        ${formatTime(s.slot_time)}
      </div>`).join('')}
    </div>`;
  } catch (e) {
    slotArea.innerHTML = `<p style="padding:16px;color:var(--coral);font-size:14px">${e.message}</p>`;
  }
  updateBookBtn();
}

function selectSlot(id, time, el) {
  document.querySelectorAll('.slot-pill').forEach(p => p.classList.remove('selected'));
  if (el) el.classList.add('selected');
  _selectedSlotId = id;
  _selectedTime = time;
  updateBookBtn();
}

function setConsultType(type) {
  _consultType = type;
  document.getElementById('ctype-inperson')?.classList.toggle('active', type === 'in_person');
  document.getElementById('ctype-video')?.classList.toggle('active', type === 'video_call');
}

function openBookingSymptomsModal() {
  if (!_selectedDate || !_selectedSlotId) return;
  
  // Clear modal inputs
  const nameEl = document.getElementById('book-illness-name');
  if (nameEl) nameEl.value = '';
  const descEl = document.getElementById('book-illness-desc');
  if (descEl) descEl.value = '';
  const precEl = document.getElementById('book-precautions');
  if (precEl) precEl.value = '';
  
  // Disable submit button by default since Illness Name is empty
  const submitBtn = document.getElementById('btn-submit-booking');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
  }
  
  openModal('booking-symptoms-modal');
}

function validateSymptomForm() {
  const nameVal = document.getElementById('book-illness-name')?.value.trim() || '';
  const submitBtn = document.getElementById('btn-submit-booking');
  if (submitBtn) {
    const valid = nameVal.length > 0;
    submitBtn.disabled = !valid;
    submitBtn.style.opacity = valid ? '1' : '0.5';
  }
}

async function submitBookingFlow() {
  closeModal('booking-symptoms-modal');
  await confirmBooking();
}

function updateBookBtn() {
  const btn = document.getElementById('confirm-appt-btn');
  if (!btn) return;
  const ready = _selectedDate && _selectedSlotId;
  btn.disabled = !ready;
  btn.style.opacity = ready ? '1' : '0.5';
  btn.textContent = ready ? 'Confirm Appointment' : 'Select a date and slot to book';
}

async function confirmBooking() {
  if (!_selectedDate || !_selectedSlotId) return;
  const body = {
    patient_id: Session.getUserId(),
    doctor_id: _currentDoctorId,
    hospital_id: _currentDoctorHospitalId || _currentHospitalId,
    slot_id: _selectedSlotId,
    appointment_date: _selectedDate,
    appointment_time: _selectedTime,
    consultation_type: _consultType,
    illness_name: document.getElementById('book-illness-name')?.value.trim() || '',
    illness_description: document.getElementById('book-illness-desc')?.value.trim() || '',
    precautions: document.getElementById('book-precautions')?.value.trim() || '',
  };
  try {
    showLoader();
    const data = await API.bookAppointment(body);
    hideLoader();
    const appt = data?.appointment || data;
    loadAppointmentConfirm(appt || body);
  } catch (e) {
    hideLoader();
    showToast(e.message || 'Booking failed', 'error');
  }
}

function loadAppointmentConfirm(appt) {
  showView('view-appointment-confirm');
  const container = document.getElementById('confirm-details');
  if (!container) return;
  container.innerHTML = `
    <div class="confirm-row"><span class="confirm-key">Doctor</span><span class="confirm-val">${appt.doctor_name || 'Doctor'}</span></div>
    <div class="confirm-row"><span class="confirm-key">Hospital</span><span class="confirm-val">${appt.hospital_name || ''}</span></div>
    <div class="confirm-row"><span class="confirm-key">Date</span><span class="confirm-val">${formatDate(appt.appointment_date)}</span></div>
    <div class="confirm-row"><span class="confirm-key">Time</span><span class="confirm-val">${formatTime(appt.appointment_time)}</span></div>
    <div class="confirm-row"><span class="confirm-key">Type</span><span class="confirm-val">${appt.consultation_type === 'video_call' ? '📹 Video Call' : '🏥 In-person'}</span></div>
    <div class="confirm-row"><span class="confirm-key">Status</span><span class="confirm-val">${statusBadge('pending')}</span></div>
  `;
}

// ── APPOINTMENTS ──
async function loadAppointments() {
  updateNav('appointments');
  const container = document.getElementById('appt-list');
  if (!container) return;
  container.innerHTML = shimmer(3, 100);
  try {
    const data = await API.getPatientAppointments(Session.getUserId());
    _allPatientAppts = data?.appointments || data || [];
    renderAppts('all');
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

function renderAppts(filter) {
  const container = document.getElementById('appt-list');
  if (!container) return;
  let list = _allPatientAppts;
  if (filter === 'upcoming') list = list.filter(a => ['pending', 'accepted', 'rescheduled'].includes(a.status));
  else if (filter === 'completed') list = list.filter(a => a.status === 'completed');
  else if (filter === 'cancelled') list = list.filter(a => ['cancelled', 'rejected'].includes(a.status));
  if (!list.length) {
    container.innerHTML = emptyState('📋', 'No appointments', filter === 'all' ? 'Book your first appointment!' : `No ${filter} appointments`, 'Find a Doctor', "showView('view-search');updateNav('search')");
    return;
  }
  container.innerHTML = list.map(appt => {
    const canCancel = ['pending', 'accepted', 'rescheduled'].includes(appt.status);
    return `<div onclick="openApptModal(${appt.id})">${appointmentCardHtml(appt, false)}</div>
    ${canCancel ? `<button class="btn-danger btn-sm" style="margin:-6px 0 12px;width:100%" onclick="event.stopPropagation();cancelAppt(${appt.id})">Cancel Appointment</button>` : ''}`;
  }).join('');
}

function filterAppts(filter, btn) {
  document.querySelectorAll('#appt-filters .chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAppts(filter);
}

function cancelAppt(id) {
  confirmDialog('Cancel this appointment?', async () => {
    try {
      showLoader();
      await API.cancelAppointment(id);
      hideLoader();
      showToast('Appointment cancelled', 'success');
      await loadAppointments();
    } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
  });
}

function openApptModal(id) {
  const appt = _allPatientAppts.find(a => a.id == id);
  if (!appt) return;
  const container = document.getElementById('appt-modal-content');
  if (!container) return;
  const canCancel = ['pending', 'accepted'].includes(appt.status);
  container.innerHTML = `
    <h3 class="modal-title">Appointment Details</h3>
    ${appointmentCardHtml(appt, false)}
    <div class="mt-12" style="background:var(--app-bg);border-radius:var(--r-md);padding:14px">
      <div class="confirm-row"><span class="confirm-key">Date</span><span class="confirm-val">${formatDate(appt.appointment_date)}</span></div>
      <div class="confirm-row"><span class="confirm-key">Time</span><span class="confirm-val">${formatTime(appt.appointment_time)}</span></div>
      <div class="confirm-row"><span class="confirm-key">Type</span><span class="confirm-val">${appt.consultation_type === 'video_call' ? '📹 Video Call' : '🏥 In-person'}</span></div>
      ${appt.illness_name ? `<div class="confirm-row"><span class="confirm-key">Illness</span><span class="confirm-val">${appt.illness_name}</span></div>` : ''}
      ${appt.illness_description ? `<div class="confirm-row"><span class="confirm-key">Description</span><span class="confirm-val">${appt.illness_description}</span></div>` : ''}
      ${appt.precautions ? `<div class="confirm-row"><span class="confirm-key">Precautions</span><span class="confirm-val">${appt.precautions}</span></div>` : ''}
    </div>
    ${appt.doctor_advice ? `<div class="advice-box mt-12"><i class="fas fa-stethoscope"></i> <strong>Doctor's Advice:</strong> ${appt.doctor_advice}</div>` : ''}
    ${canCancel ? `<button class="btn-danger mt-16" onclick="closeModal('appt-modal');cancelAppt(${appt.id})">Cancel Appointment</button>` : ''}
    <button class="btn-secondary mt-8" onclick="closeModal('appt-modal')">Close</button>
  `;
  openModal('appt-modal');
}

// ── SEARCH ──
let _searchTypeFilter = 'all';
let _searchRatingFilter = 0;
let _searchDebounce = null;

async function loadSearch() {
  if (!_allHospitals.length) {
    try { const d = await API.getAllHospitals(); _allHospitals = d?.hospitals || d || []; } catch (e) { }
  }
}

function doSearch(q) {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => runSearch(q), 300);
}

function runSearch(q) {
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!q.trim()) {
    container.innerHTML = document.getElementById('search-default-content')?.innerHTML || '';
    return;
  }
  let results = _allHospitals.filter(h => (h.name || '').toLowerCase().includes(q.toLowerCase()) || (h.city || '').toLowerCase().includes(q.toLowerCase()));
  if (_searchTypeFilter !== 'all') results = results.filter(h => h.type === _searchTypeFilter);
  if (_searchRatingFilter > 0) results = results.filter(h => (h.avg_rating || 0) >= _searchRatingFilter);
  if (!results.length) { container.innerHTML = emptyState('🔍', 'No results', 'Try a different search term'); return; }
  container.innerHTML = `<div style="padding:8px 16px 16px">${results.map(h => hospitalCardHtml(h, `openHospital(${h.id})`)).join('')}</div>`;
}

function filterBySpec(spec) {
  const input = document.getElementById('search-input');
  if (input) { input.value = spec; doSearch(spec); }
}

function setTypeFilter(type, btn) {
  _searchTypeFilter = type;
  document.querySelectorAll('#type-filter-chips .chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function setRatingFilter(rating, btn) {
  _searchRatingFilter = rating;
  document.querySelectorAll('#rating-filter-chips .chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function resetFilters() {
  _searchTypeFilter = 'all'; _searchRatingFilter = 0;
  document.querySelectorAll('#type-filter-chips .chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('#rating-filter-chips .chip').forEach(c => c.classList.remove('active'));
  const allType = document.querySelector('#type-filter-chips [data-type="all"]');
  const anyRating = document.querySelector('#rating-filter-chips [data-rating="0"]');
  if (allType) allType.classList.add('active');
  if (anyRating) anyRating.classList.add('active');
}

function applyFilters() {
  closeModal('filter-modal');
  const q = document.getElementById('search-input')?.value || '';
  runSearch(q);
}

// ── NOTIFICATIONS ──
async function loadPatientNotifications() {
  const container = document.getElementById('notif-list');
  if (!container) return;
  container.innerHTML = shimmer(3, 70);
  try {
    const data = await API.getNotifications(Session.getUserId());
    const notifs = data?.notifications || data || [];
    if (!notifs.length) { container.innerHTML = emptyState('🔔', 'No notifications', 'You\'re all caught up!'); return; }
    const icons = { appointment: '📅', status: '✅', rating: '⭐', general: '🔔' };
    container.innerHTML = notifs.map(n => `
      <div class="notif-card ${!n.is_read ? 'unread' : ''}" onclick="this.classList.remove('unread')">
        <div class="notif-icon">${icons[n.type] || '🔔'}</div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-text">${n.body}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

// ── PROFILE ──
async function loadProfile() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  container.innerHTML = shimmer(2, 80);
  try {
    const data = await API.getPatientAppointments(Session.getUserId());
    const appts = data?.appointments || data || [];
    const notif = localStorage.getItem('hospiq_notif_pref') !== 'false';

    container.innerHTML = `
      <div class="profile-header">
        <div style="cursor:pointer" onclick="openEditProfileModal()">
          ${avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 88)}
        </div>
        <div class="profile-name">${Session.getName()}</div>
        <div class="profile-sub">Patient Account</div>
        <div class="profile-stats">
          <div class="profile-stat"><div class="profile-stat-num">${appts.length}</div><div class="profile-stat-label">Appointments</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${appts.filter(a => a.status === 'completed').length}</div><div class="profile-stat-label">Completed</div></div>
        </div>
      </div>
      <div class="menu-list">
        <div class="menu-item" onclick="openModal('reports-modal');loadHealthReports()">
          <div class="menu-item-icon"><i class="fas fa-file-medical"></i></div>
          <div class="menu-item-text">My Health Reports</div>
          <i class="fas fa-chevron-right menu-item-chevron"></i>
        </div>
        <div class="menu-item" id="notif-toggle-item" onclick="toggleNotifPref()">
          <div class="menu-item-icon"><i class="fas fa-bell"></i></div>
          <div class="menu-item-text">Notifications</div>
          <div class="toggle-switch ${notif ? 'on' : ''}" id="notif-toggle"></div>
        </div>
        <div class="menu-item" onclick="confirmDialog('Are you sure you want to log out?', () => { Session.clear(); goTo(\'index.html\'); })">
          <div class="menu-item-icon danger"><i class="fas fa-sign-out-alt"></i></div>
          <div class="menu-item-text danger">Log Out</div>
          <i class="fas fa-chevron-right menu-item-chevron"></i>
        </div>
      </div>`;
  } catch (e) {
    container.innerHTML = `<div class="profile-header">
      ${avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 88)}
      <div class="profile-name">${Session.getName()}</div>
      <div class="profile-sub">Patient Account</div>
    </div>
    <div class="menu-list">
      <div class="menu-item" onclick="confirmDialog('Log out?', () => { Session.clear(); goTo(\'index.html\'); })">
        <div class="menu-item-icon danger"><i class="fas fa-sign-out-alt"></i></div>
        <div class="menu-item-text danger">Log Out</div>
      </div>
    </div>`;
  }
}

function toggleNotifPref() {
  const curr = localStorage.getItem('hospiq_notif_pref') !== 'false';
  localStorage.setItem('hospiq_notif_pref', !curr);
  const toggle = document.getElementById('notif-toggle');
  if (toggle) toggle.classList.toggle('on', !curr);
}

function openEditProfileModal() {
  const preview = document.getElementById('ep-avatar-preview');
  if (preview) preview.innerHTML = avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 80);
  const nameEl = document.getElementById('ep-name');
  const phoneEl = document.getElementById('ep-phone');
  if (nameEl) nameEl.value = Session.getName();
  if (phoneEl) phoneEl.value = Session.getPhone();
  openModal('edit-profile-modal');
}

function previewEpPhoto(input) {
  if (!input.files?.[0]) return;
  const preview = document.getElementById('ep-avatar-preview');
  if (!preview) return;
  const reader = new FileReader();
  reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`; };
  reader.readAsDataURL(input.files[0]);
}

async function saveEditProfile() {
  const fd = new FormData();
  fd.append('user_id', Session.getUserId());
  fd.append('name', document.getElementById('ep-name')?.value.trim() || '');
  fd.append('phone', document.getElementById('ep-phone')?.value.trim() || '');
  const photo = document.getElementById('ep-photo')?.files[0];
  if (photo) fd.append('profile_photo', photo);
  try {
    showLoader();
    const data = await API.updateProfile(fd);
    Session.update({ name: data.name || document.getElementById('ep-name')?.value, phone: data.phone || document.getElementById('ep-phone')?.value, profile_photo: data.profile_photo || Session.getProfilePhoto() });
    hideLoader();
    closeModal('edit-profile-modal');
    showToast('Profile updated!', 'success');
    loadProfile();
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

async function loadHealthReports() {
  const container = document.getElementById('reports-content');
  if (!container) return;
  container.innerHTML = shimmer(2, 80);
  try {
    const data = await API.getReports(Session.getUserId());
    const reports = data?.reports || data || [];
    if (!reports.length) { container.innerHTML = emptyState('📋', 'No reports', 'No health reports found'); return; }
    const statusClass = { Stable: 'health-badge-stable', Improving: 'health-badge-improving', Critical: 'health-badge-critical' };
    container.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-header">
          <span style="font-size:13px;font-weight:700">${formatDate(r.created_at)}</span>
          <span class="${statusClass[r.health_status] || 'health-badge-stable'}">${r.health_status}</span>
        </div>
        <p style="font-size:13px;color:var(--gray)">${r.notes || ''}</p>
        ${r.doctor_name ? `<p class="text-sm text-teal mt-4">👨‍⚕️ ${r.doctor_name} — ${r.specialization || ''}</p>` : ''}
        ${r.documents?.length ? `<div class="mt-8">${r.documents.map(d => `<a href="${IMAGE_BASE}uploads/reports/${d.file_path}" target="_blank" class="text-teal text-sm"><i class="fas fa-file"></i> View Document</a>`).join(' ')}</div>` : ''}
      </div>`).join('');
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

// ═══════════════════════════════════════════════════════
// DOCTOR PAGE LOGIC
// ═══════════════════════════════════════════════════════
let _allDoctorAppts = [];
let _currentPatientAppt = null;

async function loadDashboard(silent = false) {
  updateDoctorNav('dashboard');
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greetEl = document.getElementById('dash-greeting');
  if (greetEl) greetEl.textContent = `${greet}, ${Session.getName().split(' ')[0]} 👋`;
  const avatarEl = document.getElementById('dash-avatar');
  if (avatarEl) avatarEl.innerHTML = avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 36, '#4F46E5');

  const container = document.getElementById('dashboard-content');
  if (!container) return;
  if (!silent) container.innerHTML = shimmer(3, 100);
  try {
    const [apptData, patientData] = await Promise.all([
      API.getDoctorAppointments(Session.getDoctorId()),
      API.getDoctorPatients(Session.getDoctorId()).catch(() => null)
    ]);
    _allDoctorAppts = apptData?.appointments || apptData || [];
    // get_patients.php returns full_name not name — map it
    const rawPatients = patientData?.patients || patientData || [];
    const patients = rawPatients.map(p => ({ ...p, name: p.full_name || p.name || 'Patient' }));

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const todayAppts = _allDoctorAppts.filter(a => {
      if (!a.appointment_date) return false;
      // Normalize date comparison — strip any time component
      return a.appointment_date.substring(0, 10) === today;
    });
    const pending = todayAppts.filter(a => a.status === 'pending');
    const accepted = todayAppts.filter(a => a.status === 'accepted');

    // Get current doctor status
    const currentStatus = localStorage.getItem('doctor_status') || 'available';

    container.innerHTML = `
      <!-- Status Toggle -->
      <div class="status-card">
        <div class="status-card-title">YOUR CURRENT STATUS</div>
        <div class="status-toggle-row">
          <button class="status-toggle-btn ${currentStatus === 'available' ? 'active' : ''}" onclick="updateStatus('available',this)">✅ Available</button>
          <button class="status-toggle-btn ${currentStatus === 'busy' ? 'active' : ''}" onclick="updateStatus('busy',this)">🕐 Busy</button>
          <button class="status-toggle-btn ${currentStatus === 'in_surgery' ? 'active' : ''}" onclick="updateStatus('in_surgery',this)">🔪 Surgery</button>
        </div>
      </div>

      <!-- Stats Card -->
      <div style="margin:0 16px 16px">
        <div class="stats-card">
          <div>
            <div class="stats-main">${todayAppts.length}</div>
            <div class="stats-label">Today's Appointments</div>
          </div>
          <div class="stats-mini">
            <div class="stats-mini-item"><div class="stats-mini-num">${pending.length}</div><div class="stats-mini-label">Pending</div></div>
            <div class="stats-mini-item"><div class="stats-mini-num">${accepted.length}</div><div class="stats-mini-label">Confirmed</div></div>
          </div>
        </div>
      </div>

      <!-- My Patients -->
      ${patients.length ? `
      <div class="section-header"><span class="section-title">👥 My Patients</span></div>
      <div class="h-scroll">
        ${patients.map(p => `
          <div class="patient-card">
            ${avatarHtml('', (p.name || '?').substring(0, 2).toUpperCase(), 52, '#0B6E6E')}
            <div class="patient-card-name">${p.name}</div>
            <div class="patient-card-illness">${p.last_illness || 'General'}</div>
            <div class="patient-card-count">${p.appointment_count || 0} visits</div>
          </div>`).join('')}
      </div>` : ''}

      <!-- Today's Appointments -->
      <div class="section-header"><span class="section-title">📅 Today's Schedule</span></div>
      <div style="padding:0 16px 16px">
        ${todayAppts.length ? todayAppts.map(a => renderDoctorApptCard(a)).join('') :
          emptyState('📋', 'No appointments today', 'Enjoy your free day!')}
      </div>

      <!-- Sentiment Card -->
      <div class="sentiment-card">
        <h4>📊 Patient Sentiment</h4>
        <p>Overall satisfaction is looking great this week!</p>
      </div>
    `;
    // Auto-start dashboard polling in background
    startDashboardPolling();
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

function renderDoctorApptCard(a) {
  const isPending = a.status === 'pending';
  const isAccepted = a.status === 'accepted';
  return `<div style="margin-bottom:12px">
    <div onclick="openPatientModal(${a.id})">${appointmentCardHtml(a, true)}</div>
    ${isPending ? `<div style="display:flex;gap:8px;margin-top:4px">
      <button class="btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();acceptAppt(${a.id})">✅ Accept</button>
      <button class="btn-danger btn-sm" style="flex:1" onclick="event.stopPropagation();rejectAppt(${a.id})">❌ Reject</button>
    </div>` : ''}
    ${isAccepted ? `<div style="display:flex;gap:8px;margin-top:4px">
      <button class="btn-secondary btn-sm" style="flex:1" onclick="event.stopPropagation();openReschedule(${a.id})">🔄 Reschedule</button>
    </div>` : ''}
  </div>`;
}

async function updateStatus(status, btn) {
  document.querySelectorAll('.status-toggle-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  localStorage.setItem('doctor_status', status);
  try {
    await API.updateDoctorStatus(Session.getDoctorId(), status);
    showToast(`Status updated: ${status.replace('_', ' ')}`, 'success');
  } catch (e) { showToast(e.message || 'Status update failed', 'error'); }
}

async function acceptAppt(id) {
  try {
    showLoader();
    await API.acceptAppointment(id);
    hideLoader();
    showToast('Appointment accepted!', 'success');
    loadDashboard();
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

async function rejectAppt(id) {
  confirmDialog('Reject this appointment?', async () => {
    try {
      showLoader();
      await API.rejectAppointment(id);
      hideLoader();
      showToast('Appointment rejected', 'info');
      loadDashboard();
    } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
  });
}

function openReschedule(apptId) {
  document.getElementById('reschedule-appt-id').value = apptId;
  const dateInput = document.getElementById('reschedule-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
  document.getElementById('reschedule-slots').innerHTML = '';
  document.getElementById('reschedule-selected-time').value = '';
  openModal('reschedule-modal');
}

async function loadRescheduleSlots() {
  const date = document.getElementById('reschedule-date')?.value;
  if (!date) return;
  const container = document.getElementById('reschedule-slots');
  if (!container) return;
  container.innerHTML = shimmer(1, 50);
  try {
    const data = await API.getAvailableSlots(Session.getDoctorId(), date);
    const slots = data?.slots || data || [];
    if (!slots.length) { container.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:8px 0">No slots available</p>'; return; }
    container.innerHTML = `<div class="slot-grid">${slots.filter(s => !s.is_booked).map(s =>
      `<div class="slot-pill" onclick="selectRescheduleSlot('${s.slot_time}', this)">${formatTime(s.slot_time)}</div>`
    ).join('')}</div>`;
  } catch (e) { container.innerHTML = `<p style="color:var(--coral);font-size:13px">${e.message}</p>`; }
}

function selectRescheduleSlot(time, el) {
  document.querySelectorAll('#reschedule-slots .slot-pill').forEach(p => p.classList.remove('selected'));
  if (el) el.classList.add('selected');
  document.getElementById('reschedule-selected-time').value = time;
}

async function confirmReschedule() {
  const apptId = document.getElementById('reschedule-appt-id')?.value;
  const date = document.getElementById('reschedule-date')?.value;
  const time = document.getElementById('reschedule-selected-time')?.value;
  const reason = document.getElementById('reschedule-reason')?.value.trim();
  if (!date || !time) { showToast('Please select a date and time', 'error'); return; }
  if (!reason) { showToast('Please provide a reason', 'error'); return; }
  try {
    showLoader();
    await API.rescheduleAppointment({ appointment_id: apptId, new_date: date, new_time: time, reason });
    hideLoader();
    closeModal('reschedule-modal');
    showToast('Appointment rescheduled!', 'success');
    loadDoctorAppointments();
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

// ── DOCTOR APPOINTMENTS ──
async function loadDoctorAppointments() {
  updateDoctorNav('appointments');
  const container = document.getElementById('doctor-appt-list');
  if (!container) return;
  container.innerHTML = shimmer(3, 100);
  try {
    const data = await API.getDoctorAppointments(Session.getDoctorId());
    _allDoctorAppts = data?.appointments || data || [];
    renderDoctorAppts('all');
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

function renderDoctorAppts(filter) {
  const container = document.getElementById('doctor-appt-list');
  if (!container) return;
  let list = _allDoctorAppts;
  if (filter !== 'all') list = list.filter(a => a.status === filter);
  if (!list.length) { container.innerHTML = emptyState('📋', 'No appointments', `No ${filter} appointments`); return; }
  container.innerHTML = list.map(a => renderDoctorApptCard(a)).join('');
}

function filterDoctorAppts(filter, btn) {
  document.querySelectorAll('#view-doctor-appointments .chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderDoctorAppts(filter);
}

// ── PATIENT MODAL ──
async function openPatientModal(apptId) {
  const appt = _allDoctorAppts.find(a => a.id == apptId);
  if (!appt) return;
  _currentPatientAppt = appt;
  const container = document.getElementById('patient-modal-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      ${avatarHtml('', (appt.patient_name || 'P').substring(0, 2).toUpperCase(), 56, '#0B6E6E')}
      <div>
        <div style="font-size:17px;font-weight:800">${appt.patient_name || 'Patient'}</div>
        <div style="font-size:13px;color:var(--gray)">${formatDate(appt.appointment_date)} · ${formatTime(appt.appointment_time)}</div>
      </div>
    </div>
    <div class="card mb-12">
      ${appt.illness_name ? `<div class="confirm-row"><span class="confirm-key">Illness</span><span class="confirm-val">${appt.illness_name}</span></div>` : ''}
      ${appt.illness_description ? `<div class="confirm-row"><span class="confirm-key">Description</span><span class="confirm-val">${appt.illness_description}</span></div>` : ''}
      ${appt.precautions ? `<div class="confirm-row"><span class="confirm-key">Precautions</span><span class="confirm-val">${appt.precautions}</span></div>` : ''}
      <div class="confirm-row"><span class="confirm-key">Status</span><span class="confirm-val">${statusBadge(appt.status)}</span></div>
    </div>

    <!-- Doctor Advice -->
    <div class="mb-12">
      <p style="font-weight:700;margin-bottom:8px">💊 Doctor's Advice</p>
      ${appt.doctor_advice ? `
        <div class="advice-box" id="advice-display">${appt.doctor_advice}
          <button class="btn-icon" onclick="showAdviceEditor()" style="margin-left:auto"><i class="fas fa-edit"></i></button>
        </div>
        <div id="advice-editor" style="display:none">
          <textarea id="advice-text" class="form-input mt-8" rows="3">${appt.doctor_advice}</textarea>
          <button class="btn-primary btn-sm mt-8" onclick="submitAdvice(${appt.id})">Update Advice</button>
        </div>
      ` : `
        <textarea id="advice-text" class="form-input" rows="3" placeholder="Enter your advice for the patient..."></textarea>
        <button class="btn-primary btn-sm mt-8" onclick="submitAdvice(${appt.id})">Submit Advice</button>
      `}
    </div>

    <!-- Health Reports -->
    <div>
      <p style="font-weight:700;margin-bottom:8px">📋 Health Reports</p>
      <div id="patient-reports-content">${shimmer(2, 60)}</div>
      <div id="add-report-form" style="display:none;margin-top:12px">
        <div class="form-group">
          <label class="form-label">Health Status</label>
          <select id="report-status" class="form-input">
            <option value="Stable">Stable</option>
            <option value="Improving">Improving</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="report-notes" class="form-input" rows="3" placeholder="Notes..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Documents</label>
          <input type="file" id="report-docs" class="form-input" multiple accept="image/*,.pdf" style="padding:8px">
        </div>
        <button class="btn-primary btn-sm" onclick="submitPatientReport(${appt.id})">Save Report</button>
        <button class="btn-ghost" onclick="document.getElementById('add-report-form').style.display='none'">Cancel</button>
      </div>
      <button class="btn-secondary btn-sm mt-8" onclick="document.getElementById('add-report-form').style.display='block'">+ Add Report</button>
    </div>
    <button class="btn-secondary mt-12" onclick="closeModal('patient-modal')">Close</button>
  `;

  openModal('patient-modal');
  loadPatientReports(appt.id);
}

function showAdviceEditor() {
  document.getElementById('advice-display').style.display = 'none';
  document.getElementById('advice-editor').style.display = 'block';
}

async function submitAdvice(apptId) {
  const text = document.getElementById('advice-text')?.value.trim();
  if (!text) { showToast('Please enter advice', 'error'); return; }
  try {
    showLoader();
    await API.submitAdvice(apptId, text);
    hideLoader();
    showToast('Advice submitted!', 'success');
    closeModal('patient-modal');
    const appt = _allDoctorAppts.find(a => a.id == apptId);
    if (appt) appt.doctor_advice = text;
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

async function loadPatientReports(apptId) {
  const container = document.getElementById('patient-reports-content');
  if (!container) return;
  try {
    const data = await API.getReportByAppointment(apptId);
    const reports = data?.reports || data || [];
    if (!reports.length) { container.innerHTML = '<p style="font-size:13px;color:var(--gray)">No reports yet.</p>'; return; }
    const statusClass = { Stable: 'health-badge-stable', Improving: 'health-badge-improving', Critical: 'health-badge-critical' };
    container.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-header">
          <span style="font-size:12px;font-weight:700">${formatDate(r.created_at)}</span>
          <div class="report-actions">
            <span class="${statusClass[r.health_status] || 'health-badge-stable'}">${r.health_status}</span>
            <button class="btn-icon" onclick="deleteReport(${r.id},${apptId})"><i class="fas fa-trash" style="color:var(--coral);font-size:14px"></i></button>
          </div>
        </div>
        <p style="font-size:13px;color:var(--gray)">${r.notes || ''}</p>
        ${r.documents?.length ? `<div class="mt-4">${r.documents.map(d => `<a href="${IMAGE_BASE}uploads/reports/${d.file_path}" target="_blank" class="text-teal text-sm"><i class="fas fa-file"></i> Doc</a>`).join(' ')}</div>` : ''}
      </div>`).join('');
  } catch (e) {
    container.innerHTML = `<p style="font-size:13px;color:var(--coral)">${e.message}</p>`;
  }
}

async function deleteReport(reportId, apptId) {
  confirmDialog('Delete this report?', async () => {
    try {
      showLoader();
      await API.deleteReport(reportId);
      hideLoader();
      showToast('Report deleted', 'success');
      loadPatientReports(apptId);
    } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
  });
}

async function submitPatientReport(apptId) {
  const appt = _allDoctorAppts.find(a => a.id == apptId);
  if (!appt) return;
  const fd = new FormData();
  fd.append('patient_id', appt.patient_id);
  fd.append('doctor_id', Session.getDoctorId());
  fd.append('appointment_id', apptId);
  fd.append('health_status', document.getElementById('report-status')?.value || 'Stable');
  fd.append('notes', document.getElementById('report-notes')?.value.trim() || '');
  const docs = document.getElementById('report-docs')?.files;
  if (docs) for (let i = 0; i < docs.length; i++) fd.append('documents[]', docs[i]);
  try {
    showLoader();
    await API.submitReport(fd);
    hideLoader();
    showToast('Report saved!', 'success');
    document.getElementById('add-report-form').style.display = 'none';
    loadPatientReports(apptId);
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

// ── DOCTOR HOSPITAL ──
async function loadDoctorHospital() {
  updateDoctorNav('hospital');
  const container = document.getElementById('doctor-hospital-content');
  if (!container) return;
  container.innerHTML = shimmer(3, 100);
  const hospId = Session.getHospitalId();
  if (!hospId) { container.innerHTML = emptyState('🏥', 'No hospital', 'No hospital linked to your account'); return; }
  try {
    const data = await API.getHospitalById(hospId);
    // get_by_id.php returns the hospital as the flat data object directly
    const h = data;
    const doctors = Array.isArray(data?.doctors) ? data.doctors : [];
    const img = h.photo ? `<img src="${IMAGE_BASE}uploads/hospitals/${h.photo}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=font-size:48px;display:flex;align-items:center;justify-content:center;height:100%>🏥</div>'">` : `<div style="font-size:48px;display:flex;align-items:center;justify-content:center;height:100%">🏥</div>`;

    container.innerHTML = `
      <div class="hero-img">${img}
        <div class="hero-overlay"><div class="hero-title">${h.name}</div><div class="hero-sub"><i class="fas fa-map-marker-alt"></i> ${h.city}</div></div>
      </div>

      <div style="display:flex;padding:16px;gap:8px">
        <div class="stats-mini-item" style="background:var(--teal-light);color:var(--teal);border-radius:var(--r-md);flex:1">
          <div class="stats-mini-num" style="color:var(--teal)">${doctors.length}</div><div class="stats-mini-label" style="color:var(--teal)">Doctors</div>
        </div>
        <div class="stats-mini-item" style="background:var(--mint-light);color:var(--mint);border-radius:var(--r-md);flex:1">
          <div class="stats-mini-num" style="color:var(--mint)">${parseFloat(h.avg_rating || 0).toFixed(1)}⭐</div><div class="stats-mini-label" style="color:var(--mint)">Rating</div>
        </div>
        <div class="stats-mini-item" style="background:var(--indigo-light);color:var(--indigo);border-radius:var(--r-md);flex:1">
          <div class="stats-mini-num" style="color:var(--indigo)">${h.total_reviews || 0}</div><div class="stats-mini-label" style="color:var(--indigo)">Reviews</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Patient Reviews</h3>
        <div style="display:flex;align-items:center;gap:16px">
          <div style="text-align:center">
            <div style="font-size:40px;font-weight:800;color:var(--teal)">${parseFloat(h.avg_rating || 0).toFixed(1)}</div>
            <div>${starRatingHtml(h.avg_rating)}</div>
          </div>
          <div class="rating-breakdown" style="flex:1">
            ${[5,4,3,2,1].map((star, i) => {
              const pcts = [82, 12, 4, 2, 0];
              return `<div class="rating-bar-row">
                <span class="rating-bar-label">${star}★</span>
                <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${pcts[i]}%"></div></div>
                <span class="rating-bar-pct">${pcts[i]}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Available Doctors</h3>
        ${doctors.length ? doctors.map(d => {
          const photoField = d.profile_photo || d.photo || '';
          const isSelf = d.user_id == parseInt(localStorage.getItem('hospiq_user_id'));
          return `
          <div class="card mb-12" style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="openDoctorProfileFromHospital(${d.id}, ${hospId})">
            ${avatarHtml(photoField, (d.name || 'Dr').substring(0, 2).toUpperCase(), 48, '#4F46E5')}
            <div style="flex:1">
              <div style="font-size:15px;font-weight:700">${d.name}</div>
              <div style="font-size:12px;color:var(--gray)">${d.specialization} · ${d.years_experience || 0} yrs</div>
              ${doctorStatusBadge(d.status)}
            </div>
            ${isSelf ? '<span class="pill pill-teal">You</span>' : '<i class="fas fa-chevron-right" style="color:var(--teal);font-size:12px"></i>'}
          </div>`;
        }).join('') : '<p style="color:var(--gray);font-size:14px">No doctors found at this hospital.</p>'}
      </div>
    `;
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

// Doctor's Hospital tab: view colleague doctor profile info
function openDoctorProfileFromHospital(doctorId, hospitalId) {
  API.getDoctorProfile(doctorId).then(d => {
    if (!d || !d.name) { showToast('Could not load profile', 'error'); return; }
    const msg = `Dr. ${d.name}\n${d.specialization || ''} · ${d.years_experience || 0} yrs exp\nRating: ${parseFloat(d.rating || 0).toFixed(1)} · ${d.total_patients || 0} patients\n\n${d.bio || ''}`;
    alert(msg);
  }).catch(e => showToast(e.message || 'Failed to load', 'error'));
}

// ── DOCTOR NOTIFICATIONS ──
async function loadDoctorNotifications() {
  updateDoctorNav('notifications');
  const container = document.getElementById('doctor-notif-list');
  if (!container) return;
  container.innerHTML = shimmer(3, 70);
  try {
    const data = await API.getNotifications(Session.getUserId());
    const notifs = data?.notifications || data || [];
    if (!notifs.length) { container.innerHTML = emptyState('🔔', 'No notifications', "You're all caught up!"); return; }
    const icons = { appointment: '📅', status: '✅', rating: '⭐', general: '🔔' };
    container.innerHTML = notifs.map(n => `
      <div class="notif-card ${!n.is_read ? 'unread' : ''}" onclick="this.classList.remove('unread')">
        <div class="notif-icon">${icons[n.type] || '🔔'}</div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-text">${n.body}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

// ── DOCTOR PROFILE ──
async function loadDoctorSelfProfile() {
  updateDoctorNav('profile');
  const container = document.getElementById('doctor-profile-content');
  if (!container) return;
  const notif = localStorage.getItem('hospiq_notif_pref') !== 'false';
  try {
    const data = await API.getDoctorProfile(Session.getDoctorId()).catch(() => null);
    const apptData = await API.getDoctorAppointments(Session.getDoctorId()).catch(() => null);
    const appts = apptData?.appointments || apptData || [];

    container.innerHTML = `
      <div class="profile-header">
        <div style="cursor:pointer" onclick="openDocEditModal()">
          ${avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 88, '#4F46E5')}
        </div>
        <div class="profile-name">${Session.getName()}</div>
        <div class="profile-sub">Specialist Account</div>
        <div class="profile-stats">
          <div class="profile-stat"><div class="profile-stat-num">${appts.length}</div><div class="profile-stat-label">Appointments</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${parseFloat(data?.rating || 0).toFixed(1)}</div><div class="profile-stat-label">Rating</div></div>
          <div class="profile-stat"><div class="profile-stat-num">${data?.total_patients || 0}</div><div class="profile-stat-label">Patients</div></div>
        </div>
      </div>
      <div class="menu-list">
        <div class="menu-item" onclick="openModal('slot-modal');initSlotModal()">
          <div class="menu-item-icon"><i class="fas fa-clock"></i></div>
          <div class="menu-item-text">Create Slots</div>
          <i class="fas fa-chevron-right menu-item-chevron"></i>
        </div>
        <div class="menu-item" onclick="showView('view-doctor-hospital');updateDoctorNav('hospital');loadDoctorHospital()">
          <div class="menu-item-icon"><i class="fas fa-hospital"></i></div>
          <div class="menu-item-text">Hospital Profile</div>
          <i class="fas fa-chevron-right menu-item-chevron"></i>
        </div>
        <div class="menu-item" id="doc-notif-toggle-item" onclick="toggleNotifPref()">
          <div class="menu-item-icon"><i class="fas fa-bell"></i></div>
          <div class="menu-item-text">Notifications</div>
          <div class="toggle-switch ${notif ? 'on' : ''}" id="doc-notif-toggle"></div>
        </div>
        <div class="menu-item" onclick="confirmDialog('Are you sure you want to log out?', () => { Session.clear(); goTo('index.html'); })">
          <div class="menu-item-icon danger"><i class="fas fa-sign-out-alt"></i></div>
          <div class="menu-item-text danger">Log Out</div>
          <i class="fas fa-chevron-right menu-item-chevron"></i>
        </div>
      </div>`;
  } catch (e) {
    container.innerHTML = emptyState('⚠️', 'Failed to load', e.message);
  }
}

function openDocEditModal() {
  const preview = document.getElementById('dep-avatar-preview');
  if (preview) preview.innerHTML = avatarHtml(Session.getProfilePhoto(), Session.getInitials(), 80, '#4F46E5');
  const nameEl = document.getElementById('dep-name');
  const phoneEl = document.getElementById('dep-phone');
  if (nameEl) nameEl.value = Session.getName();
  if (phoneEl) phoneEl.value = Session.getPhone();
  openModal('doc-edit-modal');
}

function previewDepPhoto(input) {
  if (!input.files?.[0]) return;
  const preview = document.getElementById('dep-avatar-preview');
  if (!preview) return;
  const reader = new FileReader();
  reader.onload = e => { preview.innerHTML = `<img src="${e.target.result}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`; };
  reader.readAsDataURL(input.files[0]);
}

async function saveDocEditProfile() {
  const fd = new FormData();
  fd.append('user_id', Session.getUserId());
  fd.append('name', document.getElementById('dep-name')?.value.trim() || '');
  fd.append('phone', document.getElementById('dep-phone')?.value.trim() || '');
  const photo = document.getElementById('dep-photo')?.files[0];
  if (photo) fd.append('profile_photo', photo);
  try {
    showLoader();
    const data = await API.updateProfile(fd);
    Session.update({ name: data.name || document.getElementById('dep-name')?.value, phone: data.phone || document.getElementById('dep-phone')?.value, profile_photo: data.profile_photo || Session.getProfilePhoto() });
    hideLoader();
    closeModal('doc-edit-modal');
    showToast('Profile updated!', 'success');
    loadDoctorSelfProfile();
  } catch (e) { hideLoader(); showToast(e.message || 'Failed', 'error'); }
}

// ── SLOT CREATOR ──
const DEFAULT_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
let _slotApply = 'all';
let _customSlots = [...DEFAULT_SLOTS];

function initSlotModal() {
  _slotApply = 'all';
  _customSlots = [...DEFAULT_SLOTS];
  document.getElementById('slot-date').style.display = 'none';
  document.getElementById('slot-date').min = new Date().toISOString().split('T')[0];
  document.getElementById('slot-all-btn').classList.add('active');
  document.getElementById('slot-specific-btn').classList.remove('active');
  renderSlotCheckboxes();
}

function renderSlotCheckboxes() {
  const container = document.getElementById('slot-checkboxes');
  if (!container) return;
  container.innerHTML = _customSlots.map(t => `
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600;padding:8px;border:1.5px solid var(--border);border-radius:var(--r-md)">
      <input type="checkbox" value="${t}" checked style="accent-color:var(--teal)"> ${formatTime(t + ':00')}
    </label>`).join('');
}

function slotToggleApply(mode) {
  _slotApply = mode;
  document.getElementById('slot-date').style.display = mode === 'specific' ? 'block' : 'none';
  document.getElementById('slot-all-btn').classList.toggle('active', mode === 'all');
  document.getElementById('slot-specific-btn').classList.toggle('active', mode === 'specific');
}

function addCustomSlotTime() {
  const input = document.getElementById('custom-slot-input');
  if (input) input.style.display = input.style.display === 'none' ? 'block' : 'none';
}

function confirmCustomTime() {
  const val = document.getElementById('custom-time-input')?.value;
  if (!val) return;
  if (!_customSlots.includes(val)) {
    _customSlots.push(val);
    _customSlots.sort();
    renderSlotCheckboxes();
  }
  document.getElementById('custom-slot-input').style.display = 'none';
}

async function saveSlots() {
  const checked = Array.from(document.querySelectorAll('#slot-checkboxes input:checked')).map(i => i.value);
  if (!checked.length) { showToast('Select at least one time slot', 'error'); return; }
  const body = {
    doctor_id: Session.getDoctorId(),
    apply_to: _slotApply,
    target_date: _slotApply === 'specific' ? document.getElementById('slot-date')?.value : null,
    timings: checked
  };
  if (_slotApply === 'specific' && !body.target_date) { showToast('Please select a date', 'error'); return; }
  try {
    showLoader();
    await API.createCustomSlots(body);
    hideLoader();
    closeModal('slot-modal');
    showToast('Slots created successfully!', 'success');
  } catch (e) { hideLoader(); showToast(e.message || 'Failed to create slots', 'error'); }
}

// ═══════════════════════════════════════════════════════
// QUICK BOOK APPOINTMENT FAB & DASHBOARD POLLING
// ═══════════════════════════════════════════════════════
let _qbAllDoctors = [];

async function openQuickBookModal() {
  openModal('quick-book-modal');
  const searchInput = document.getElementById('qb-search-input');
  if (searchInput) searchInput.value = '';
  const dropdown = document.getElementById('qb-search-dropdown');
  if (dropdown) dropdown.classList.remove('open');

  const container = document.getElementById('qb-doctors-list');
  if (!container) return;
  container.innerHTML = shimmer(2, 60);

  try {
    if (!_qbAllDoctors.length) {
      const data = await API.getAllDoctors();
      // get_all.php returns doctors with photo field (aliased from users.profile_photo)
      _qbAllDoctors = data?.doctors || data || [];
    }
    renderQbDoctorSuggestions(_qbAllDoctors);
  } catch (e) {
    // Fallback: try to load doctors from the cached hospitals
    if (_allHospitals.length) {
      // Build a doctor list from hospital data if get_all.php fails
      container.innerHTML = `<p style="color:var(--gray);font-size:13px;padding:8px 0">Search for a hospital to find doctors.</p>`;
    } else {
      container.innerHTML = `<p style="color:var(--coral);font-size:13px;padding:8px 0">${e.message || 'Failed to load doctors'}</p>`;
    }
  }
}

function renderQbDoctorSuggestions(list) {
  const container = document.getElementById('qb-doctors-list');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<p style="color:var(--gray);font-size:13px;padding:8px 0">No doctors available</p>';
    return;
  }
  container.innerHTML = list.slice(0, 8).map(d => {
    // get_all.php returns 'photo' field (aliased from users.profile_photo AS photo)
    const photoField = d.photo || d.profile_photo || '';
    return `
    <div class="card mb-8" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:10px 14px" onclick="closeModal('quick-book-modal');openDoctorProfile(${d.id},${d.hospital_id})">
      ${avatarHtml(photoField, (d.name || 'Dr').substring(0, 2).toUpperCase(), 44, '#4F46E5')}
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700">${d.name}</div>
        <div style="font-size:11px;color:var(--gray)">${d.specialization} · ${d.hospital_name}</div>
        ${doctorStatusBadge(d.status)}
      </div>
      <i class="fas fa-chevron-right" style="color:var(--teal);font-size:12px"></i>
    </div>
  `;
  }).join('');
}

function qbSearchDoctors(q) {
  const dropdown = document.getElementById('qb-search-dropdown');
  if (!dropdown) return;
  if (!q.trim()) {
    dropdown.classList.remove('open');
    renderQbDoctorSuggestions(_qbAllDoctors);
    return;
  }
  const query = q.toLowerCase();
  const results = _qbAllDoctors.filter(d => 
    (d.name || '').toLowerCase().includes(query) || 
    (d.specialization || '').toLowerCase().includes(query) ||
    (d.hospital_name || '').toLowerCase().includes(query)
  );

  if (!results.length) {
    dropdown.innerHTML = '<div class="dropdown-item text-gray">No doctors found</div>';
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = results.slice(0, 6).map(d => `
    <div class="dropdown-item" onclick="closeModal('quick-book-modal');openDoctorProfile(${d.id},${d.hospital_id})">
      <div style="font-weight:700">👨‍⚕️ ${d.name}</div>
      <div style="font-size:11px;color:var(--gray)">${d.specialization} — ${d.hospital_name}</div>
    </div>
  `).join('');
  dropdown.classList.add('open');
}

let _dashboardInterval = null;

function startDashboardPolling() {
  if (_dashboardInterval) clearInterval(_dashboardInterval);
  _dashboardInterval = setInterval(() => {
    const activeView = document.querySelector('.view.active');
    if (activeView && activeView.id === 'view-dashboard') {
      loadDashboard(true); // Silent dashboard refresh every 8 seconds
    }
  }, 8000);
}
