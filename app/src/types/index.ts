export type Folder = 'Life' | 'Doing' | 'Ideas' | 'Archive';

export type EntryType =
  | 'log'
  | 'note'
  | 'blocker'
  | 'waiting'
  | 'decision'
  | 'milestone'
  | 'completed'
  | 'attachment';

export type ThreadStatus =
  | 'INBOX'
  | 'ACTIVE'
  | 'WAITING'
  | 'BLOCKED'
  | 'DONE'
  | 'ARCHIVED'
  | 'ABANDONED';

export interface Thread {
  id: string;
  title: string;
  folder: Folder;
  subfolder?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  abandoned_at: string | null;
}

export interface Entry {
  id: string;
  thread_id: string;
  type: EntryType;
  body: string;
  attachment_url: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}
