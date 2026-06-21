import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Image as ImageIcon, Upload, X } from 'lucide-react';
import { API_BASE_URL } from '../../constants';

const ALLOWED_TAGS = new Set([
  'P', 'DIV', 'BR', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE',
  'UL', 'OL', 'LI', 'A', 'IMG', 'VIDEO', 'SOURCE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'
]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
  IMG: new Set(['src', 'alt', 'style', 'width', 'height']),
  VIDEO: new Set(['src', 'controls', 'muted', 'playsinline', 'width', 'height']),
  SOURCE: new Set(['src', 'type']),
  '*': new Set(['style'])
};

export const sanitizeRichText = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;

  const cleanNode = (node: Node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tag = element.tagName;

        if (!ALLOWED_TAGS.has(tag)) {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) fragment.appendChild(element.firstChild);
          element.replaceWith(fragment);
          cleanNode(node);
          return;
        }

        [...element.attributes].forEach(attr => {
          const allowed = ALLOWED_ATTRS[tag] || ALLOWED_ATTRS['*'];
          const name = attr.name.toLowerCase();
          if (!allowed.has(name) || name.startsWith('on')) {
            element.removeAttribute(attr.name);
          }
        });

        if (tag === 'A') {
          const href = element.getAttribute('href') || '';
          if (!/^https?:|^mailto:|^tel:/.test(href)) {
            element.removeAttribute('href');
          } else {
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          }
        }

        if (tag === 'IMG') {
          const src = element.getAttribute('src') || '';
          if (!src || src.startsWith('javascript:') || src.startsWith('data:text')) {
            element.remove();
            return;
          }
        }

        if (tag === 'VIDEO') {
          const src = element.getAttribute('src') || '';
          if (!src || src.startsWith('javascript:')) {
            element.remove();
            return;
          }
          element.setAttribute('controls', '');
          element.setAttribute('playsinline', '');
        }

        cleanNode(element);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };

  cleanNode(template.content);
  return template.innerHTML;
};

const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

export const RichTextEditor = ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = sanitizeRichText(value || '');
    if (document.activeElement !== editor && editor.innerHTML !== sanitized) {
      editor.innerHTML = sanitized;
    }
  }, [value]);

  const emitChange = () => {
    saveSelection();
    onChange(sanitizeRichText(editorRef.current?.innerHTML || ''));
  };

  const focusEditor = () => {
    editorRef.current?.focus({ preventScroll: true });
  };

  const placeCaretAtEnd = () => {
    const editor = editorRef.current;
    if (!editor) return;

    focusEditor();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return;
    savedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    focusEditor();

    const selection = window.getSelection();
    selection?.removeAllRanges();

    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      selection?.addRange(savedRangeRef.current);
    } else {
      placeCaretAtEnd();
    }
  };

  const placeCaretAfterNode = (node: Node) => {
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const placeCaretInsideNode = (node: Node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();
  };

  const insertFragmentAtSelection = (fragment: DocumentFragment) => {
    restoreSelection();

    const editor = editorRef.current;
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) {
      placeCaretAtEnd();
      return;
    }

    const insertedNodes = Array.from(fragment.childNodes);
    range.deleteContents();
    range.insertNode(fragment);
    const lastInsertedNode = insertedNodes[insertedNodes.length - 1] || null;

    if (lastInsertedNode && lastInsertedNode.parentNode) {
      const isBlockWrapper = lastInsertedNode.nodeType === Node.ELEMENT_NODE && ['P', 'DIV', 'BLOCKQUOTE', 'LI'].includes((lastInsertedNode as Element).tagName);
      if (isBlockWrapper) {
        const nextSibling = lastInsertedNode.nextSibling;
        if (!nextSibling) {
          const emptyParagraph = document.createElement('p');
          emptyParagraph.innerHTML = '<br>';
          lastInsertedNode.parentNode.insertBefore(emptyParagraph, nextSibling);
          placeCaretInsideNode(emptyParagraph);
          return;
        }
        placeCaretInsideNode(lastInsertedNode);
        return;
      }
      placeCaretAfterNode(lastInsertedNode);
    } else {
      placeCaretAtEnd();
    }
  };

  const execFormattingCommand = (command: string, value?: string) => {
    restoreSelection();
    const editor = editorRef.current;
    if (!editor) return;

    document.execCommand(command, false, value);
    emitChange();
  };

  const insertHtml = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    insertFragmentAtSelection(template.content);
  };

  const runCommand = (command: string, value?: string) => {
    restoreSelection();
    exec(command, value);
    emitChange();
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload.php`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!data.url) throw new Error(data.error || 'Upload failed');

      focusEditor();
      if (file.type.startsWith('image/')) {
        insertHtml(`<p><img src="${data.url}" alt="" style="max-width:100%;height:auto;border-radius:16px;" /></p>`);
      } else {
        insertHtml(`<p><video src="${data.url}" controls playsinline style="max-width:100%;border-radius:16px;"></video></p>`);
      }
      emitChange();
    } catch (error) {
      console.error('Rich text media upload failed:', error);
      alert('Media upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    restoreSelection();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    insertHtml(sanitizeRichText(html || text.replace(/\n/g, '<br>')));
    emitChange();
  };

  const ToolbarButton = ({ active, children, title, onClick, disabled }: { active?: boolean; children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) => (
    <button
      type="button"
      title={title}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 min-w-9 rounded-xl border px-2 text-xs font-black transition-all ${active ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {children}
    </button>
  );

  const editorContent = (
    <div className="relative rounded-[28px] border border-gray-200 bg-white overflow-hidden transition-all">
      <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <ToolbarButton title="Bold" onClick={() => runCommand('bold')}><Bold size={16} /></ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => runCommand('italic')}><Italic size={16} /></ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => runCommand('underline')}><Underline size={16} /></ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => runCommand('strikeThrough')}><Strikethrough size={16} /></ToolbarButton>
          <ToolbarButton
            title="Add Image or Video"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : <ImageIcon size={16} />}
          </ToolbarButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                if (editorRef.current) editorRef.current.innerHTML = '';
              }}
              className="h-9 rounded-xl border border-red-100 px-3 text-xs font-black text-red-500 hover:bg-red-50"
              title="Clear editor"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="h-72">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onPaste={handlePaste}
          onSelect={saveSelection}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={saveSelection}
          className="h-full w-full overflow-y-auto px-5 py-4 text-sm leading-relaxed outline-none prose prose-sm max-w-none"
          data-placeholder={label}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        className="hidden"
      />

      <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>{isUploading ? <span className="inline-flex items-center gap-2"><Upload size={12} className="animate-spin" /> Uploading media...</span> : 'Rich text + media editor'}</span>
      </div>
    </div>
  );

  return editorContent;
};
