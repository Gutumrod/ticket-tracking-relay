const statuses = ["REPORTED", "RECEIVED", "IN_PROGRESS", "DONE", "CLOSED"];
const transitions = {
  REPORTED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["IN_PROGRESS", "REPORTED"],
  IN_PROGRESS: ["DONE", "RECEIVED"],
  DONE: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"]
};

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
  return new Date(value).toLocaleString();
}

function badge(text, extra = "") {
  return `<span class="badge ${extra}">${escapeHtml(text)}</span>`;
}

function priorityClass(priority) {
  return `priority-${String(priority).toLowerCase()}`;
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
    $("#login-error").textContent = error.response?.error || "Unable to log in.";
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
      <p><b>Reporter:</b> ${escapeHtml(ticket.reporter_name)}</p>
      <p><b>Created At:</b> ${formatDate(ticket.created_at)}</p>
      <p><b>Updated At:</b> ${formatDate(ticket.updated_at)}</p>
      <div class="progress">${steps}</div>
      <b>Description</b>
      <div class="description-box">${escapeHtml(ticket.description)}</div>
      <b>Handler Notes</b>
      <div class="notes-box">${escapeHtml(ticket.handler_notes || "No handler notes yet.")}</div>
    </article>
  `;
}

async function searchTicket() {
  const id = $("#track-id").value.trim().toUpperCase();
  $("#track-error").classList.add("hidden");
  $("#track-result").innerHTML = "";
  if (!id) {
    $("#track-error").textContent = "Ticket ID not found. Please verify your ID.";
    $("#track-error").classList.remove("hidden");
    return;
  }

  try {
    const ticket = await requestJson(`/api/tickets/${encodeURIComponent(id)}`);
    $("#track-result").innerHTML = renderTicketCard(ticket);
  } catch (_error) {
    $("#track-error").textContent = "Ticket ID not found. Please verify your ID.";
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
          <td><button type="button" data-manage="${escapeHtml(ticket.id)}">Manage</button></td>
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

  $("#modal-title").textContent = `Manage ${selectedTicket.id}`;
  $("#modal-detail").innerHTML = `
    <div><b>ID</b><br>${escapeHtml(selectedTicket.id)}</div>
    <div><b>Status</b><br>${escapeHtml(selectedTicket.status)}</div>
    <div><b>Reporter</b><br>${escapeHtml(selectedTicket.reporter_name)}</div>
    <div><b>Priority</b><br>${escapeHtml(selectedTicket.priority)}</div>
    <div><b>Created</b><br>${formatDate(selectedTicket.created_at)}</div>
    <div><b>Updated</b><br>${formatDate(selectedTicket.updated_at)}</div>
    <div class="full"><b>Title</b><br>${escapeHtml(selectedTicket.title)}</div>
    <div class="full"><b>Description</b><br>${escapeHtml(selectedTicket.description)}</div>
    <div class="full"><b>Current Handler Notes</b><br>${escapeHtml(selectedTicket.handler_notes || "No handler notes yet.")}</div>
  `;

  const allowed = transitions[selectedTicket.status] || [];
  $("#status-transition").innerHTML = allowed
    .map((status) => `<option value="${status}">${status}</option>`)
    .join("");
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
    $("#modal-error").textContent = error.response?.error || "Unable to update status.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("hashchange", handleRoute);
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
