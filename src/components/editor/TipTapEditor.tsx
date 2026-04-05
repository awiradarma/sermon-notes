import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Type } from 'lucide-react';
import { useEffect, useState } from 'react';

const FONT_SIZES = ['prose-sm', 'prose-base', 'prose-lg', 'prose-xl'];

export function TipTapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // default 'prose-base'

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[50vh] pb-32 h-full',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const cycleFontSize = () => {
    setFontSizeIndex((prev) => (prev + 1) % FONT_SIZES.length);
  };

  return (
    <div className="w-full relative block">
      <div className="flex flex-wrap items-center gap-1 p-2 sticky top-14 z-50 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur border-y shadow-sm w-full transition-all duration-300">
        <button
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          title="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          title="Numbered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
         <button
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <div className="flex-1"></div>
        
        <button
          title="Change Font Size"
          onClick={cycleFontSize}
          className="p-2 flex items-center justify-center rounded-md transition-colors hover:bg-muted text-primary"
        >
          <Type className="w-4 h-4 font-bold" />
        </button>
      </div>
      
      <div className={`px-4 py-6 md:px-8 bg-card shadow-sm border-x border-b rounded-b-xl min-h-[50vh] prose dark:prose-invert ${FONT_SIZES[fontSizeIndex]} max-w-full transition-all duration-300`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
