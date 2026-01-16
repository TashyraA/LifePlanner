import React, { useState, useEffect, useRef } from 'react';
import { useNotebook, NotebookNote } from '../contexts/NotebookContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image,
  Clock,
  Save,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface NotebookEditorProps {
  note: NotebookNote;
  courseId: string;
  assignmentId: string;
  courseName: string;
  assignmentName: string;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({
  note,
  courseId,
  assignmentId,
  courseName,
  assignmentName,
}) => {
  const { updateNote, deleteNote } = useNotebook();
  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [fontSize, setFontSize] = useState(note.fontSize);
  const [fontFamily, setFontFamily] = useState(note.fontFamily);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date(note.updatedAt));
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save on content change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(courseId, assignmentId, note.id, {
        content,
        title,
        fontSize,
        fontFamily,
      });
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, title, fontSize, fontFamily, courseId, assignmentId, note.id, updateNote]);

  const insertMarkdown = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selected +
      after +
      content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selected.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      // No selection, just toggle the format state
      if (format === 'bold') setIsBold(!isBold);
      if (format === 'italic') setIsItalic(!isItalic);
      if (format === 'underline') setIsUnderline(!isUnderline);
      return;
    }

    // Has selection, wrap it
    const selected = content.substring(start, end);
    let before = '';
    let after = '';

    if (format === 'bold') {
      before = '**';
      after = '**';
    } else if (format === 'italic') {
      before = '*';
      after = '*';
    } else if (format === 'underline') {
      before = '<u>';
      after = '</u>';
    }

    const newContent =
      content.substring(0, start) +
      before +
      selected +
      after +
      content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const handleAddLink = () => {
    insertMarkdown('[Link Text](', ')');
  };

  const handleAddImage = () => {
    insertMarkdown('![Alt Text](', ')');
  };

  const handleDeleteNote = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(courseId, assignmentId, note.id);
    }
  };

  const FONT_FAMILIES = [
    { value: 'system-ui', label: 'System Default' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: '"Helvetica Neue", Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Garamond, serif', label: 'Garamond' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
    { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
    { value: '"Palatino Linotype", "Book Antiqua", Palatino, serif', label: 'Palatino' },
    { value: '"Lucida Console", Monaco, monospace', label: 'Lucida Console' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Editor Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold text-slate-800 bg-transparent border-0 outline-none w-full mb-1"
            placeholder="Note title..."
          />
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{courseName}</span>
            <span>•</span>
            <span>{assignmentName}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isSaving ? (
                <span>Saving...</span>
              ) : lastSaved ? (
                <span>Saved {format(lastSaved, 'h:mm a')}</span>
              ) : (
                <span>Not saved</span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDeleteNote}
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Formatting Toolbar */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-3 flex-wrap">
        {/* Font Family */}
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="w-40 h-9 border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select value={fontSize.toString()} onValueChange={(val) => setFontSize(parseInt(val))}>
          <SelectTrigger className="w-20 h-9 border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="border-l border-slate-200 h-6 mx-1" />

        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            onClick={() => applyFormatting('bold')}
            className={`p-2 hover:bg-slate-100 rounded transition-colors ${isBold ? 'bg-slate-200' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => applyFormatting('italic')}
            className={`p-2 hover:bg-slate-100 rounded transition-colors ${isItalic ? 'bg-slate-200' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => applyFormatting('underline')}
            className={`p-2 hover:bg-slate-100 rounded transition-colors ${isUnderline ? 'bg-slate-200' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
          <button
            onClick={() => insertMarkdown('\n- ', '')}
            className="p-2 hover:bg-slate-100 rounded transition-colors"
            title="Bullet List"
          >
            <List className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => insertMarkdown('\n1. ', '')}
            className="p-2 hover:bg-slate-100 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Links and Images */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddLink}
            className="p-2 hover:bg-slate-100 rounded transition-colors"
            title="Add Link"
          >
            <Link2 className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={handleAddImage}
            className="p-2 hover:bg-slate-100 rounded transition-colors"
            title="Add Image"
          >
            <Image className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your notes here... Select text and use the formatting buttons above. Use **bold**, *italic*, <u>underline</u>. Add lists with - or 1. prefix. Add links with [text](url) and images with ![alt](url)"
            className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:border-0 bg-gradient-to-b from-white to-slate-50 text-slate-800 placeholder-slate-400"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight: '1.6',
              padding: '24px',
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
            }}
            spellCheck="true"
          />
        </div>

        {/* Footer with Stats */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 flex justify-between">
          <div className="space-x-4 flex">
            <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            <span>{content.length} characters</span>
          </div>
          <span>Created {format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
};

export default NotebookEditor;
