function convertHtml2JsonAndSet() {
  const htmlTextAreaValue = document.getElementById("html").value;
  const jsonObj = html2json(htmlTextAreaValue);
  const jsonArea = document.getElementById("json");
  jsonArea.textContent = JSON.stringify(jsonObj, null, 2);
}

function html2json(htmlText) {
  const tree = buildHtmlTree(scanMarkup(String(htmlText ?? "")));
  return {
    document: extractDocument(tree),
    structure: extractStructure(tree),
    scripts: extractScripts(tree),
    styles: extractStyles(tree),
    externals: extractExternals(tree),
    metadata: extractMetadata(tree),
    features: extractFeatures(tree),
    status: extractStatus(tree),
  };
}

function visitElements(node, visitor) {
  if (!node || !Array.isArray(node.children)) return;
  for (const child of node.children) {
    if (child.type === "element") visitor(child);
    visitElements(child, visitor);
  }
}

function findElements(tree, tagName) {
  const found = [];
  visitElements(tree, (element) => { if (!tagName || element.tag === tagName) found.push(element); });
  return found;
}

function textContent(node) {
  if (!node) return "";
  if (node.type === "text" || node.type === "rawText") return node.value;
  return (node.children || []).map(textContent).join("");
}

function extractDocument(tree) {
  let doctype = null;
  for (const child of tree.children) {
    if (child.type === "doctype") { doctype = child.value; break; }
  }
  const html = findElements(tree, "html")[0];
  const title = findElements(tree, "title")[0];
  return {
    doctype,
    title: title ? textContent(title).trim() : null,
    language: html?.attributes.lang || null,
    direction: html?.attributes.dir || null,
  };
}

function compactStructureNode(node, depth, maxDepth) {
  const result = { tag: node.tag };
  if (node.attributes.id) result.id = node.attributes.id;
  if (node.attributes.class) result.class = node.attributes.class.trim().split(/\s+/).filter(Boolean);
  if (depth < maxDepth) {
    const children = node.children.filter((child) => child.type === "element")
      .map((child) => compactStructureNode(child, depth + 1, maxDepth));
    if (children.length) result.children = children;
  }
  return result;
}

function extractStructure(tree) {
  const landmarks = new Set(["header", "nav", "main", "section", "article", "aside", "footer"]);
  const short = [];
  function collectLandmarks(node) {
    for (const child of node.children || []) {
      if (child.type !== "element") continue;
      if (landmarks.has(child.tag)) short.push(compactStructureNode(child, 0, 1));
      collectLandmarks(child);
    }
  }
  collectLandmarks(tree);
  if (!short.length) {
    const body = findElements(tree, "body")[0];
    const source = body || tree;
    for (const child of source.children || []) {
      if (child.type === "element") short.push(compactStructureNode(child, 0, 1));
    }
  }
  const body = findElements(tree, "body")[0];
  const longSource = body || tree;
  const long = (longSource.children || []).filter((child) => child.type === "element")
    .map((child) => compactStructureNode(child, 0, 4));
  return { short, long };
}

function extractScripts(tree) {
  const scripts = [];
  for (const element of findElements(tree, "script")) {
    const item = { type: element.attributes.type || null };
    if (element.attributes.src) item.src = element.attributes.src;
    const code = (element.children || []).filter((child) => child.type === "rawText").map((child) => child.value).join("");
    if (code) item.content = code;
    for (const key of ["async", "defer", "nomodule", "crossorigin", "integrity"]) {
      if (Object.hasOwn(element.attributes, key)) item[key] = element.attributes[key];
    }
    scripts.push(item);
  }
  for (const element of findElements(tree, "link")) {
    if ((element.attributes.rel || "").toLowerCase().split(/\s+/).includes("javascript") && element.attributes.href) {
      scripts.push({ src: element.attributes.href, type: "linked-resource" });
    }
  }
  return scripts;
}

function extractStyles(tree) {
  const styles = [];
  for (const element of findElements(tree, "style")) {
    const item = { content: (element.children || []).filter((child) => child.type === "rawText").map((child) => child.value).join("") };
    if (element.attributes.media) item.media = element.attributes.media;
    const atRules = [...item.content.matchAll(/@([\w-]+)(?:\s+([^;{]*))?/g)]
      .map((match) => ({ name: match[1].toLowerCase(), condition: (match[2] || "").trim() || null }));
    if (atRules.length) item.atRules = atRules;
    styles.push(item);
  }
  for (const element of findElements(tree, "link")) {
    if ((element.attributes.rel || "").toLowerCase().split(/\s+/).includes("stylesheet") && element.attributes.href) {
      const item = { href: element.attributes.href };
      if (element.attributes.media) item.media = element.attributes.media;
      styles.push(item);
    }
  }
  return styles;
}

function extractExternals(tree) {
  const records = [];
  const resourceAttrs = {
    a: ["href", "link"], area: ["href", "link"], img: ["src", "image"], source: ["src", "media"],
    video: ["src", "media"], audio: ["src", "media"], iframe: ["src", "frame"], embed: ["src", "embed"],
    object: ["data", "embed"], track: ["src", "media"], input: ["src", "image"],
  };
  visitElements(tree, (element) => {
    const rule = resourceAttrs[element.tag];
    if (rule && element.attributes[rule[0]]) records.push({ kind: rule[1], url: element.attributes[rule[0]], tag: element.tag });
    if (element.tag === "img" && element.attributes.srcset) records.push({ kind: "image-set", value: element.attributes.srcset, tag: "img" });
    if (element.tag === "link" && element.attributes.href) {
      const rel = (element.attributes.rel || "").toLowerCase();
      if (/icon/.test(rel)) records.push({ kind: "icon", url: element.attributes.href, tag: "link" });
      else if (/preload|preconnect|dns-prefetch|manifest/.test(rel)) records.push({ kind: rel, url: element.attributes.href, tag: "link" });
      else if (/font/.test(element.attributes.as || "") || /font\//i.test(element.attributes.type || "")) records.push({ kind: "font", url: element.attributes.href, tag: "link" });
    }
  });
  for (const style of findElements(tree, "style")) {
    const css = textContent(style);
    for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      if (match[2] && !match[2].startsWith("data:")) records.push({ kind: "css-resource", url: match[2] });
    }
  }
  return records;
}

function extractMetadata(tree) {
  const metadata = [];
  for (const element of findElements(tree, "meta")) metadata.push({ ...element.attributes });
  for (const element of findElements(tree, "link")) {
    if ((element.attributes.rel || "").toLowerCase().split(/\s+/).includes("canonical") && element.attributes.href) {
      metadata.push({ source: "canonical", href: element.attributes.href });
    }
  }
  for (const element of findElements(tree, "script")) {
    if ((element.attributes.type || "").toLowerCase() === "application/ld+json") {
      metadata.push({ source: "json-ld", content: textContent(element).trim() });
    }
  }
  return metadata;
}

function extractFeatures(tree) {
  const source = findElements(tree, "script").map(textContent).join("\n");
  const checks = [
    ["webgpu", /navigator\s*\.\s*gpu|GPUAdapter|GPUDevice/],
    ["webgl", /getContext\s*\(\s*["'](?:webgl2?|experimental-webgl2?)["']|WebGLRenderingContext|WebGL2RenderingContext/],
    ["wasm", /WebAssembly\s*\.|instantiateStreaming|\.wasm(?:["'?#]|$)/],
    ["react", /__REACT|react-dom|React\.createElement/],
    ["three.js", /THREE\.(?:WebGLRenderer|Scene)|three(?:\.min)?\.js/],
    ["babylon.js", /BABYLON\.|babylon(?:\.max)?\.js/],
  ];
  return checks.filter(([, pattern]) => pattern.test(source)).map(([name]) => name);
}

function extractStatus(tree) {
  const diagnostics = tree.diagnostics || [];
  return {
    result: diagnostics.some((item) => item.severity === "error") ? "failed" : diagnostics.length ? "partial" : "complete",
    messages: diagnostics,
  };
}

// Tokenizer: scans once from left to right. It deliberately does not try to
// implement the full HTML parsing standard; diagnostics record recoveries.
function scanMarkup(source) {
  const tokens = [];
  const diagnostics = [];
  const rawTextTags = new Set(["script", "style"]);
  let position = 0;

  while (position < source.length) {
    if (source.startsWith("<!--", position)) {
      const start = position;
      const end = source.indexOf("-->", position + 4);
      if (end === -1) {
        tokens.push({ type: "comment", value: source.slice(position + 4), start, end: source.length });
        diagnostics.push({ severity: "warning", message: "Unterminated comment", offset: start });
        position = source.length;
      } else {
        tokens.push({ type: "comment", value: source.slice(position + 4, end), start, end: end + 3 });
        position = end + 3;
      }
      continue;
    }

    if (source[position] !== "<") {
      const next = source.indexOf("<", position);
      const end = next === -1 ? source.length : next;
      tokens.push({ type: "text", value: source.slice(position, end), start: position, end });
      position = end;
      continue;
    }

    const tag = readTag(source, position, diagnostics);
    if (!tag) {
      tokens.push({ type: "text", value: "<", start: position, end: position + 1 });
      position += 1;
      continue;
    }
    tokens.push(tag);
    position = tag.end;

    if (!tag.closing && rawTextTags.has(tag.name)) {
      const closeStart = findRawTextClose(source, position, tag.name);
      const contentEnd = closeStart === -1 ? source.length : closeStart;
      if (contentEnd > position) {
        tokens.push({ type: "rawText", tag: tag.name, value: source.slice(position, contentEnd), start: position, end: contentEnd });
      }
      if (closeStart === -1) {
        diagnostics.push({ severity: "warning", message: `Unclosed <${tag.name}> element`, offset: tag.start });
        position = source.length;
      } else {
        const closeTag = readTag(source, closeStart, diagnostics);
        if (closeTag) {
          tokens.push(closeTag);
          position = closeTag.end;
        }
      }
    }
  }

  return { tokens, diagnostics };
}

function readTag(source, start, diagnostics) {
  if (source[start] !== "<") return null;
  let position = start + 1;
  if (source[position] === "!") {
    const end = findTagEnd(source, position + 1);
    if (end === -1) {
      diagnostics.push({ severity: "warning", message: "Unterminated declaration", offset: start });
      return { type: "declaration", value: source.slice(start + 2), start, end: source.length };
    }
    const raw = source.slice(start + 2, end).trim();
    if (/^doctype\b/i.test(raw)) return { type: "doctype", value: raw, start, end: end + 1 };
    return { type: "declaration", value: raw, start, end: end + 1 };
  }

  let closing = false;
  if (source[position] === "/") { closing = true; position += 1; }
  while (/\s/.test(source[position] || "") && position < source.length) position += 1;
  const nameStart = position;
  while (position < source.length && !/[\s/>]/.test(source[position])) position += 1;
  if (position === nameStart) return null;
  const name = source.slice(nameStart, position).toLowerCase();
  const end = findTagEnd(source, position);
  if (end === -1) {
    diagnostics.push({ severity: "warning", message: `Unterminated <${name}> tag`, offset: start });
    return { type: closing ? "endTag" : "startTag", name, attributes: {}, selfClosing: false, raw: source.slice(start), start, end: source.length };
  }
  const raw = source.slice(start, end + 1);
  const attrText = source.slice(position, end).replace(/\/\s*$/, "");
  return {
    type: closing ? "endTag" : "startTag",
    name,
    attributes: closing ? {} : parseAttributes(attrText),
    selfClosing: !closing && /\/\s*>$/.test(raw),
    raw,
    start,
    end: end + 1,
  };
}

function findTagEnd(source, position) {
  let quote = null;
  for (let i = position; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return i;
    }
  }
  return -1;
}

function parseAttributes(text) {
  const attributes = {};
  let position = 0;
  while (position < text.length) {
    while (/\s|\//.test(text[position] || "") && position < text.length) position += 1;
    const start = position;
    while (position < text.length && !/[\s=/>]/.test(text[position])) position += 1;
    if (position === start) { position += 1; continue; }
    const name = text.slice(start, position).toLowerCase();
    while (/\s/.test(text[position] || "") && position < text.length) position += 1;
    let value = "";
    if (text[position] === "=") {
      position += 1;
      while (/\s/.test(text[position] || "") && position < text.length) position += 1;
      const quote = text[position] === '"' || text[position] === "'" ? text[position++] : null;
      const valueStart = position;
      if (quote) {
        while (position < text.length && text[position] !== quote) position += 1;
        value = text.slice(valueStart, position);
        if (text[position] === quote) position += 1;
      } else {
        while (position < text.length && !/[\s>]/.test(text[position])) position += 1;
        value = text.slice(valueStart, position);
      }
    }
    if (!(name in attributes)) attributes[name] = value;
  }
  return attributes;
}

function findRawTextClose(source, from, tagName) {
  const expression = new RegExp(`<\\/\\s*${tagName}\\s*>`, "ig");
  expression.lastIndex = from;
  const match = expression.exec(source);
  return match ? match.index : -1;
}

function buildHtmlTree(scanResult) {
  const voidElements = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
  ]);
  const root = { type: "document", children: [] };
  const stack = [root];
  const diagnostics = scanResult.diagnostics.slice();

  for (const token of scanResult.tokens) {
    const current = stack[stack.length - 1];
    if (token.type === "startTag") {
      const node = { type: "element", tag: token.name, attributes: token.attributes, children: [], start: token.start, end: token.end };
      current.children.push(node);
      if (!token.selfClosing && !voidElements.has(token.name)) stack.push(node);
    } else if (token.type === "endTag") {
      let matchingIndex = -1;
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === token.name) { matchingIndex = i; break; }
      }
      if (matchingIndex === -1) {
        diagnostics.push({ severity: "warning", message: `Unexpected closing </${token.name}> tag`, offset: token.start });
      } else {
        while (stack.length - 1 >= matchingIndex) {
          const closed = stack.pop();
          closed.end = token.end;
          if (closed.tag !== token.name) diagnostics.push({ severity: "warning", message: `Implicitly closed <${closed.tag}> before </${token.name}>`, offset: token.start });
        }
      }
    } else if (token.type === "doctype" || token.type === "declaration" || token.type === "comment") {
      current.children.push({ type: token.type, value: token.value, start: token.start, end: token.end });
    } else if (token.type === "text" || token.type === "rawText") {
      current.children.push({ type: token.type, value: token.value, ...(token.tag ? { tag: token.tag } : {}), start: token.start, end: token.end });
    }
  }

  while (stack.length > 1) {
    const unclosed = stack.pop();
    diagnostics.push({ severity: "warning", message: `Unclosed <${unclosed.tag}> element`, offset: unclosed.start });
  }
  return { type: "htmlParseTree", children: root.children, diagnostics };
}

function showExample1() {
  const htmlExample = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport">
    <title>Sample HTML</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
    </header>
    <nav>
        <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is the home section of the webpage.</p>
        </section>
        <section id="about">
            <h2>About Section</h2>
            <p>This is the about section of the webpage.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 My Website</p>
    </footer>
    <script src="script.js"></script>
</body>
</html>
`;
  const jsonContent = {
    "Comment 1":
      "You have to think about how to take into account various html inputs so your json structure will cover them all and handle different cases.",
    "Comment 2":
      "When you make any choice in terms of selecting specific json structure for conversion - be ready to provide reasoning behind such choice.",
  };

  document.getElementById("html").value = htmlExample;
  document.getElementById("json").textContent = JSON.stringify(
    jsonContent,
    null,
    2
  );
}

function showExample2() {
  const htmlExample = `<div>
<p>Hello world!</p>
  <button>Click me!</button>
  <textarea>Some very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very very long string.</textarea>
</div>
`;
  const jsonContent = {
    "Comment 1":
      "You have to think about how to take into account various html inputs so your json structure will cover them all and handle different cases.",
    "Comment 2":
      "When you make any choice in terms of selecting specific json structure for conversion - be ready to provide reasoning behind such choice.",
  };

  document.getElementById("html").value = htmlExample;
  document.getElementById("json").textContent = JSON.stringify(
    jsonContent,
    null,
    2
  );
}
