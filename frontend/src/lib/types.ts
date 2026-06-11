export interface User {
  id: number;
  email: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  owner_id: number;
  owner_name: string;
  member_count: number;
  is_owner: boolean;
  created_at: string;
}

export interface WorkspaceMember {
  id: number;
  email: string;
  username: string;
  is_online: boolean;
  avatar_url: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Message {
  id: string;
  workspace: string;
  sender_id: number;
  sender_name: string;
  sender_email: string;
  avatar_url: string | null;
  content: string;
  file_url: string | null;
  file_name: string;
  message_type: 'text' | 'file';
  created_at: string;
}

export interface Note {
  id: string;
  workspace: string;
  title: string;
  content: string;
  created_by_name: string;
  last_edited_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteVersion {
  id: string;
  title: string;
  content: string;
  edited_by_name: string;
  created_at: string;
}

export interface Notification {
  id: string;
  notification_type: 'message' | 'workspace_join' | 'note_update' | 'mention';
  title: string;
  message: string;
  workspace_id: string | null;
  sender_name: string | null;
  is_read: boolean;
  created_at: string;
}
