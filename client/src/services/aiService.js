const GEMINI_KEY_STORAGE = 'kadjelo_gemini_api_key';

export function getGeminiApiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
}

async function callGeminiIfConfigured(promptText) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return output ? output.trim() : null;
  } catch {
    return null;
  }
}

export const aiService = {
  async summarizeNote(title, content) {
    const fullText = `${title}\n${content}`.trim();
    if (!fullText) return 'Add content to your note to generate an executive summary.';

    const cloudResult = await callGeminiIfConfigured(
      `Summarize the following note into 3 to 4 concise, high-signal executive bullet points using plain markdown dashes (-) and zero emojis:\n\nTitle: ${title}\nContent:\n${content}`
    );
    if (cloudResult) return cloudResult;

    const lines = content
      .split(/\n+/)
      .map((l) => l.replace(/^[-*#>\d.\s]+/, '').trim())
      .filter((l) => l.length > 18);

    if (lines.length === 0) {
      return `- Core focus: ${title || content.slice(0, 120)}`;
    }

    const keywords = (title || '')
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);

    const scored = lines.map((line, index) => {
      let score = index === 0 ? 3 : 1;
      const lower = line.toLowerCase();
      keywords.forEach((kw) => {
        if (lower.includes(kw)) score += 2;
      });
      if (/important|key|goal|must|deadline|decision|summary|target|result/i.test(line)) {
        score += 2.5;
      }
      return { line, score, index };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored
      .slice(0, 4)
      .sort((a, b) => a.index - b.index)
      .map((item) => `- ${item.line}`);

    return top.join('\n');
  },

  extractActionItems(content = '') {
    const lines = content.split(/\n+/);
    const extracted = [];
    const actionRegex =
      /^(?:[-*]\s*)?(?:\[\s*\]\s*)?((?:todo|task|action|follow up|call|email|send|build|review|fix|prepare|schedule|buy|complete|update|deploy|test|verify|draft)\b.+)/i;

    for (const raw of lines) {
      const cleaned = raw.trim();
      if (!cleaned) continue;
      const checkboxMatch = cleaned.match(/^[-*]\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        extracted.push({
          id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: checkboxMatch[2].trim(),
          completed: checkboxMatch[1].toLowerCase() === 'x'
        });
        continue;
      }
      const match = cleaned.match(actionRegex);
      if (match) {
        extracted.push({
          id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: match[1].trim(),
          completed: false
        });
      }
    }

    if (extracted.length === 0 && content.trim()) {
      const bulletLines = lines
        .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter((l) => l.length > 4 && l.length < 110)
        .slice(0, 5);
      for (const b of bulletLines) {
        extracted.push({
          id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: b,
          completed: false
        });
      }
    }

    return extracted;
  },

  suggestCategoryAndTags(title = '', content = '') {
    const combined = `${title} ${content}`.toLowerCase();

    const categoryRules = [
      {
        category: 'Work',
        terms: ['meeting', 'client', 'project', 'sprint', 'deadline', 'roadmap', 'api', 'deploy', 'team', 'kpi']
      },
      {
        category: 'Study',
        terms: ['exam', 'lecture', 'study', 'flashcard', 'definition', 'theorem', 'course', 'research', 'chapter', 'quiz']
      },
      {
        category: 'Shopping',
        terms: ['buy', 'milk', 'grocery', 'store', 'order', 'price', 'cart', 'shopping', 'eggs', 'bread']
      },
      {
        category: 'Travel',
        terms: ['flight', 'hotel', 'passport', 'itinerary', 'trip', 'airport', 'packing', 'visa', 'booking']
      },
      {
        category: 'Ideas',
        terms: ['idea', 'brainstorm', 'concept', 'startup', 'feature', 'design', 'vision', 'prototype']
      },
      {
        category: 'Personal',
        terms: ['journal', 'habit', 'family', 'health', 'workout', 'budget', 'goal', 'reflection']
      }
    ];

    let bestCategory = 'Personal';
    let bestScore = 0;

    for (const rule of categoryRules) {
      let score = 0;
      for (const term of rule.terms) {
        if (combined.includes(term)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = rule.category;
      }
    }

    const explicitHashtags = Array.from(combined.matchAll(/#([a-z0-9_-]{2,20})/g)).map(
      (m) => m[1]
    );

    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'your',
      'note', 'notes', 'about', 'into', 'when', 'what', 'where', 'which', 'their'
    ]);

    const wordCounts = {};
    combined
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w))
      .forEach((w) => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });

    const topKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([word]) => word);

    const tags = Array.from(new Set([...explicitHashtags, ...topKeywords])).slice(0, 5);
    return { category: bestCategory, tags };
  },

  generateFlashcards(title = '', content = '', checklist = []) {
    const cards = [];
    const lines = content.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    // 1. Parse Q: / A: or Term :: Definition or **Term**: Definition
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('::')) {
        const [q, a] = line.split('::').map((s) => s.replace(/^[-*]\s*/, '').trim());
        if (q && a) {
          cards.push({
            id: `fc_${Date.now()}_${i}`,
            question: q,
            answer: a,
            mastered: false
          });
        }
      } else if (/^q:\s*/i.test(line) && lines[i + 1] && /^a:\s*/i.test(lines[i + 1])) {
        cards.push({
          id: `fc_${Date.now()}_${i}`,
          question: line.replace(/^q:\s*/i, '').trim(),
          answer: lines[i + 1].replace(/^a:\s*/i, '').trim(),
          mastered: false
        });
        i++;
      } else {
        const boldColon = line.match(/^(?:[-*]\s*)?\*\*(.+?)\*\*\s*[:—-]\s*(.+)$/);
        if (boldColon) {
          cards.push({
            id: `fc_${Date.now()}_${i}`,
            question: `What is ${boldColon[1].trim()}?`,
            answer: boldColon[2].trim(),
            mastered: false
          });
        }
      }
    }

    // 2. Fallback: convert key bullet points or sentences into active recall cards
    if (cards.length === 0) {
      lines
        .filter((l) => !l.startsWith('#') && l.length > 15)
        .slice(0, 6)
        .forEach((line, idx) => {
          const clean = line.replace(/^[-*]\s*/, '');
          const colonIdx = clean.indexOf(':');
          if (colonIdx > 2 && colonIdx < 45) {
            cards.push({
              id: `fc_auto_${idx}`,
              question: clean.slice(0, colonIdx).trim(),
              answer: clean.slice(colonIdx + 1).trim(),
              mastered: false
            });
          } else {
            cards.push({
              id: `fc_auto_${idx}`,
              question: `${title || 'Key Concept'} — Recall Point #${idx + 1}`,
              answer: clean,
              mastered: false
            });
          }
        });
    }

    if (cards.length === 0 && checklist.length > 0) {
      checklist.slice(0, 6).forEach((item, idx) => {
        cards.push({
          id: `fc_chk_${idx}`,
          question: `Checklist Step #${idx + 1} in "${title || 'Note'}"`,
          answer: item.text,
          mastered: Boolean(item.completed)
        });
      });
    }

    return cards;
  }
};
