// Compatibility for HTML produced for the web visualization host.
// Styles and MathML stay inside the existing visualization sandbox.
const FIXED = Object.freeze({
  block: 'display:block', inline: 'display:inline', 'inline-block': 'display:inline-block',
  flex: 'display:flex', 'inline-flex': 'display:inline-flex', grid: 'display:grid',
  'flex-wrap': 'flex-wrap:wrap', 'flex-nowrap': 'flex-wrap:nowrap',
  'flex-col': 'flex-direction:column', 'flex-row': 'flex-direction:row',
  'flex-1': 'flex:1 1 0%', 'shrink-0': 'flex-shrink:0',
  'items-center': 'align-items:center', 'items-start': 'align-items:flex-start',
  'items-end': 'align-items:flex-end', 'items-stretch': 'align-items:stretch',
  'justify-between': 'justify-content:space-between', 'justify-center': 'justify-content:center',
  'justify-start': 'justify-content:flex-start', 'justify-end': 'justify-content:flex-end',
  'w-full': 'width:100%', 'h-full': 'height:100%', 'w-auto': 'width:auto', 'h-auto': 'height:auto',
  'min-w-0': 'min-width:0', 'min-h-0': 'min-height:0', 'max-w-full': 'max-width:100%',
  'font-normal': 'font-weight:400', 'font-medium': 'font-weight:500',
  'font-semibold': 'font-weight:600', 'font-bold': 'font-weight:700',
  'text-xs': 'font-size:.75rem;line-height:1rem', 'text-sm': 'font-size:.875rem;line-height:1.25rem',
  'text-base': 'font-size:1rem;line-height:1.5rem', 'text-lg': 'font-size:1.125rem;line-height:1.75rem',
  'text-xl': 'font-size:1.25rem;line-height:1.75rem', 'text-2xl': 'font-size:1.5rem;line-height:2rem',
  'text-left': 'text-align:left', 'text-center': 'text-align:center', 'text-right': 'text-align:right',
  'rounded-sm': 'border-radius:.125rem', rounded: 'border-radius:.25rem',
  'rounded-md': 'border-radius:.375rem', 'rounded-lg': 'border-radius:.5rem',
  'rounded-xl': 'border-radius:.75rem', 'rounded-2xl': 'border-radius:1rem',
  'rounded-full': 'border-radius:9999px', border: 'border-width:1px;border-style:solid',
  'border-0': 'border-width:0', 'border-2': 'border-width:2px;border-style:solid',
  relative: 'position:relative', absolute: 'position:absolute',
  'overflow-hidden': 'overflow:hidden', 'overflow-auto': 'overflow:auto',
  'overflow-x-auto': 'overflow-x:auto', 'overflow-y-auto': 'overflow-y:auto',
  'cursor-pointer': 'cursor:pointer', 'select-none': 'user-select:none',
  'whitespace-nowrap': 'white-space:nowrap', 'break-words': 'overflow-wrap:break-word',
  'tabular-nums': 'font-variant-numeric:tabular-nums',
});
const BREAKPOINTS = Object.freeze({sm:640, md:768, lg:1024, xl:1280, '2xl':1536});
const AXES = Object.freeze({x:['left','right'], y:['top','bottom'], t:['top'], r:['right'], b:['bottom'], l:['left']});
const escapeClass = value => value.replace(/[^a-zA-Z0-9_-]/g, char => '\\' + char).replace(/^([0-9])/, (_, digit) => '\\3' + digit + ' ');

export function utilityDeclaration(token) {
  if (Object.hasOwn(FIXED, token)) return FIXED[token];
  let match = /^(p|m)([xytrbl]?)-(0|[1-9]\d?|0\.5|1\.5|2\.5|3\.5)$/.exec(token);
  if (match) {
    const property = match[1] === 'p' ? 'padding' : 'margin', value = Number(match[3]) / 4 + 'rem';
    return match[2] ? AXES[match[2]].map(axis => `${property}-${axis}:${value}`).join(';') : `${property}:${value}`;
  }
  match = /^(gap(?:-[xy])?|min-h|min-w|w|h)-(0|[1-9]\d?|0\.5|1\.5|2\.5|3\.5)$/.exec(token);
  if (match) {
    const property = {'gap-x':'column-gap','gap-y':'row-gap','min-h':'min-height','min-w':'min-width',w:'width',h:'height'}[match[1]] ?? match[1];
    return `${property}:${Number(match[2])/4}rem`;
  }
  match = /^grid-cols-([1-9]|1[0-2])$/.exec(token);
  if (match) return `grid-template-columns:repeat(${match[1]},minmax(0,1fr))`;
  match = /^col-span-([1-9]|1[0-2])$/.exec(token);
  if (match) return `grid-column:span ${match[1]}/span ${match[1]}`;
  match = /^(text|bg|border|fill|stroke)-\[var\((--viz-[a-z0-9-]+)\)\]$/.exec(token);
  if (match) return `${{text:'color',bg:'background-color',border:'border-color',fill:'fill',stroke:'stroke'}[match[1]]}:var(${match[2]})`;
  return null;
}

export function compatibilityCSS(tokens = []) {
  const base = [], responsive = new Map(), unique = new Set(tokens);
  for (const token of unique) {
    if (typeof token !== 'string' || token.length > 160) continue;
    const match = /^(sm|md|lg|xl|2xl):(.+)$/.exec(token), name = match?.[2] ?? token;
    const declaration = name === 'hidden' ? 'display:none' : utilityDeclaration(name);
    if (declaration == null) continue;
    const rule = `.${escapeClass(token)}{${declaration}}`;
    if (match) {
      const width = BREAKPOINTS[match[1]];
      if (!responsive.has(width)) responsive.set(width, []);
      responsive.get(width).push(rule);
    } else if (name !== 'hidden') base.push(rule);
  }
  // Hidden may be added only after a click, so it must not depend on initial markup.
  base.push('.hidden{display:none}');
  for (const [width, rules] of [...responsive].sort((a,b)=>a[0]-b[0])) base.push(`@media(min-width:${width}px){${rules.join('')}}`);
  base.push('[hidden]:not([hidden="until-found"]){display:none!important}');
  base.push(':root{--viz-card:var(--card);--viz-accent-bg:var(--accent)}');
  base.push('.local-viz-math{display:inline-block;max-width:100%;vertical-align:middle;overflow-x:auto;overflow-y:hidden}.local-viz-math math{font-size:1em}.local-viz-math[data-display="block"]{display:block;margin:.5em 0;text-align:center}');
  return base.join('\n');
}

const MATH = /(?<!\\)(\\{1,2})(\(|\[)([\s\S]*?)\1(\)|\])/g;
const EXCLUDED = 'script,style,pre,code,textarea,template,svg,math,[contenteditable],.katex,.MathJax';

export function mathSegments(text) {
  const found = [];
  if (typeof text !== 'string' || text.length > 100000) return found;
  for (const match of text.matchAll(MATH)) {
    if ((match[2] === '(') !== (match[4] === ')')) continue;
    const tex = match[1].length === 2 ? match[3].replace(/\\\\/g, '\\') : match[3];
    if (!tex.trim() || tex.length > 4096) continue;
    found.push({index:match.index, length:match[0].length, tex, displayMode:match[2] === '['});
  }
  return found;
}

let mathLibrary;
async function loadMath() {
  mathLibrary ??= import('./katex-b55de29d0a06.js').then(module => {module.c(); return module.p;}).catch(error => {mathLibrary = null; throw error;});
  return mathLibrary;
}

export async function prepareVisualization(fragment, {document:doc=globalThis.document, renderMath} = {}) {
  if (typeof fragment !== 'string' || fragment.length > 5e6 || !doc?.createElement) return fragment;
  const template = doc.createElement('template');
  template.innerHTML = fragment;
  const content = template.content, tokens = new Set();
  for (const element of content.querySelectorAll('[class]')) for (const token of element.classList) tokens.add(token);
  const legacy = [...tokens].some(token => /^(?:md:|grid-cols-|text-\[var\(--viz-|bg-\[var\(--viz-)/.test(token));
  if (legacy) {
    for (const input of content.querySelectorAll('input[type="range"]')) input.classList.add('form-range');
  }
  const walker = doc.createTreeWalker(content, 4), candidates = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(EXCLUDED)) continue;
    const segments = mathSegments(node.data);
    if (segments.length) candidates.push({node,segments});
    if (candidates.length >= 200) break;
  }
  if (candidates.length) {
    try {
      const render = renderMath ?? await loadMath();
      for (const {node,segments} of candidates) {
        const replacement = doc.createDocumentFragment();
        let position = 0;
        for (const segment of segments) {
          replacement.append(doc.createTextNode(node.data.slice(position, segment.index)));
          const span = doc.createElement('span');
          span.className = 'local-viz-math';
          if (segment.displayMode) span.dataset.display = 'block';
          try {
            span.innerHTML = render(segment.tex, {output:'mathml', displayMode:segment.displayMode, throwOnError:true, trust:false, strict:'ignore', maxExpand:1000, maxSize:20});
            replacement.append(span);
          } catch { replacement.append(doc.createTextNode(node.data.slice(segment.index, segment.index + segment.length))); }
          position = segment.index + segment.length;
        }
        replacement.append(doc.createTextNode(node.data.slice(position)));
        node.replaceWith(replacement);
      }
    } catch { /* A missing math asset must not prevent the original visualization from opening. */ }
  }
  return '<style data-local-visualization-compat="1">' + compatibilityCSS(tokens) + '</style>' + template.innerHTML;
}
