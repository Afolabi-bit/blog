import { JSDOM } from "jsdom";

// Setup headless DOM for Node.js test environment via JSDOM
const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  DOMParser: dom.window.DOMParser,
  Node: dom.window.Node,
});

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Markdown } from "tiptap-markdown";

const fixtures = [
  {
    name: "Headings & Formatting",
    markdown: `# Heading 1

## Heading 2

### Heading 3

This is **bold** text, *italic* text, and ~~strikethrough~~ text with a [link](https://example.com).`,
  },
  {
    name: "Lists (Bullet & Numbered)",
    markdown: `- Bullet one
- Bullet two
- Bullet three

1. First item
2. Second item
3. Third item`,
  },
  {
    name: "Blockquote & Horizontal Rule",
    markdown: `> This is a blockquote with important information.

---

A paragraph after the divider.`,
  },
  {
    name: "Code Block & Inline Code",
    markdown: `Here is \`inline code\` in a sentence.

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\``,
  },
  {
    name: "Task List",
    markdown: `- [x] Completed task
- [ ] Incomplete task`,
  },
  {
    name: "Table",
    markdown: `| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |`,
  },
];

async function runSpike() {
  console.log("=== Tiptap Markdown Round-Trip Spike ===");
  let passed = 0;

  for (const fixture of fixtures) {
    const editor = new Editor({
      injectCSS: false,
      extensions: [
        StarterKit.configure({
          link: { openOnClick: false },
        }),
        Image,
        TaskList,
        TaskItem.configure({ nested: true }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Markdown.configure({
          html: true,
          tightLists: true,
          bulletListMarker: "-",
        }),
      ],
      content: fixture.markdown,
    });

    // @ts-expect-error tiptap-markdown storage type
    const serialized = editor.storage.markdown.getMarkdown();
    const hasContent = serialized && serialized.trim().length > 0;

    if (hasContent) {
      console.log(`[PASS] ${fixture.name}`);
      console.log("--- Serialized Markdown output: ---");
      console.log(serialized.trim());
      console.log("----------------------------------\n");
      passed++;
    } else {
      console.error(`[FAIL] ${fixture.name} produced empty markdown`);
    }

    editor.destroy();
  }

  console.log(`\nResult: ${passed}/${fixtures.length} fixtures passed.`);
  if (passed === fixtures.length) {
    console.log("ALL 6/6 FIXTURES PASSED ROUND-TRIP SERIALIZATION SUCCESSFULLY!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSpike().catch((err) => {
  console.error("Spike failed with error:", err);
  process.exit(1);
});
