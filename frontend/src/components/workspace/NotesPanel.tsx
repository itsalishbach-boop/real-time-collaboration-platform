'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Note, User } from '@/lib/types';
import { Plus, FileText, ChevronRight, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Props {
  workspaceId: string;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  currentUser: User;
}

export default function NotesPanel({ workspaceId, notes, setNotes, currentUser }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  void currentUser;

  const createNote = async () => {
    setCreating(true);
    try {
      const { data } = await api.post(`/notes/${workspaceId}/`, { title: 'Untitled Note', content: '' });
      setNotes((prev) => [data, ...prev]);
      router.push(`/workspace/${workspaceId}/notes/${data.id}`);
    } catch {
      toast.error('Failed to create note');
    } finally {
      setCreating(false);
    }
  };

  const deleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/detail/${noteId}/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-gray-900">Shared Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={createNote}
          disabled={creating}
          className="flex items-center gap-1.5 px-3.5 py-2 gradient-brand text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {creating
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Plus className="w-3.5 h-3.5" />
          }
          New Note
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <p className="font-semibold text-gray-700">No notes yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a note to collaborate with your team</p>
            <button
              onClick={createNote}
              className="mt-4 px-4 py-2 gradient-brand text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create first note
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => router.push(`/workspace/${workspaceId}/notes/${note.id}`)}
                className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer group transition-all"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                  <FileText className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{note.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    {note.last_edited_by_name && (
                      <span className="text-gray-300">· by {note.last_edited_by_name}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => deleteNote(note.id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
