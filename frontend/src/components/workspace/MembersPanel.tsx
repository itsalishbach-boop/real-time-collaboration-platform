'use client';
import { useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WorkspaceMember } from '@/lib/types';
import { Crown, Wifi } from 'lucide-react';

interface Props {
  workspaceId: string;
  members: WorkspaceMember[];
  setMembers: React.Dispatch<React.SetStateAction<WorkspaceMember[]>>;
}

export default function MembersPanel({ workspaceId, members, setMembers }: Props) {
  const handlePresence = useCallback((data: unknown) => {
    const msg = data as { type: string; user_id?: number; is_online?: boolean; members?: { user_id: number; username: string; is_online: boolean }[] };
    if (msg.type === 'presence_update') {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === msg.user_id ? { ...m, is_online: msg.is_online! } : m
        )
      );
    } else if (msg.type === 'online_members') {
      const onlineMap = new Map(msg.members!.map((m) => [m.user_id, m.is_online]));
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          is_online: onlineMap.get(m.id) ?? m.is_online,
        }))
      );
    }
  }, [setMembers]);

  useWebSocket(`ws/presence/${workspaceId}/`, handlePresence);

  const online = members.filter((m) => m.is_online);
  const offline = members.filter((m) => !m.is_online);

  const avatarColor = (name: string) => {
    const colors = [
      'from-green-400 to-emerald-500',
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-violet-500',
      'from-orange-400 to-amber-500',
      'from-pink-400 to-rose-500',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const MemberRow = ({ member }: { member: WorkspaceMember }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors group">
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${avatarColor(member.username)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
          {member.username[0]?.toUpperCase()}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
          member.is_online ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800 truncate">{member.username}</span>
          {member.role === 'admin' && (
            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
        </div>
        <span className="text-xs text-gray-400 truncate block">{member.email}</span>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        member.is_online
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-400'
      }`}>
        {member.is_online ? 'Online' : 'Offline'}
      </span>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-gray-900">Members</h2>
          <p className="text-xs text-gray-400 mt-0.5">{members.length} total · {online.length} online</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
          <Wifi className="w-3 h-3" /> Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {online.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2">
              Online — {online.length}
            </p>
            {online.map((m) => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
        {offline.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2">
              Offline — {offline.length}
            </p>
            {offline.map((m) => <MemberRow key={m.id} member={m} />)}
          </div>
        )}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-sm text-gray-400">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
