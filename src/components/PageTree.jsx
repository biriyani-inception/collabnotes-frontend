export default function PageTree({ pages, currentPageId, onOpen, onDelete }) {
  const byParent = {};
  pages.forEach((p) => {
    const key = p.parentId || 'root';
    (byParent[key] ??= []).push(p);
  });

  const rows = [];
  (function level(parent, depth) {
    (byParent[parent] || []).forEach((p) => {
      rows.push(
        <div
          key={p.id}
          className={'page-item' + (p.id === currentPageId ? ' active' : '')}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => onOpen(p.id)}
        >
          <span>{p.title || 'Untitled'}</span>
          <button
            className="del-btn"
            title="Delete page"
            onClick={(ev) => { ev.stopPropagation(); onDelete(p); }}
          >✕</button>
        </div>
      );
      level(p.id, depth + 1);
    });
  })('root', 0);

  return <div className="page-tree">{rows}</div>;
}
