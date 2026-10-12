export const exportService = {
  exportAsMarkdown(note) {
    const checklistMd =
      note.checklist && note.checklist.length > 0
        ? `\n## Action Checklist\n` +
          note.checklist
            .map((item) => `- [${item.completed ? 'x' : ' '}] ${item.text}`)
            .join('\n') +
          '\n'
        : '';

    const tagsMd =
      note.tags && note.tags.length > 0
        ? `Tags: ${note.tags.map((t) => `#${t}`).join(' ')}\n`
        : '';

    const mdContent = `# ${note.title || 'Untitled Note'}\n\nCategory: ${
      note.category || 'Personal'
    }\nUpdated: ${new Date(note.updatedAt || Date.now()).toLocaleString()}\n${tagsMd}\n---\n\n${
      note.content || ''
    }\n${checklistMd}`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (note.title || 'kadjelo-note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    link.href = url;
    link.download = `${safeName || 'note'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportAllAsJson(notes) {
    const payload = {
      app: 'Kadjelo Notes',
      exportedAt: new Date().toISOString(),
      count: notes.length,
      notes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kadjelo-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportNoteToPdf(note) {
    const printWin = window.open('', '_blank', 'width=840,height=960');
    if (!printWin) return;

    const checklistHtml =
      note.checklist && note.checklist.length > 0
        ? `<h3>Checklist (${note.checklist.filter((c) => c.completed).length}/${
            note.checklist.length
          })</h3><ul>` +
          note.checklist
            .map(
              (c) =>
                `<li style="margin-bottom:6px;">[${c.completed ? 'x' : ' '}] ${c.text}</li>`
            )
            .join('') +
          `</ul>`
        : '';

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>${note.title || 'Kadjelo Note'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 48px;
            color: #0f172a;
            line-height: 1.65;
            max-width: 760px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #4f46e5;
          }
          h1 {
            margin: 8px 0;
            font-size: 28px;
            letter-spacing: -0.02em;
          }
          .meta {
            font-size: 13px;
            color: #64748b;
          }
          pre {
            white-space: pre-wrap;
            font-family: inherit;
            font-size: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Kadjelo Notes</div>
          <h1>${note.title || 'Untitled Note'}</h1>
          <div class="meta">
            Category: ${note.category || 'Personal'} | Updated: ${new Date(
      note.updatedAt || Date.now()
    ).toLocaleString()}
          </div>
        </div>
        <pre>${(note.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ${checklistHtml}
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  },

  async shareNative(note) {
    const shareText = `${note.title}\n\n${note.content || ''}${
      note.checklist?.length
        ? '\n\n' +
          note.checklist.map((c) => `[${c.completed ? 'x' : ' '}] ${c.text}`).join('\n')
        : ''
    }\n\n— Shared via Kadjelo Notes`;

    if (navigator.share) {
      await navigator.share({
        title: note.title || 'Kadjelo Note',
        text: shareText
      });
      return true;
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      return false;
    }
    return false;
  }
};
