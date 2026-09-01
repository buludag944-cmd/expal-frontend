import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchDashboard(token) {
  const res = await fetch(`${API}/api/journey/dashboard`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export async function submitOnboarding(token, payload) {
  const res = await fetch(`${API}/api/journey/onboarding`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Onboarding failed");
  return data;
}

export async function fetchTimeline(token) {
  const res = await fetch(`${API}/api/journey/timeline`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to load timeline");
  return res.json();
}

export async function completeTask(token, taskId, isCompleted) {
  const res = await fetch(`${API}/api/journey/timeline/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ isCompleted }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update task");
  return data;
}

export async function findMentor(token) {
  const res = await fetch(`${API}/api/journey/mentors/find`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not find mentor");
  return data;
}

export async function updateIrpApplication(token, { applicationDate, expectedWeeks }) {
  const res = await fetch(`${API}/api/journey/residency/irp`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ applicationDate, expectedWeeks }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to save IRP date");
  return data;
}

export async function fetchForumSpaces(token) {
  const res = await fetch(`${API}/api/journey/forums/spaces`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to load forums");
  return res.json();
}

export async function fetchForumThreads(token, spaceId) {
  const res = await fetch(`${API}/api/journey/forums/spaces/${spaceId}/threads`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load threads");
  return res.json();
}

export async function fetchForumThread(token, threadId) {
  const res = await fetch(`${API}/api/journey/forums/threads/${threadId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load thread");
  return res.json();
}

export async function updateForumThread(token, threadId, { title, body }) {
  const res = await fetch(`${API}/api/journey/forums/threads/${threadId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ title, body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update thread");
  return data;
}

export async function deleteForumThread(token, threadId) {
  const res = await fetch(`${API}/api/journey/forums/threads/${threadId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete thread");
  }
}

export async function updateForumReply(token, replyId, body) {
  const res = await fetch(`${API}/api/journey/forums/replies/${replyId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update reply");
  return data;
}

export async function deleteForumReply(token, replyId) {
  const res = await fetch(`${API}/api/journey/forums/replies/${replyId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete reply");
  }
}

export async function postForumReply(token, threadId, body) {
  const res = await fetch(`${API}/api/journey/forums/threads/${threadId}/replies`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to post reply");
  return data;
}

export async function sendAssistantMessage(token, message, history = []) {
  const res = await fetch(`${API}/api/assistant/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Assistant unavailable");
  return data;
}

export async function fetchResidency(token) {
  const res = await fetch(`${API}/api/journey/residency`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to load residency");
  return res.json();
}

export async function logAbsence(token, payload) {
  const res = await fetch(`${API}/api/journey/residency/absences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to log absence");
  return res.json();
}

export async function fetchScore(token) {
  const res = await fetch(`${API}/api/journey/score`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to load score");
  return res.json();
}

export async function fetchVisaTypes(country, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}/api/journey/visa-types/${encodeURIComponent(country)}`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  if (data.length && typeof data[0] === "string") {
    return data.map((v) => ({ value: v, label: v, tagline: "" }));
  }
  return data;
}

export async function fetchVisaGuide(token) {
  const res = await fetch(`${API}/api/journey/visa-guide`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load visa guide");
  return data;
}

export async function updateEmploymentStatus(token, employmentStatus) {
  const res = await fetch(`${API}/api/journey/employment-status`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ employmentStatus }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update employment status");
  return data;
}

export async function fetchDocuments(token) {
  const res = await fetch(`${API}/api/journey/documents`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

export async function addDocument(token, payload) {
  const res = await fetch(`${API}/api/journey/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to add document");
  return data;
}

export async function deleteDocument(token, docId) {
  const res = await fetch(`${API}/api/journey/documents/${docId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete document");
  }
}

export async function updateVisaType(token, visaType) {
  const res = await fetch(`${API}/api/journey/visa-type`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ visaType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update visa type");
  return data;
}
