'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button, Input, Badge } from '@/components/ui';
import { useGroup } from '@/hooks/useGroup';
import styles from './group.module.css';

type GroupView = 'main' | 'create' | 'join';

export default function GroupPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { group, loading: groupLoading, refetch } = useGroup(user?.uid);
  const [view, setView] = useState<GroupView>('main');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user || groupLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingIcon}>🍳</span>
        <p>加载中...</p>
      </div>
    );
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建失败');
      }
      await refetch();
      setView('main');
      setGroupName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '加入失败');
      }
      await refetch();
      setView('main');
      setInviteCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加入失败，请检查邀请码');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKickMember = async (targetUid: string, name: string) => {
    if (!user || !group) return;
    const confirm1 = confirm(`确认要将家庭成员“${name}”移出吗？`);
    if (!confirm1) return;
    const confirm2 = confirm(`再次确认：移出后“${name}”将无法继续查看或在此家庭中点菜。是否真的移出？`);
    if (!confirm2) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid,
        },
        body: JSON.stringify({ targetUid }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '移出失败');
      }
      await refetch();
    } catch (err: any) {
      alert(err.message || '移出失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDissolveGroup = async () => {
    if (!user || !group) return;
    const confirm1 = confirm('确定要解散当前整个家庭吗？此操作将移除全部成员且无法恢复！');
    if (!confirm1) return;
    const confirm2 = confirm('再次确认：解散家庭将清空今日菜单及订单历史。确定要解散吗？');
    if (!confirm2) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/dissolve', {
        method: 'POST',
        headers: {
          'x-user-uid': user.uid,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解散失败');
      }
      await refetch();
    } catch (err: any) {
      alert(err.message || '解散失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // --- CREATE VIEW ---
  if (view === 'create') {
    return (
      <div className={styles.page}>
        <Header title="创建家庭" showBack rightAction={
          <button className={styles.cancelBtn} onClick={() => { setView('main'); setError(''); }}>取消</button>
        } />
        <main className={styles.main}>
          <div className={styles.formCard}>
            <div className={styles.formIcon}>🏠</div>
            <h2 className={styles.formTitle}>给你的家庭起个名字</h2>
            <p className={styles.formDesc}>家庭成员可以一起共享菜谱、一起点菜</p>
            <form onSubmit={handleCreateGroup} className={styles.form}>
              <Input
                label="家庭名称"
                placeholder="例如：我家的厨房 👨‍👩‍👧"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              {error && <p className={styles.errorText}>{error}</p>}
              <Button type="submit" fullWidth size="lg" loading={submitting}>
                🌟 创建家庭
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // --- JOIN VIEW ---
  if (view === 'join') {
    return (
      <div className={styles.page}>
        <Header title="加入家庭" showBack rightAction={
          <button className={styles.cancelBtn} onClick={() => { setView('main'); setError(''); }}>取消</button>
        } />
        <main className={styles.main}>
          <div className={styles.formCard}>
            <div className={styles.formIcon}>🔑</div>
            <h2 className={styles.formTitle}>输入邀请码</h2>
            <p className={styles.formDesc}>让家人把邀请码发给你，一起用 CookBro 吃饭！</p>
            <form onSubmit={handleJoinGroup} className={styles.form}>
              <Input
                label="邀请码（6位）"
                placeholder="例如：ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
              />
              {error && <p className={styles.errorText}>{error}</p>}
              <Button type="submit" fullWidth size="lg" loading={submitting}>
                加入家庭
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const isCreator = group && group.createdBy === user?.uid;

  // --- MAIN VIEW ---
  return (
    <div className={styles.page}>
      <Header title="家庭" />

      <main className={styles.main}>
        {/* 用户信息 */}
        <div className={styles.profileCard}>
          <div className={styles.profileAvatar}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.profileImg} />
            ) : (
              <span className={styles.profileFallback}>
                {(user?.displayName || user?.email || '?')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h3 className={styles.profileName}>{user?.displayName || '用户'}</h3>
            <p className={styles.profileEmail}>{user?.email}</p>
          </div>
        </div>

        {/* 已有群组 */}
        {group ? (
          <div className={styles.groupCard}>
            <div className={styles.groupHeader}>
              <div className={styles.groupHeaderLeft}>
                <div className={styles.groupIcon}>🏠</div>
                <div>
                  <h3 className={styles.groupName}>{group.name}</h3>
                  <p className={styles.groupMeta}>{group.members.length} 位成员</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => router.push('/orders')}>
                📋 订单历史
              </Button>
            </div>

            <div className={styles.divider} />

            {/* 成员列表 */}
            <div className={styles.membersSection}>
              <h4 className={styles.sectionTitle}>家庭成员</h4>
              <div className={styles.membersList}>
                {group.memberProfiles?.map((member) => {
                  const isMe = member.uid === user?.uid;
                  const isMemberCreator = member.uid === group.createdBy;
                  return (
                    <div key={member.uid} className={styles.memberRow}>
                      <div className={styles.memberAvatar}>
                        {member.photoURL ? (
                          <img src={member.photoURL} alt="" className={styles.memberAvatarImg} />
                        ) : (
                          <span className={styles.memberAvatarFallback}>
                            {(member.displayName || member.email || '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberNameRow}>
                          <span className={styles.memberName}>{member.displayName}</span>
                          {isMemberCreator && <Badge variant="warning">创建者</Badge>}
                          {isMe && <Badge variant="primary">你</Badge>}
                        </div>
                        <span className={styles.memberEmail}>{member.email}</span>
                      </div>
                      {isCreator && !isMe && (
                        <button
                          className={styles.kickBtn}
                          disabled={actionLoading}
                          onClick={() => handleKickMember(member.uid, member.displayName)}
                        >
                          移出
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.divider} />

            {/* 邀请功能 */}
            <div className={styles.inviteToggleSection}>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowInvite(!showInvite)}
              >
                {showInvite ? '收起邀请码 ▲' : '邀请家庭成员 ▼'}
              </Button>

              {showInvite && (
                <div className={styles.inviteSection}>
                  <p className={styles.inviteLabel}>邀请码（分享给家人）</p>
                  <div className={styles.inviteRow}>
                    <span className={styles.inviteCode}>{group.inviteCode}</span>
                    <button className={styles.copyBtn} onClick={handleCopyCode}>
                      {copied ? '✅ 已复制' : '📋 复制'}
                    </button>
                  </div>
                  <p className={styles.inviteHint}>家人输入此邀请码即可加入</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 未加入群组 */
          <div className={styles.noGroupSection}>
            <div className={styles.noGroupIcon}>🏠</div>
            <h3 className={styles.noGroupTitle}>还没有加入家庭群组</h3>
            <p className={styles.noGroupDesc}>
              创建或加入一个家庭，和家人一起规划每天的饭菜吧！
            </p>
            <div className={styles.groupActions}>
              <Button fullWidth onClick={() => setView('create')}>
                ✨ 创建我的家庭
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setView('join')}>
                🔑 用邀请码加入
              </Button>
            </div>
          </div>
        )}

        {group && isCreator && (
          <div className={styles.groupSecondaryActions}>
            <Button
              variant="danger"
              fullWidth
              loading={actionLoading}
              onClick={handleDissolveGroup}
            >
              解散整个家庭 🗑️
            </Button>
          </div>
        )}

        {/* 登出 */}
        <div className={styles.logoutSection}>
          <Button variant="ghost" fullWidth onClick={handleSignOut}>
            🚶 退出登录
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
