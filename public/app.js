const statuses = ["REPORTED", "RECEIVED", "IN_PROGRESS", "DONE", "CLOSED"];
const transitions = {
  REPORTED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["IN_PROGRESS", "REPORTED"],
  IN_PROGRESS: ["DONE", "RECEIVED"],
  DONE: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"]
};

const LOCALE_KEY = "ticket_tracker_locale";
const STRINGS = {
  nav_submit: { th: "แจ้งปัญหา", en: "Report Issue" },
  nav_track: { th: "ติดตามสถานะ", en: "Track Ticket" },
  nav_dashboard: { th: "แดชบอร์ดเจ้าหน้าที่", en: "Handler Dashboard" },
  submit_title: { th: "แจ้งปัญหา", en: "Report an Issue" },
  label_reporter_name: { th: "ชื่อผู้แจ้ง", en: "Reporter Name" },
  placeholder_reporter_name: { th: "ชื่อของคุณ", en: "Your Name" },
  label_title: { th: "หัวข้อปัญหา", en: "Issue Title" },
  placeholder_title: { th: "สรุปปัญหาโดยย่อ", en: "Brief summary of the problem" },
  label_priority: { th: "ระดับความสำคัญ", en: "Priority" },
  priority_low: { th: "ต่ำ", en: "Low" },
  priority_medium: { th: "ปานกลาง", en: "Medium" },
  priority_high: { th: "สูง", en: "High" },
  label_description: { th: "รายละเอียด", en: "Description" },
  placeholder_description: { th: "อธิบายรายละเอียดของปัญหา...", en: "Provide details about the issue..." },
  btn_submit_ticket: { th: "ส่งคำร้อง", en: "Submit Ticket" },
  success_title: { th: "ส่งคำร้องสำเร็จ!", en: "Ticket Submitted Successfully!" },
  success_ticket_id_prefix: { th: "หมายเลขคำร้องของคุณคือ", en: "Your Ticket ID is" },
  btn_copy_id: { th: "คัดลอกหมายเลข", en: "Copy Ticket ID" },
  btn_track_status: { th: "ติดตามสถานะ", en: "Track Status" },
  track_title: { th: "ติดตามสถานะคำร้อง", en: "Track Ticket Status" },
  placeholder_track_id: { th: "กรอกหมายเลขคำร้อง เช่น TCK-1001", en: "Enter Ticket ID, e.g. TCK-1001" },
  btn_search: { th: "ค้นหา", en: "Search" },
  track_not_found: { th: "ไม่พบหมายเลขคำร้องนี้ กรุณาตรวจสอบอีกครั้ง", en: "Ticket ID not found. Please verify your ID." },
  login_title: { th: "เข้าสู่ระบบเจ้าหน้าที่", en: "Handler Login" },
  label_username: { th: "ชื่อผู้ใช้", en: "Username" },
  label_password: { th: "รหัสผ่าน", en: "Password" },
  btn_login: { th: "เข้าสู่ระบบ", en: "Log In" },
  login_generic_error: { th: "ไม่สามารถเข้าสู่ระบบได้", en: "Unable to log in." },
  dashboard_title: { th: "แดชบอร์ดเจ้าหน้าที่", en: "Handler Dashboard" },
  btn_logout: { th: "ออกจากระบบ", en: "Log Out" },
  metric_total: { th: "คำร้องทั้งหมด", en: "Total Tickets" },
  metric_reported: { th: "แจ้งเข้ามา", en: "Reported" },
  metric_received: { th: "รับเรื่องแล้ว", en: "Received" },
  metric_progress: { th: "กำลังดำเนินการ", en: "In Progress" },
  metric_done: { th: "เสร็จสิ้น", en: "Done" },
  filter_all_statuses: { th: "ทุกสถานะ", en: "All Statuses" },
  filter_all_priorities: { th: "ทุกระดับความสำคัญ", en: "All Priorities" },
  placeholder_dashboard_search: { th: "ค้นหาด้วยหมายเลขหรือหัวข้อ", en: "Search by Ticket ID or Title" },
  th_ticket_id: { th: "หมายเลขคำร้อง", en: "Ticket ID" },
  th_title: { th: "หัวข้อ", en: "Title" },
  th_reporter: { th: "ผู้แจ้ง", en: "Reporter" },
  th_priority: { th: "ความสำคัญ", en: "Priority" },
  th_status: { th: "สถานะ", en: "Status" },
  th_created_at: { th: "วันที่แจ้ง", en: "Created At" },
  th_actions: { th: "จัดการ", en: "Actions" },
  btn_manage: { th: "จัดการ", en: "Manage" },
  empty_table: { th: "ไม่พบคำร้องที่ตรงกับตัวกรอง", en: "No tickets match the current filters." },
  modal_manage_title: { th: "จัดการคำร้อง", en: "Manage" },
  label_status_transition: { th: "เปลี่ยนสถานะ", en: "Status Transition" },
  label_handler_notes: { th: "บันทึกของเจ้าหน้าที่", en: "Handler Notes" },
  placeholder_handler_notes: { th: "บันทึกความคืบหน้าหรือผลการแก้ไข", en: "Progress or resolution comments" },
  btn_update_status: { th: "อัปเดตสถานะ", en: "Update Status" },
  modal_error_generic: { th: "ไม่สามารถอัปเดตสถานะได้", en: "Unable to update status." },
  card_reporter: { th: "ผู้แจ้ง:", en: "Reporter:" },
  card_created_at: { th: "วันที่แจ้ง:", en: "Created At:" },
  card_updated_at: { th: "อัปเดตล่าสุด:", en: "Updated At:" },
  card_description: { th: "รายละเอียด", en: "Description" },
  card_handler_notes: { th: "บันทึกของเจ้าหน้าที่", en: "Handler Notes" },
  card_no_notes: { th: "ยังไม่มีบันทึกจากเจ้าหน้าที่", en: "No handler notes yet." },
  detail_id: { th: "หมายเลข", en: "ID" },
  detail_status: { th: "สถานะ", en: "Status" },
  detail_reporter: { th: "ผู้แจ้ง", en: "Reporter" },
  detail_priority: { th: "ความสำคัญ", en: "Priority" },
  detail_created: { th: "วันที่แจ้ง", en: "Created" },
  detail_updated: { th: "อัปเดตล่าสุด", en: "Updated" },
  detail_title: { th: "หัวข้อ", en: "Title" },
  detail_description: { th: "รายละเอียด", en: "Description" },
  detail_current_notes: { th: "บันทึกปัจจุบันของเจ้าหน้าที่", en: "Current Handler Notes" }
};

let locale = localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "th";

function t(key) {
  return (STRINGS[key] && STRINGS[key][locale]) || key;
}

function applyLocale() {
  document.documentElement.lang = locale;
  $$("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  $("#lang-toggle").textContent = locale === "th" ? "EN" : "ไทย";
  if (tickets.length) renderTable();
  if (selectedTicket) $("#status-transition").innerHTML = statusOptions(selectedTicket.status);
}

function setLocale(next) {
  locale = next === "en" ? "en" : "th";
  localStorage.setItem(LOCALE_KEY, locale);
  applyLocale();
}

let tickets = [];
let selectedTicket = null;
let lastCreatedTicketId = "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Date(value).toLocaleString(locale === "th" ? "th-TH" : "en-US");
}

function badge(text, extra = "") {
  return `<span class="badge ${extra}">${escapeHtml(text)}</span>`;
}

function priorityClass(priority) {
  return `priority-${String(priority).toLowerCase()}`;
}

function statusOptions(currentStatus) {
  const allowed = transitions[currentStatus] || [];
  return allowed.map((status) => `<option value="${status}">${status}</option>`).join("");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.response = data;
    error.status = response.status;
    throw error;
  }
  return data;
}

async function showView(name) {
  if (name === "dashboard") {
    try {
      await requestJson("/api/auth/me");
    } catch (_error) {
      window.location.hash = "#login";
      return;
    }
  }

  $$(".view").forEach((view) => view.classList.add("hidden"));
  $(`#${name}-view`).classList.remove("hidden");
  $$("[data-nav]").forEach((link) => link.classList.toggle("active", link.dataset.nav === name));
  if (name === "dashboard") loadDashboard();
}

function handleRoute() {
  const route = (window.location.hash || "#submit").replace("#", "");
  showView(["submit", "track", "dashboard", "login"].includes(route) ? route : "submit");
}

async function login(event) {
  event.preventDefault();
  $("#login-error").textContent = "";

  try {
    await requestJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("#login-username").value,
        password: $("#login-password").value
      })
    });
    $("#login-form").reset();
    window.location.hash = "#dashboard";
  } catch (error) {
    $("#login-error").textContent = error.response?.error || t("login_generic_error");
  }
}

async function logout() {
  await requestJson("/api/auth/logout", { method: "POST" });
  window.location.hash = "#submit";
}

function clearFieldErrors() {
  $$("[data-error-for]").forEach((item) => {
    item.textContent = "";
  });
}

function setFieldErrors(errors) {
  clearFieldErrors();
  Object.entries(errors || {}).forEach(([field, message]) => {
    const target = $(`[data-error-for="${field}"]`);
    if (target) target.textContent = message;
  });
}

async function submitTicket(event) {
  event.preventDefault();
  clearFieldErrors();
  $("#success-banner").classList.add("hidden");

  const payload = {
    reporter_name: $("#reporter-name").value,
    title: $("#ticket-title").value,
    priority: $("#ticket-priority").value || "Medium",
    description: $("#ticket-description").value
  };

  try {
    const ticket = await requestJson("/api/tickets", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    lastCreatedTicketId = ticket.id;
    $("#new-ticket-id").textContent = ticket.id;
    $("#success-banner").classList.remove("hidden");
    $("#ticket-form").reset();
    $("#ticket-priority").value = "Medium";
  } catch (error) {
    if (error.status === 400) setFieldErrors(error.response.errors);
  }
}

function renderTicketCard(ticket) {
  const currentIndex = statuses.indexOf(ticket.status);
  const steps = statuses
    .map((status, index) => {
      const cls = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
      return `<div class="step ${cls}">${status}</div>`;
    })
    .join("");

  return `
    <article class="ticket-card panel">
      <div class="ticket-top">
        <h2>${escapeHtml(ticket.id)}</h2>
        <div class="badges">
          ${badge(ticket.priority, priorityClass(ticket.priority))}
          ${badge(ticket.status)}
        </div>
      </div>
      <h3>${escapeHtml(ticket.title)}</h3>
      <p><b>${t("card_reporter")}</b> ${escapeHtml(ticket.reporter_name)}</p>
      <p><b>${t("card_created_at")}</b> ${formatDate(ticket.created_at)}</p>
      <p><b>${t("card_updated_at")}</b> ${formatDate(ticket.updated_at)}</p>
      <div class="progress">${steps}</div>
      <b>${t("card_description")}</b>
      <div class="description-box">${escapeHtml(ticket.description)}</div>
      <b>${t("card_handler_notes")}</b>
      <div class="notes-box">${escapeHtml(ticket.handler_notes || t("card_no_notes"))}</div>
    </article>
  `;
}

async function searchTicket() {
  const id = $("#track-id").value.trim().toUpperCase();
  $("#track-error").classList.add("hidden");
  $("#track-result").innerHTML = "";
  if (!id) {
    $("#track-error").textContent = t("track_not_found");
    $("#track-error").classList.remove("hidden");
    return;
  }

  try {
    const ticket = await requestJson(`/api/tickets/${encodeURIComponent(id)}`);
    $("#track-result").innerHTML = renderTicketCard(ticket);
  } catch (_error) {
    $("#track-error").textContent = t("track_not_found");
    $("#track-error").classList.remove("hidden");
  }
}

function updateMetrics(allTickets) {
  $("#metric-total").textContent = allTickets.length;
  $("#metric-reported").textContent = allTickets.filter((ticket) => ticket.status === "REPORTED").length;
  $("#metric-received").textContent = allTickets.filter((ticket) => ticket.status === "RECEIVED").length;
  $("#metric-progress").textContent = allTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  $("#metric-done").textContent = allTickets.filter((ticket) => ticket.status === "DONE").length;
}

function filteredTickets() {
  const status = $("#status-filter").value;
  const priority = $("#priority-filter").value;
  const query = $("#dashboard-search").value.trim().toLowerCase();
  return tickets.filter((ticket) => {
    const matchesStatus = !status || ticket.status === status;
    const matchesPriority = !priority || ticket.priority === priority;
    const matchesSearch = !query || ticket.id.toLowerCase().includes(query) || ticket.title.toLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  });
}

function renderTable() {
  const rows = filteredTickets();
  $("#empty-table").classList.toggle("hidden", rows.length > 0);
  $("#tickets-table").innerHTML = rows
    .map(
      (ticket) => `
        <tr>
          <td><b>${escapeHtml(ticket.id)}</b></td>
          <td>${escapeHtml(ticket.title)}</td>
          <td>${escapeHtml(ticket.reporter_name)}</td>
          <td>${badge(ticket.priority, priorityClass(ticket.priority))}</td>
          <td>${badge(ticket.status)}</td>
          <td>${formatDate(ticket.created_at)}</td>
          <td><button type="button" data-manage="${escapeHtml(ticket.id)}">${t("btn_manage")}</button></td>
        </tr>
      `
    )
    .join("");
}

async function loadDashboard() {
  tickets = await requestJson("/api/tickets");
  updateMetrics(tickets);
  renderTable();
}

function openManageModal(ticketId) {
  selectedTicket = tickets.find((ticket) => ticket.id === ticketId);
  if (!selectedTicket) return;

  $("#modal-title").textContent = `${t("modal_manage_title")} ${selectedTicket.id}`;
  $("#modal-detail").innerHTML = `
    <div><b>${t("detail_id")}</b><br>${escapeHtml(selectedTicket.id)}</div>
    <div><b>${t("detail_status")}</b><br>${escapeHtml(selectedTicket.status)}</div>
    <div><b>${t("detail_reporter")}</b><br>${escapeHtml(selectedTicket.reporter_name)}</div>
    <div><b>${t("detail_priority")}</b><br>${escapeHtml(selectedTicket.priority)}</div>
    <div><b>${t("detail_created")}</b><br>${formatDate(selectedTicket.created_at)}</div>
    <div><b>${t("detail_updated")}</b><br>${formatDate(selectedTicket.updated_at)}</div>
    <div class="full"><b>${t("detail_title")}</b><br>${escapeHtml(selectedTicket.title)}</div>
    <div class="full"><b>${t("detail_description")}</b><br>${escapeHtml(selectedTicket.description)}</div>
    <div class="full"><b>${t("detail_current_notes")}</b><br>${escapeHtml(selectedTicket.handler_notes || t("card_no_notes"))}</div>
  `;

  $("#status-transition").innerHTML = statusOptions(selectedTicket.status);
  $("#handler-notes").value = selectedTicket.handler_notes || "";
  $("#modal-error").textContent = "";
  $("#manage-dialog").showModal();
}

async function updateStatus() {
  if (!selectedTicket) return;
  const status = $("#status-transition").value;
  const handlerNotes = $("#handler-notes").value;

  try {
    await requestJson(`/api/tickets/${encodeURIComponent(selectedTicket.id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, handler_notes: handlerNotes })
    });
    $("#manage-dialog").close();
    await loadDashboard();
  } catch (error) {
    $("#modal-error").textContent = error.response?.error || t("modal_error_generic");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyLocale();
  window.addEventListener("hashchange", handleRoute);
  $("#lang-toggle").addEventListener("click", () => setLocale(locale === "th" ? "en" : "th"));
  $("#ticket-form").addEventListener("submit", submitTicket);
  $("#login-form").addEventListener("submit", login);
  $("#logout-button").addEventListener("click", logout);
  $("#search-ticket").addEventListener("click", searchTicket);
  $("#track-id").addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchTicket();
  });
  $("#copy-ticket-id").addEventListener("click", async () => {
    await navigator.clipboard.writeText(lastCreatedTicketId);
  });
  $("#track-new-ticket").addEventListener("click", () => {
    $("#track-id").value = lastCreatedTicketId;
    window.location.hash = "#track";
    searchTicket();
  });
  $("#status-filter").addEventListener("change", renderTable);
  $("#priority-filter").addEventListener("change", renderTable);
  $("#dashboard-search").addEventListener("input", renderTable);
  $("#tickets-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-manage]");
    if (button) openManageModal(button.dataset.manage);
  });
  $("#close-modal").addEventListener("click", () => $("#manage-dialog").close());
  $("#update-status").addEventListener("click", updateStatus);
  handleRoute();
});
