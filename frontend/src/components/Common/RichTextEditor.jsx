import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useLanguage } from '../../context/LanguageContext';

const BTN = "p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm leading-none";
const BTN_ACTIVE = "p-1.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm leading-none";

function LinkModal({ open, onClose, onSubmit, initialUrl, initialTitle }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState(initialUrl || 'https://');
  const [title, setTitle] = useState(initialTitle || '');
  const [newTab, setNewTab] = useState(true);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl || 'https://');
      setTitle(initialTitle || '');
      setNewTab(true);
    }
  }, [open, initialUrl, initialTitle]);

  if (!open) return null;

  const handleConfirm = () => {
    if (url && url !== 'https://') onSubmit({ url, title, newTab });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-sm dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[60] px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {t('richEditor.linkTitle') || 'Insert Link'}
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t('richEditor.linkUrl') || 'URL'}
          </label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={handleKeyDown}
            className={inputClass} placeholder="https://example.com" autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            {t('richEditor.linkText') || 'Text (optional)'}
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleKeyDown}
            className={inputClass} placeholder={t('richEditor.linkTextPlaceholder') || 'Link text'} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{t('richEditor.openNewTab') || 'Open in new tab'}</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={handleConfirm}
            className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function HtmlModal({ open, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [html, setHtml] = useState('');

  useEffect(() => { if (open) setHtml(''); }, [open]);

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[60] px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {t('richEditor.importHtml') || 'Import HTML'}
        </h3>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} onKeyDown={handleKeyDown}
          className="w-full h-48 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:border-primary-400 outline-none text-xs font-mono dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 resize-none"
          placeholder={t('richEditor.importHtmlPlaceholder') || 'Paste HTML code here...'} autoFocus />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={() => { if (html.trim()) onSubmit(html); }}
            className="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            {t('richEditor.import') || 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuBar({ editor, onLinkClick, onHtmlClick }) {
  const { t } = useLanguage();
  if (!editor) return null;

  const btn = (active) => active ? BTN_ACTIVE : BTN;

  return (
    <div className="flex flex-wrap gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))} title="Bold"><b>B</b></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))} title="Italic"><i>I</i></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btn(editor.isActive('underline'))} title="Underline"><u>U</u></button>

      <span className="w-px bg-gray-300 dark:bg-gray-500 mx-1" />

      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))} title="Heading">
        <span className="font-bold">H</span></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive('heading', { level: 3 }))} title="Subheading">
        H<sub>2</sub></button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={btn(editor.isActive('paragraph') && !editor.isActive('heading'))} title="Paragraph">P</button>

      <span className="w-px bg-gray-300 dark:bg-gray-500 mx-1" />

      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))} title="Bullet list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))} title="Numbered list">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      </button>

      <span className="w-px bg-gray-300 dark:bg-gray-500 mx-1" />

      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={onLinkClick}
        className={btn(editor.isActive('link'))} title="Link">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className={BTN} title="Clear formatting">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()}
        onClick={onHtmlClick}
        className={BTN} title={t('richEditor.importHtml') || 'Import HTML'}>
        <span className="font-mono text-xs leading-none">&lt;/&gt;</span>
      </button>
    </div>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const [linkModal, setLinkModal] = useState(false);
  const [htmlModal, setHtmlModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[160px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm outline-none prose prose-sm dark:prose-invert max-w-none',
        'data-placeholder': placeholder || '',
      },
    },
  });

  const handleLinkClick = useCallback(() => {
    setLinkModal(true);
  }, []);

  const handleHtmlImport = useCallback((html) => {
    if (!editor) return;
    editor.commands.setContent(html, true);
    setHtmlModal(false);
  }, [editor]);

  const handleLinkSubmit = useCallback(({ url, title, newTab }) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const attrs = newTab
      ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
      : { href: url, target: null, rel: null };

    if (title && !hasSelection) {
      const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      editor.chain().focus()
        .insertContent(`<a href="${url}"${target}>${title}</a>`)
        .run();
    } else {
      editor.chain().focus()
        .extendMarkRange('link')
        .setLink(attrs)
        .run();
    }
    setLinkModal(false);
  }, [editor]);

  // Sync external value changes (e.g. when editing an existing item)
  useEffect(() => {
    if (editor && value !== undefined) {
      const current = editor.getHTML();
      if (current !== value && !(current === '<p></p>' && !value)) {
        editor.commands.setContent(value || '', false);
      }
    }
  }, [value, editor]);

  // Get selected text and existing link URL for the modal
  const selectedText = editor ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '') : '';
  const existingUrl = editor?.isActive('link') ? editor.getAttributes('link').href : '';

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
      <MenuBar editor={editor} onLinkClick={handleLinkClick} onHtmlClick={() => setHtmlModal(true)} />
      <div className="text-gray-800 dark:text-gray-100 dark:bg-gray-700 [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child]:before:text-gray-400 [&_.tiptap_p.is-editor-empty:first-child]:before:float-left [&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none">
        <EditorContent editor={editor} />
      </div>
      <LinkModal
        open={linkModal}
        onClose={() => { setLinkModal(false); editor?.chain().focus().run(); }}
        onSubmit={handleLinkSubmit}
        initialUrl={existingUrl}
        initialTitle={selectedText}
      />
      <HtmlModal
        open={htmlModal}
        onClose={() => { setHtmlModal(false); editor?.chain().focus().run(); }}
        onSubmit={handleHtmlImport}
      />
    </div>
  );
}
