'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const CATEGORIES = ['food', 'drink', 'supplies', 'other'];

export default function Logistics({ lobbyId, hostId, currentUserId }) {
  const isHost = currentUserId && currentUserId === hostId;

  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('other');
  const [itemQty, setItemQty] = useState('');

  const [houseInfo, setHouseInfo] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [parking, setParking] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [editingHouseInfo, setEditingHouseInfo] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
    loadHouseInfo();
    if (currentUserId) loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyId, currentUserId]);

  async function loadItems() {
    const { data } = await supabase
      .from('odds_ends_items')
      .select('*, members(display_name)')
      .eq('lobby_id', lobbyId)
      .order('created_at', { ascending: true });
    setItems(data || []);
  }

  async function loadHouseInfo() {
    const { data } = await supabase.from('house_info').select('*').eq('lobby_id', lobbyId).maybeSingle();
    setHouseInfo(data || null);
    setCheckIn(data?.check_in || '');
    setParking(data?.parking || '');
    setHouseRules(data?.house_rules || '');
  }

  async function loadTemplates() {
    const { data } = await supabase.from('house_info_templates').select('*').eq('owner_id', currentUserId);
    setTemplates(data || []);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!itemName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('odds_ends_items').insert({
      lobby_id: lobbyId,
      item_name: itemName.trim(),
      category: itemCategory,
      quantity_needed: itemQty.trim() || null,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setItemName(''); setItemQty('');
    loadItems();
  }

  async function toggleClaim(item) {
    if (!currentUserId) return;
    setBusy(true);
    const nextClaimedBy = item.claimed_by === currentUserId ? null : currentUserId;
    const { error } = await supabase.from('odds_ends_items').update({ claimed_by: nextClaimedBy }).eq('id', item.id);
    setBusy(false);
    if (error) { setError(error.message); return; }
    loadItems();
  }

  async function removeItem(item) {
    setBusy(true);
    await supabase.from('odds_ends_items').delete().eq('id', item.id);
    setBusy(false);
    loadItems();
  }

  async function saveHouseInfo() {
    setBusy(true);
    const { error } = await supabase.from('house_info').upsert({
      lobby_id: lobbyId,
      check_in: checkIn || null,
      parking: parking || null,
      house_rules: houseRules || null,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setEditingHouseInfo(false);
    loadHouseInfo();
  }

  function applyTemplate(t) {
    setCheckIn(t.check_in || '');
    setParking(t.parking || '');
    setHouseRules(t.house_rules || '');
    setEditingHouseInfo(true);
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('house_info_templates').insert({
      owner_id: currentUserId,
      name: templateName.trim(),
      check_in: checkIn || null,
      parking: parking || null,
      house_rules: houseRules || null,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setTemplateName('');
    loadTemplates();
  }

  return (
    <div>
      <h3 className="section-title">Odds &amp; ends</h3>
      {items.length === 0 && <p className="muted">Nothing on the list yet.</p>}
      {items.map((item) => (
        <div key={item.id} className="item-row">
          <span>
            <strong>{item.item_name}</strong>
            {item.quantity_needed ? ` · ${item.quantity_needed}` : ''}
            {' '}<span className="tag">{item.category}</span>
            {item.claimed_by && (
              <span className="muted"> — claimed by {item.claimed_by === currentUserId ? 'you' : (item.members?.display_name || 'a member')}</span>
            )}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            {currentUserId && (!item.claimed_by || item.claimed_by === currentUserId) && (
              <button className="btn btn-sm btn-outline" disabled={busy} onClick={() => toggleClaim(item)}>
                {item.claimed_by === currentUserId ? "I can't bring this" : "I'll bring this"}
              </button>
            )}
            {isHost && (
              <button className="btn btn-sm btn-quiet" disabled={busy} onClick={() => removeItem(item)}>Remove</button>
            )}
          </span>
        </div>
      ))}
      {isHost && (
        <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <input style={{ flex: 2 }} value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item (e.g. chips, ice)" />
          <select style={{ flex: 1 }} value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input style={{ flex: 1 }} value={itemQty} onChange={(e) => setItemQty(e.target.value)} placeholder="Qty (optional)" />
          <button className="btn btn-brass btn-sm" type="submit" disabled={busy}>Add</button>
        </form>
      )}

      <h3 className="section-title">House info</h3>
      {!editingHouseInfo && (
        <div className="card">
          <p><strong>Check-in:</strong> {houseInfo?.check_in || <span className="muted">Not set</span>}</p>
          <p><strong>Parking:</strong> {houseInfo?.parking || <span className="muted">Not set</span>}</p>
          <p><strong>House rules:</strong> {houseInfo?.house_rules || <span className="muted">Not set</span>}</p>
          {isHost && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditingHouseInfo(true)}>Edit house info</button>
          )}
        </div>
      )}
      {editingHouseInfo && isHost && (
        <div className="card">
          {templates.length > 0 && (
            <div className="field">
              <label>Apply a saved template</label>
              <select onChange={(e) => {
                const t = templates.find((x) => x.id === e.target.value);
                if (t) applyTemplate(t);
              }} defaultValue="">
                <option value="" disabled>Choose a template…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="checkIn">Check-in</label>
            <input id="checkIn" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="parking">Parking</label>
            <input id="parking" value={parking} onChange={(e) => setParking(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="houseRules">House rules</label>
            <textarea id="houseRules" rows={3} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={saveHouseInfo}>Save</button>
            <button className="btn btn-quiet btn-sm" onClick={() => setEditingHouseInfo(false)}>Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--parchment-dark)', paddingTop: 12 }}>
            <input style={{ flex: 1 }} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Save current info as template…" />
            <button className="btn btn-outline btn-sm" disabled={busy || !templateName.trim()} onClick={saveAsTemplate}>Save as template</button>
          </div>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
