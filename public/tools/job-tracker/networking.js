export const CONNECTION_METHODS = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'in_person', label: 'In-person meeting' },
  { id: 'email', label: 'Email' },
];

export function validateContact(raw) {
  if (!raw || typeof raw !== 'object') throw Error('The contact details could not be read.');
  const contact = {};
  for (const [key, limit] of Object.entries({ id: 100, firstName: 100, surname: 100, company: 120, contact: 400, notes: 3000, createdAt: 40, updatedAt: 40 })) {
    if (raw[key] != null && typeof raw[key] !== 'string') throw Error('The contact contains an invalid field.');
    contact[key] = (raw[key] || '').trim();
    if (contact[key].length > limit) throw Error('Some contact details are too long.');
  }
  if (!contact.id || !contact.firstName || !contact.surname) throw Error('Add a first name and surname.');
  if (!CONNECTION_METHODS.some(method => method.id === raw.method)) throw Error('Choose how you connected.');
  contact.method = raw.method;
  if (contact.contact && contact.method === 'email' && !/^[^\s@?&#\r\n]+@[^\s@?&#\r\n]+\.[^\s@?&#\r\n]+$/.test(contact.contact)) {
    throw Error('Enter a valid email address.');
  }
  if (contact.contact && contact.method === 'linkedin') {
    let url;
    try { url = new URL(contact.contact); } catch { throw Error('Enter a full LinkedIn profile URL, starting with https://.'); }
    if (url.protocol !== 'https:' || !(url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com')) || url.username || url.password) {
      throw Error('Use a LinkedIn URL starting with https://.');
    }
    contact.contact = url.href;
  }
  return contact;
}

export function contactHref(contact) {
  if (!contact.contact) return '';
  try {
    const valid = validateContact(contact);
    if (valid.method === 'linkedin') return valid.contact;
    if (valid.method === 'email') return 'mailto:' + encodeURIComponent(valid.contact);
  } catch { return ''; }
  return '';
}

const normalise = text => text.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ı/g, 'i').toLowerCase();
export function filterContacts(contacts, query = '', method = 'all') {
  const text = normalise(query).trim();
  return contacts.filter(contact => (method === 'all' || contact.method === method) &&
    (!text || normalise([contact.firstName, contact.surname, contact.company, contact.contact, contact.notes].join(' ')).includes(text)))
    .sort((a, b) => a.surname.localeCompare(b.surname, 'en') || a.firstName.localeCompare(b.firstName, 'en'));
}

export function mergeContacts(existing, incoming) {
  const ids = new Set(existing.map(contact => contact.id));
  return [...existing, ...incoming.filter(contact => !ids.has(contact.id))];
}

export function contactsCsv(contacts) {
  const escape = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
  const rows = [['First name', 'Surname', 'How we connected', 'Contact details', 'Company', 'Notes'],
    ...contacts.map(contact => [contact.firstName, contact.surname, CONNECTION_METHODS.find(method => method.id === contact.method)?.label || '', contact.contact, contact.company, contact.notes])];
  return '\ufeff' + rows.map(row => row.map(escape).join(',')).join('\r\n');
}
