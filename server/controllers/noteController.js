import { getSql, initializeDatabase } from '../config/db.js';

function mapRowToNote(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || '',
    content: row.content || '',
    category: row.category || 'Personal',
    status: row.status || 'todo',
    tags: Array.isArray(row.tags) ? row.tags : [],
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    flashcards: Array.isArray(row.flashcards) ? row.flashcards : [],
    focusMinutes: Number(row.focus_minutes || 0),
    color: row.color || 'default',
    isPinned: Boolean(row.is_pinned),
    isArchived: Boolean(row.is_archived),
    isTrashed: Boolean(row.is_trashed),
    isLocked: Boolean(row.is_locked),
    lockPinHash: row.lock_pin_hash || null,
    biometricEnabled: Boolean(row.biometric_enabled),
    reminderAt: row.reminder_at || null,
    versionHistory: Array.isArray(row.version_history) ? row.version_history : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getNotes(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ error: 'Neon DB not configured.' });
    }

    const rows = await sql`
      SELECT *
      FROM notes
      WHERE user_id = ${req.user.id}
      ORDER BY is_pinned DESC, updated_at DESC
    `;

    return res.json({ notes: rows.map(mapRowToNote) });
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch notes: ${err.message}` });
  }
}

export async function createNote(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ error: 'Neon DB not configured.' });
    }

    const {
      title = '',
      content = '',
      category = 'Personal',
      status = 'todo',
      tags = [],
      checklist = [],
      attachments = [],
      flashcards = [],
      focusMinutes = 0,
      color = 'default',
      isPinned = false,
      isArchived = false,
      isTrashed = false,
      isLocked = false,
      lockPinHash = null,
      biometricEnabled = false,
      reminderAt = null
    } = req.body;

    if (
      !title.trim() &&
      !content.trim() &&
      (!checklist || checklist.length === 0) &&
      (!attachments || attachments.length === 0)
    ) {
      return res.status(400).json({
        error: 'Cannot save an empty note. Add a title, content, checklist, or attachment.'
      });
    }

    const rows = await sql`
      INSERT INTO notes (
        user_id, title, content, category, status,
        tags, checklist, attachments, flashcards, focus_minutes,
        color, is_pinned, is_archived, is_trashed,
        is_locked, lock_pin_hash, biometric_enabled, reminder_at
      )
      VALUES (
        ${req.user.id},
        ${title.trim() || 'Untitled Note'},
        ${content},
        ${category},
        ${status},
        ${JSON.stringify(tags)}::jsonb,
        ${JSON.stringify(checklist)}::jsonb,
        ${JSON.stringify(attachments)}::jsonb,
        ${JSON.stringify(flashcards)}::jsonb,
        ${Number(focusMinutes || 0)},
        ${color},
        ${Boolean(isPinned)},
        ${Boolean(isArchived)},
        ${Boolean(isTrashed)},
        ${Boolean(isLocked)},
        ${lockPinHash},
        ${Boolean(biometricEnabled)},
        ${reminderAt || null}
      )
      RETURNING *
    `;

    return res.status(201).json({ note: mapRowToNote(rows[0]) });
  } catch (err) {
    return res.status(500).json({ error: `Failed to create note: ${err.message}` });
  }
}

export async function updateNote(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ error: 'Neon DB not configured.' });
    }

    const { id } = req.params;
    const existingRows = await sql`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${req.user.id}
    `;
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const current = existingRows[0];
    const {
      title = current.title,
      content = current.content,
      category = current.category,
      status = current.status,
      tags = current.tags,
      checklist = current.checklist,
      attachments = current.attachments,
      flashcards = current.flashcards,
      focusMinutes = current.focus_minutes,
      color = current.color,
      isPinned = current.is_pinned,
      isArchived = current.is_archived,
      isTrashed = current.is_trashed,
      isLocked = current.is_locked,
      lockPinHash = current.lock_pin_hash,
      biometricEnabled = current.biometric_enabled,
      reminderAt = current.reminder_at,
      versionHistory = current.version_history
    } = req.body;

    const updatedRows = await sql`
      UPDATE notes
      SET
        title = ${title},
        content = ${content},
        category = ${category},
        status = ${status},
        tags = ${JSON.stringify(tags)}::jsonb,
        checklist = ${JSON.stringify(checklist)}::jsonb,
        attachments = ${JSON.stringify(attachments)}::jsonb,
        flashcards = ${JSON.stringify(flashcards)}::jsonb,
        focus_minutes = ${Number(focusMinutes || 0)},
        color = ${color},
        is_pinned = ${Boolean(isPinned)},
        is_archived = ${Boolean(isArchived)},
        is_trashed = ${Boolean(isTrashed)},
        is_locked = ${Boolean(isLocked)},
        lock_pin_hash = ${lockPinHash},
        biometric_enabled = ${Boolean(biometricEnabled)},
        reminder_at = ${reminderAt || null},
        version_history = ${JSON.stringify(versionHistory || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING *
    `;

    return res.json({ note: mapRowToNote(updatedRows[0]) });
  } catch (err) {
    return res.status(500).json({ error: `Failed to update note: ${err.message}` });
  }
}

export async function deleteNote(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ error: 'Neon DB not configured.' });
    }

    const { id } = req.params;
    await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${req.user.id}`;
    return res.json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ error: `Failed to delete note: ${err.message}` });
  }
}

export async function syncLocalNotes(req, res) {
  try {
    await initializeDatabase();
    const sql = getSql();
    if (!sql) {
      return res.status(503).json({ error: 'Neon DB not configured.' });
    }

    const { notes = [] } = req.body;
    for (const item of notes) {
      if (!item.title && !item.content) continue;
      await sql`
        INSERT INTO notes (
          user_id, title, content, category, status,
          tags, checklist, attachments, flashcards, focus_minutes,
          color, is_pinned, is_archived, is_trashed,
          is_locked, lock_pin_hash, biometric_enabled, reminder_at, version_history
        )
        VALUES (
          ${req.user.id},
          ${item.title || 'Untitled Note'},
          ${item.content || ''},
          ${item.category || 'Personal'},
          ${item.status || 'todo'},
          ${JSON.stringify(item.tags || [])}::jsonb,
          ${JSON.stringify(item.checklist || [])}::jsonb,
          ${JSON.stringify(item.attachments || [])}::jsonb,
          ${JSON.stringify(item.flashcards || [])}::jsonb,
          ${Number(item.focusMinutes || 0)},
          ${item.color || 'default'},
          ${Boolean(item.isPinned)},
          ${Boolean(item.isArchived)},
          ${Boolean(item.isTrashed)},
          ${Boolean(item.isLocked)},
          ${item.lockPinHash || null},
          ${Boolean(item.biometricEnabled)},
          ${item.reminderAt || null},
          ${JSON.stringify(item.versionHistory || [])}::jsonb
        )
      `;
    }

    const allRows = await sql`
      SELECT *
      FROM notes
      WHERE user_id = ${req.user.id}
      ORDER BY is_pinned DESC, updated_at DESC
    `;

    return res.json({ notes: allRows.map(mapRowToNote) });
  } catch (err) {
    return res.status(500).json({ error: `Cloud sync failed: ${err.message}` });
  }
}
