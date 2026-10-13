// Prefixes root-relative links and images in Markdown/MDX with the site base,
// so authors can write [link](/glossary#regression) and it still works on GitHub Pages.
export function rehypeBaseLinks({ base = '/' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const fix = (url) =>
    typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && prefix && !url.startsWith(prefix + '/')
      ? prefix + url
      : url;

  const walk = (node) => {
    if (node.type === 'element') {
      if (node.tagName === 'a' && node.properties?.href) node.properties.href = fix(node.properties.href);
      if (node.tagName === 'img' && node.properties?.src) node.properties.src = fix(node.properties.src);
    }
    // Raw <a href="/..."> / <img src="/..."> written as JSX inside MDX.
    if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && (node.name === 'a' || node.name === 'img')) {
      for (const attr of node.attributes ?? []) {
        if (attr.type === 'mdxJsxAttribute' && (attr.name === 'href' || attr.name === 'src') && typeof attr.value === 'string') {
          attr.value = fix(attr.value);
        }
      }
    }
    node.children?.forEach(walk);
  };

  return (tree) => walk(tree);
}
