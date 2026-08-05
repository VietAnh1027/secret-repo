/* ============================================================
   script.js — Logic trang thiệp mời tốt nghiệp
   Gồm: kiểm tra tên, hiển thị thiệp mời, xác nhận tham dự,
        lưu dữ liệu vào Supabase
   ============================================================ */
// ---------- Kết nối Supabase (lưu dữ liệu vào database) ----------
const supabaseClient = window.supabase.createClient(
  "https://ftoqtnpzpsnqlpctzkxc.supabase.co",
  "sb_publishable_wvah91rllwVzYV1f8UMEiw_5r39LMtq"
);

const HOST_NAME = "Nguyễn Việt Anh"; // Tên bạn (người mời)

const GUEST_LIST_RAW = [
  "Nguyễn Duy Đức",
  "Nguyễn Minh Thư",
  "Trần Tuấn Đạt",
  "Nguyễn Chu Tú",
  "Bùi Tố Hoàng Đạt",
  "Nguyễn Duy Quân",
  "Phạm Đặng Quang Hải",
  "Bùi Nho Minh",
  "Nguyễn Diệu Anh",
];

const EVENT_TIME = "10:30 sáng, Thứ Ba, 18/08/2026";
const EVENT_VENUE = "Khu A, Đại học Công nghiệp Hà Nội";
const EVENT_ADDRESS = "Nhổn, Bắc Từ Liêm, thành phố Hà Nội";
const MAP_QUERY = "Thư viện Khu A Đại học công nghiệp Hà Nội, QL32, Nhổn, Tây Tựu, Hà Nội, Việt Nam";

const TIMELINE = [
  { time: "7:30", activity: "Tập trung, check-in tại sảnh chính" },
  { time: "8:00", activity: "Lễ trao bằng chính thức bắt đầu" },
  // { time: "10:00", activity: "Chụp ảnh kỷ yếu cùng khoa" },
  { time: "10:30", activity: "Anh em chụp ảnh cùng nhau" }
];

const DIRECTIONS_TEXT = `Gửi xe trực tiếp trong trường, có 3 chỗ gửi xe tôi hay để:
1. Đi vào cổng chính khoảng 100m ở phía tay phải.
2,3. Cứ đi xe máy vào theo chỉ dẫn Google Map sẽ thấy 2 chỗ để xe tiếp.
Hội trường nằm ở tầng 3 chỗ thư viện`;

function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const GUEST_LIST = GUEST_LIST_RAW.map(name => ({
  display: name,
  normalized: normalizeName(name)
}));

const FORMAL_MESSAGES = [
  "Xin lỗi, có vẻ đây không phải là điều dành cho bạn. Mình xin phép không chia sẻ thêm, mong bạn thông cảm 🙏",
  "Rất tiếc, mình không tìm thấy tên bạn trong danh sách của mình. Mong bạn thông cảm nhé."
];
const JOKE_MESSAGES = [
  "Bớt đùa lại nhá 😊)))",
  "Ơ kìa, tên gì lạ vậy 🤨 Nhập lại tên thật đi nào!",
  "Hệ thống không nhận diện được... bạn đang trêu mình đúng không? 😄"
];

let currentGuest = null;

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  window.scrollTo(0, 0);
}

function handleGateSubmit() {
  const input = document.getElementById('nameInput').value.trim();
  if (!input) {
    document.getElementById('nameInput').focus();
    return;
  }
  const norm = normalizeName(input);
  const match = GUEST_LIST.find(g => g.normalized === norm);

  // Lưu lại mọi tên đã nhập vào bảng gate_attempts (không chặn giao diện chờ mạng)
  supabaseClient.from('gate_attempts').insert({
    name_input: input,
    matched: !!match
  }).then(({ error }) => {
    if (error) console.error('Lỗi lưu gate_attempts:', error);
  });

  if (match) {
    currentGuest = match;
    renderInvite();
    goTo('screen-invite');
    return;
  }

  const words = input.split(/\s+/).filter(Boolean);
  const lettersOnly = /^[a-zA-ZÀ-ỹà-ỹ\s]+$/u.test(input);
  const looksLikeRealName = words.length >= 2 && lettersOnly;

  const emoji = looksLikeRealName ? "🙇" : "😅";
  const text = looksLikeRealName ? pickRandom(FORMAL_MESSAGES) : pickRandom(JOKE_MESSAGES);

  document.getElementById('rejectEmoji').textContent = emoji;
  document.getElementById('rejectText').textContent = text;
  goTo('screen-reject');
}

document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleGateSubmit();
});

function mapsUrl(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
}

function renderInvite() {
  document.getElementById('hostName').textContent = HOST_NAME;
  document.getElementById('guestNameInvite').textContent = currentGuest.display;
  document.getElementById('eventTime').textContent = EVENT_TIME;
  document.getElementById('eventVenue').textContent = EVENT_VENUE;
  document.getElementById('directionsText').textContent = DIRECTIONS_TEXT;

  const mapHref = mapsUrl(MAP_QUERY);
  document.getElementById('mapLink').href = mapHref;

  const list = document.getElementById('timelineList');
  list.innerHTML = '';
  TIMELINE.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="t">${item.time}</span><span class="a">${item.activity}</span>`;
    list.appendChild(li);
  });
}

const declineBtn = document.getElementById('declineBtn');
const jokePhrases = ["Tôi không thể tham dự", "Bắt được tôi không? 😏", "Đứng yên có được không nào!", "Thử lần nữa xem 😄", "Bạn chắc chưa đó?", "Không trốn được đâu 🎓"];
let escapeCount = 0;

function escapeButton() {
  if (!declineBtn.classList.contains('escaping')) {
    const rect = declineBtn.getBoundingClientRect();
    declineBtn.style.left = rect.left + 'px';
    declineBtn.style.top = rect.top + 'px';
    declineBtn.classList.add('escaping');
    declineBtn.offsetHeight;
  }
  const margin = 20;
  const btnWidth = declineBtn.offsetWidth;
  const btnHeight = declineBtn.offsetHeight;
  const maxLeft = Math.max(margin, window.innerWidth - btnWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - btnHeight - margin);
  const newLeft = Math.random() * maxLeft;
  const newTop = Math.random() * maxTop;
  declineBtn.style.left = newLeft + 'px';
  declineBtn.style.top = newTop + 'px';

  escapeCount++;
  declineBtn.textContent = pickRandom(jokePhrases);
}

declineBtn.addEventListener('mouseenter', escapeButton);
declineBtn.addEventListener('touchstart', (e) => { e.preventDefault(); escapeButton(); }, { passive: false });
declineBtn.addEventListener('click', (e) => {
  e.preventDefault();
  escapeButton();
});

function handleAccept() {
  burstConfetti();

  // Lưu tên đã xác nhận tham dự vào bảng rsvp_confirmed
  supabaseClient.from('rsvp_confirmed').insert({
    guest_name: currentGuest.display
  }).then(({ error }) => {
    if (error) console.error('Lỗi lưu rsvp_confirmed:', error);
  });

  setTimeout(() => {
    document.getElementById('thanksName').textContent = currentGuest.display;
    document.getElementById('directionsTextThanks').textContent = DIRECTIONS_TEXT;
    document.getElementById('mapLinkThanks').href = mapsUrl(MAP_QUERY);
    goTo('screen-thanks');
  }, 900);
}

function burstConfetti() {
  const colors = ['#D4AF6A', '#F4DFA0', '#57B08D', '#E2926E'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 6;
    piece.style.width = size + 'px';
    piece.style.height = (size * 0.4) + 'px';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);
    const duration = 1500 + Math.random() * 1200;
    const drift = (Math.random() - 0.5) * 200;
    piece.animate([
      { transform: piece.style.transform, top: '-20px', opacity: 1 },
      { transform: `rotate(${Math.random() * 720}deg) translateX(${drift}px)`, top: '100vh', opacity: 0.9 }
    ], { duration, easing: 'ease-in' });
    setTimeout(() => piece.remove(), duration + 100);
  }
}

/* ---------- Thêm vào lịch (Android + iOS) ---------- */
function buildICSContent() {
  // Sự kiện: 18/08/2026, 10:30 sáng giờ VN (UTC+7) → UTC là 03:30
  const dtStamp = "20260818T033000Z";
  const dtStart = "20260818T033000Z";
  const dtEnd   = "20260818T063000Z"; // kết thúc 13:30 VN (06:30 UTC)
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Le Tot Nghiep//VI",
    "BEGIN:VEVENT",
    "UID:" + Date.now() + "@le-tot-nghiep",
    "DTSTAMP:" + dtStamp,
    "DTSTART:" + dtStart,
    "DTEND:"   + dtEnd,
    "SUMMARY:Lễ Tốt Nghiệp - " + HOST_NAME,
    "LOCATION:" + EVENT_VENUE + "\\, " + EVENT_ADDRESS,
    "DESCRIPTION:" + DIRECTIONS_TEXT.replace(/\n/g, '\\n').replace(/,/g, '\\,'),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Hôm nay là Lễ Tốt Nghiệp của " + HOST_NAME + "! 🎓🎉",
    "TRIGGER:-PT10H30M", // Thông báo ngay khi vừa sang ngày 18/08 (00:00 sáng, trước 10 tiếng 30 phút)
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Sắp đến Lễ Tốt Nghiệp của " + HOST_NAME + " (10:30)! 🎓",
    "TRIGGER:-PT2H", // Thông báo nhắc nhở trước 2 tiếng (08:30 sáng)
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

function buildGoogleCalendarUrl() {
  // Google Calendar URL — hoạt động tốt trên Android & web
  const base = "https://www.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent("Lễ Tốt Nghiệp - " + HOST_NAME);
  // dates format: YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ
  const dates = encodeURIComponent("20260818T033000Z/20260818T063000Z");
  const location = encodeURIComponent(EVENT_VENUE + ", " + EVENT_ADDRESS);
  const details = encodeURIComponent(DIRECTIONS_TEXT);
  return `${base}&text=${title}&dates=${dates}&location=${location}&details=${details}`;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function downloadICS() {
  const icsContent = buildICSContent();

  if (isIOS()) {
    // iOS: dùng data URI thay vì Blob URL vì Safari mobile không tải Blob
    const dataUri = "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = 'le-tot-nghiep.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Nếu download không hoạt động, mở trực tiếp để iOS Calendar app bắt
    setTimeout(() => {
      window.open(dataUri, '_blank');
    }, 300);
    return;
  }

  if (isAndroid()) {
    // Android: ưu tiên Google Calendar (đáng tin cậy nhất)
    showCalendarModal();
    return;
  }

  // Desktop / các trình duyệt khác: tải file .ics bình thường
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'le-tot-nghiep.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function showCalendarModal() {
  // Xoá modal cũ nếu có
  const existing = document.getElementById('cal-modal');
  if (existing) existing.remove();

  const icsContent = buildICSContent();
  const googleUrl  = buildGoogleCalendarUrl();
  const dataUri    = "data:text/calendar;charset=utf-8," + encodeURIComponent(icsContent);

  const modal = document.createElement('div');
  modal.id = 'cal-modal';
  modal.innerHTML = `
    <div id="cal-modal-backdrop"></div>
    <div id="cal-modal-box">
      <div id="cal-modal-title">📅 Thêm vào lịch</div>
      <div id="cal-modal-subtitle">Chọn ứng dụng lịch bạn muốn dùng</div>
      <a href="${googleUrl}" target="_blank" rel="noopener" class="cal-option" id="cal-google">
        <span class="cal-icon">🗓️</span>
        <span>Google Calendar</span>
      </a>
      <a href="${dataUri}" download="le-tot-nghiep.ics" class="cal-option" id="cal-ics"
         onclick="setTimeout(()=>document.getElementById('cal-modal').remove(),500)">
        <span class="cal-icon">📲</span>
        <span>Tải file .ics (iPhone / Outlook)</span>
      </a>
      <button id="cal-modal-close">Đóng</button>
    </div>
  `;

  // Inline styles để modal tự đứng độc lập không phụ thuộc CSS bên ngoài
  Object.assign(modal.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });
  const backdrop = modal.querySelector('#cal-modal-backdrop');
  Object.assign(backdrop.style, {
    position: 'absolute', inset: '0',
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)'
  });
  const box = modal.querySelector('#cal-modal-box');
  Object.assign(box.style, {
    position: 'relative', background: '#1a1208',
    border: '1px solid #D4AF6A44', borderRadius: '16px',
    padding: '28px 24px', width: 'min(340px, 90vw)',
    display: 'flex', flexDirection: 'column', gap: '12px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
  });
  const title = modal.querySelector('#cal-modal-title');
  Object.assign(title.style, {
    fontSize: '18px', fontWeight: '700',
    color: '#D4AF6A', textAlign: 'center', marginBottom: '2px'
  });
  const subtitle = modal.querySelector('#cal-modal-subtitle');
  Object.assign(subtitle.style, {
    fontSize: '13px', color: '#bbb', textAlign: 'center', marginBottom: '6px'
  });
  modal.querySelectorAll('.cal-option').forEach(el => {
    Object.assign(el.style, {
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', borderRadius: '10px',
      background: 'rgba(212,175,106,0.08)',
      border: '1px solid rgba(212,175,106,0.25)',
      color: '#F4DFA0', textDecoration: 'none',
      fontSize: '15px', fontWeight: '500', cursor: 'pointer',
      transition: 'background 0.2s'
    });
    el.addEventListener('mouseenter', () => el.style.background = 'rgba(212,175,106,0.18)');
    el.addEventListener('mouseleave', () => el.style.background = 'rgba(212,175,106,0.08)');
  });
  const closeBtn = modal.querySelector('#cal-modal-close');
  Object.assign(closeBtn.style, {
    marginTop: '4px', padding: '10px',
    background: 'transparent', border: '1px solid #444',
    borderRadius: '8px', color: '#888',
    fontSize: '14px', cursor: 'pointer'
  });
  closeBtn.addEventListener('click', () => modal.remove());
  backdrop.addEventListener('click', () => modal.remove());

  modal.querySelector('#cal-google').addEventListener('click', () => {
    setTimeout(() => modal.remove(), 300);
  });

  document.body.appendChild(modal);
}
