import { useLayoutEffect, useRef } from 'react';

export const BLOCK_TYPES = [
  ['paragraph', 'Text'], ['heading', 'Heading'], ['todo', 'Checklist'], ['bullet', 'Bullet'],
  ['quote', 'Quote'], ['code', 'Code'], ['divider', 'Divider'],
];

export default function BlockRow({ block, autoFocus, onChange, onTypeChange, onDelete }) {
  const type = block.type || 'paragraph';
  const ref = useRef(null);

  // autoSize: same rule as the original (height auto -> max(32, scrollHeight)).
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(32, el.scrollHeight) + 'px';
    }
  }, [block.content, type]);

  useLayoutEffect(() => {
    if (autoFocus && ref.current) ref.current.focus();
  }, [autoFocus]);

  return (
    <div className="block-row" data-type={type}>
      <div className="block-grip">⋮⋮</div>
      <select className="block-type" value={type} onChange={(e) => onTypeChange(e.target.value)}>
        {BLOCK_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <div className="block-body">
        {type === 'todo' && (
          <input
            type="checkbox"
            className="todo-check"
            checked={!!block.completed}
            onChange={(e) => onChange({ completed: e.target.checked })}
          />
        )}
        {type === 'divider' ? (
          <div className="block-divider" />
        ) : (
          <textarea
            ref={ref}
            className={'block-input ' + type}
            rows={type === 'code' ? 3 : 1}
            placeholder={type === 'heading' ? 'Heading…' : type === 'todo' ? 'Task…' : 'Start writing…'}
            value={block.content || ''}
            onChange={(e) => onChange({ content: e.target.value })}
          />
        )}
      </div>
      <button className="block-delete" title="Remove block" onClick={onDelete}>×</button>
    </div>
  );
}
