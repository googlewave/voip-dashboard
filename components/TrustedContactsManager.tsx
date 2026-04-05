'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPhoneInput, getPhoneInputHint, isPhoneInputValid, normalizePhoneToE164 } from '@/lib/phone';

interface Contact {
  id: string;
  name: string;
  phone: string;
  quickDialSlot: number | null;
  contactType: string;
  sipUsername: string | null;
}

interface FriendDevice {
  id: string;
  name: string;
  sip_username: string | null;
  friendship_id: string;
  friend_email: string;
}

interface Props {
  deviceId: string;
  userId: string;
  deviceName?: string;
  friendDevices?: FriendDevice[];
  isPaid?: boolean;
}

export default function TrustedContactsManager({
  deviceId,
  userId,
  deviceName,
  friendDevices = [],
  isPaid = true,
}: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // Slot swap confirmation
  const [swapModal, setSwapModal] = useState<{
    contactId: string;
    slot: number;
    existing: Contact;
  } | null>(null);

  // Add contact form
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    type: 'phone_number' as 'phone_number' | 'ring_ring_friend',
    friendDeviceId: '',
  });

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('device_id', deviceId)
      .order('name');

    if (data) {
      setContacts(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone_number || c.phone || '',
          quickDialSlot: c.quick_dial_slot,
          contactType: c.contact_type || 'phone_number',
          sipUsername: c.sip_username || null,
        }))
      );
    }
    setLoadingContacts(false);
  };

  useEffect(() => {
    setLoadingContacts(true);
    fetchContacts();
  }, [deviceId]);

  const addContact = async () => {
    if (!form.name.trim()) return;
    if (form.type === 'phone_number' && !normalizePhoneToE164(form.phone)) return;
    if (form.type === 'ring_ring_friend' && !form.friendDeviceId) return;

    setSaving(true);
    const friendDevice = friendDevices.find((d) => d.id === form.friendDeviceId);
    const normalizedPhone = form.type === 'phone_number' ? normalizePhoneToE164(form.phone) : null;

    await supabase.from('contacts').insert({
      device_id: deviceId,
      user_id: userId,
      name: form.name.trim(),
      contact_type: form.type,
      phone_number: normalizedPhone,
      sip_username: form.type === 'ring_ring_friend' ? (friendDevice?.sip_username ?? null) : null,
      friend_device_id: form.type === 'ring_ring_friend' ? form.friendDeviceId : null,
      friendship_id: form.type === 'ring_ring_friend' ? (friendDevice?.friendship_id ?? null) : null,
      quick_dial_slot: null,
    });

    setForm({ name: '', phone: '', type: 'phone_number', friendDeviceId: '' });
    setShowAddForm(false);
    await fetchContacts();
    setSaving(false);
  };

  const deleteContact = async (contactId: string) => {
    await supabase.from('contacts').delete().eq('id', contactId);
    await fetchContacts();
  };

  const assignSlot = async (contactId: string, slot: number | null, displacedId?: string) => {
    setSaving(true);
    if (displacedId) {
      await supabase.from('contacts').update({ quick_dial_slot: null }).eq('id', displacedId);
    }
    await supabase.from('contacts').update({ quick_dial_slot: slot }).eq('id', contactId);
    await fetchContacts();
    setSaving(false);
  };

  const requestSlotAssignment = (contactId: string, slot: number) => {
    const existing = contacts.find((c) => c.quickDialSlot === slot && c.id !== contactId);
    if (existing) {
      setSwapModal({ contactId, slot, existing });
      return;
    }
    void assignSlot(contactId, slot);
  };

  const handleDrop = (slot: number) => {
    if (!draggedId) return;
    requestSlotAssignment(draggedId, slot);
    setDraggedId(null);
    setDragOverSlot(null);
  };

  const quickDialSlots = Array.from({ length: 9 }, (_, i) => ({
    slot: i + 1,
    contact: contacts.find((c) => c.quickDialSlot === i + 1) ?? null,
  }));

  const assignedCount = contacts.filter((c) => c.quickDialSlot !== null).length;
  const showFriendToggle = friendDevices.length > 0 && isPaid;

  if (loadingContacts) {
    return (
      <div className="py-6 text-center text-stone-400 text-sm">Loading contacts…</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-stone-900 text-base leading-tight">
            Trusted Contacts{deviceName ? ` — ${deviceName}` : ''}
          </h3>
          <p className="text-sm text-stone-500 mt-0.5">
            {contacts.length} on safe list · {assignedCount}/9 keys assigned
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="shrink-0 px-4 py-2 bg-[#C4531A] text-white font-bold rounded-full hover:bg-[#a84313] transition text-sm"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Contact'}
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
          {/* Contact type toggle */}
          {showFriendToggle && (
            <div className="flex gap-2">
              <button
                onClick={() => setForm((f) => ({ ...f, type: 'phone_number' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                  form.type === 'phone_number'
                    ? 'bg-[#C4531A] text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                📞 Phone Number
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, type: 'ring_ring_friend' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                  form.type === 'ring_ring_friend'
                    ? 'bg-[#C4531A] text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                👥 Ring Ring Friend
              </button>
            </div>
          )}

          <input
            className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:border-[#C4531A] outline-none text-sm text-stone-900 placeholder:text-stone-400"
            placeholder="Contact name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addContact()}
            autoFocus
          />

          {form.type === 'phone_number' ? (
            <div className="space-y-2">
              <input
                type="tel"
                inputMode="tel"
                className={`w-full px-4 py-3 rounded-xl border bg-white focus:border-[#C4531A] outline-none text-sm font-mono text-stone-900 placeholder:text-stone-400 ${isPhoneInputValid(form.phone) ? 'border-amber-200' : 'border-red-300'}`}
                placeholder="+1 555 000 0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
                onKeyDown={(e) => e.key === 'Enter' && addContact()}
              />
              <p className={`text-xs ${isPhoneInputValid(form.phone) ? 'text-stone-500' : 'text-red-700'}`}>
                {getPhoneInputHint(form.phone, 'US numbers can be typed as 5550000000. We will save them in E.164 format.')}
              </p>
            </div>
          ) : (
            <select
              value={form.friendDeviceId}
              onChange={(e) => setForm((f) => ({ ...f, friendDeviceId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:border-[#C4531A] outline-none text-sm text-stone-900"
            >
              <option value="">Select friend&apos;s device…</option>
              {friendDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.friend_email})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={addContact}
            disabled={
              saving ||
              !form.name.trim() ||
              (form.type === 'phone_number' ? !normalizePhoneToE164(form.phone) : !form.friendDeviceId)
            }
            className="w-full px-4 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition text-sm disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add to Safe List'}
          </button>

          {form.type === 'ring_ring_friend' && friendDevices.length === 0 && (
            <p className="text-sm text-amber-800 bg-amber-100 rounded-xl px-4 py-3">
              No friends connected yet. Go to the Friends tab to connect another family.
            </p>
          )}
        </div>
      )}

      {/* Main Layout: Contact list + Phone keypad */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: Safe Contact List */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Safe List — drag to assign a key
          </p>

          {contacts.length === 0 ? (
            <div className="py-10 text-center text-stone-500 text-sm font-medium border-2 border-dashed border-stone-200 rounded-2xl">
              <div className="text-3xl mb-2">👥</div>
              No contacts yet
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                draggable
                onDragStart={() => setDraggedId(contact.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverSlot(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-grab active:cursor-grabbing transition select-none ${
                  draggedId === contact.id
                    ? 'opacity-40 scale-95 border-[#C4531A] bg-[#C4531A]/5'
                    : contact.quickDialSlot !== null
                    ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                    : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm'
                }`}
              >
                {/* Drag handle */}
                <span className="text-stone-400 text-base leading-none select-none flex-shrink-0">⠿</span>

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate leading-tight">{contact.name}</p>
                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {contact.contactType === 'ring_ring_friend'
                      ? '👥 Ring Ring Friend'
                      : contact.phone || '—'}
                  </p>
                </div>

                {/* Key badge */}
                {contact.quickDialSlot !== null && (
                  <span className="w-6 h-6 rounded-full bg-[#C4531A] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                    {contact.quickDialSlot}
                  </span>
                )}

                {/* Slot selector (compact) */}
                <select
                  value={contact.quickDialSlot ?? ''}
                  onChange={(e) => {
                    const slot = e.target.value ? parseInt(e.target.value) : null;
                    if (slot === null) {
                      void assignSlot(contact.id, null);
                    } else {
                      requestSlotAssignment(contact.id, slot);
                    }
                  }}
                  disabled={saving}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-stone-100 border-0 rounded-lg px-2 py-1.5 text-stone-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#C4531A] flex-shrink-0 cursor-pointer"
                >
                  <option value="">Key —</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>
                      Key {s}{contacts.find((c) => c.quickDialSlot === s && c.id !== contact.id) ? ' ●' : ''}
                    </option>
                  ))}
                </select>

                {/* Delete */}
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="text-stone-400 hover:text-red-500 transition text-sm flex-shrink-0 ml-0.5 leading-none"
                  title="Remove contact"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right: Phone Keypad */}
        <div className="lg:col-span-3">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            Quick Dial Keys — drop contacts here
          </p>

          <div className="grid grid-cols-3 gap-2">
            {quickDialSlots.map(({ slot, contact: assignedContact }) => (
              <div
                key={slot}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlot(slot);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(slot);
                }}
                onDragLeave={() => setDragOverSlot((cur) => (cur === slot ? null : cur))}
                className={`relative min-h-[80px] rounded-2xl border-2 flex flex-col items-center justify-center px-2 py-3 text-center transition ${
                  dragOverSlot === slot
                    ? 'border-[#C4531A] bg-[#C4531A]/10 scale-105 shadow-md'
                    : assignedContact
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-dashed border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                {/* Key number */}
                <div
                  className={`text-xl font-black leading-none ${
                    assignedContact ? 'text-[#C4531A]' : 'text-stone-300'
                  }`}
                >
                  {slot}
                </div>

                {/* Assigned contact info */}
                {assignedContact ? (
                  <>
                    <p className="text-xs font-bold text-stone-800 truncate w-full text-center mt-1.5 leading-snug px-1">
                      {assignedContact.name}
                    </p>
                    <p className="text-xs text-stone-500 truncate w-full text-center px-1 mt-0.5">
                      {assignedContact.contactType === 'ring_ring_friend'
                        ? 'RR Friend'
                        : assignedContact.phone}
                    </p>
                    {/* Clear button */}
                    <button
                      onClick={() => void assignSlot(assignedContact.id, null)}
                      disabled={saving}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-stone-200 hover:bg-red-100 hover:text-red-600 text-stone-500 text-xs flex items-center justify-center transition leading-none"
                      title="Clear key"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-stone-400 mt-1.5">drop here</p>
                )}
              </div>
            ))}

            {/* Decorative non-interactive keys */}
            {['✱', '0', '#'].map((k) => (
              <div
                key={k}
                className="min-h-[80px] rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center text-xl font-black text-stone-400 select-none"
              >
                {k}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Swap Confirmation Modal */}
      {swapModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border-2 border-stone-100 shadow-2xl">
            <h3 className="text-base font-black text-stone-900 mb-1">Replace quick dial key?</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Key <strong>{swapModal.slot}</strong> is currently assigned to{' '}
              <strong>{swapModal.existing.name}</strong>. Replace with the contact you dragged?
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setSwapModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200 transition"
              >
                Keep it
              </button>
              <button
                onClick={async () => {
                  const { contactId, slot, existing } = swapModal;
                  setSwapModal(null);
                  await assignSlot(contactId, slot, existing.id);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C4531A] text-white font-bold text-sm hover:bg-[#a84313] transition"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
