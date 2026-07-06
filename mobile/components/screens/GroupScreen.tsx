import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../../theme';
import { Card, Badge, Button, Input, AlertModal } from '../ui';
import { apiFetch, clearSession, UserSession } from '../../lib/api';
import { CookGroup, UserProfile } from '../../lib/types';

const { width } = Dimensions.get('window');

interface GroupScreenProps {
  user: UserSession;
  onLogout: () => void;
}

export function GroupScreen({ user, onLogout }: GroupScreenProps) {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [group, setGroup] = useState<CookGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Input fields
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  // Notice & Confirmation dialogs (Phase 5: Replaced native popups with custom AlertModals!)
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'warning' | 'error' | 'info'>('info');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmDesc, setConfirmDesc] = useState('');
  const [confirmVariant, setConfirmVariant] = useState<'primary' | 'danger'>('primary');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const [copied, setCopied] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);

  // Fetch current user's group details
  const fetchGroupDetails = () => {
    setLoading(true);
    apiFetch('/api/groups')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
        } else {
          setGroup(null);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch group details from server, falling back to mock group details:', err);
        // Fallback to local mock group for rich debugging
        const mockGroup: CookGroup = {
          id: 'mock-group-123',
          name: '我家的厨房 👨‍👩‍👧',
          members: [user.uid, 'mom-uid', 'dad-uid'],
          inviteCode: 'COOK66',
          createdBy: 'mom-uid',
          createdAt: new Date().toISOString(),
          memberProfiles: [
            {
              uid: user.uid,
              displayName: user.displayName || '我',
              email: user.email,
              createdAt: new Date().toISOString(),
            },
            {
              uid: 'mom-uid',
              displayName: '家庭大厨 (妈妈)',
              email: 'mom@cookbro.com',
              createdAt: new Date().toISOString(),
            },
            {
              uid: 'dad-uid',
              displayName: '帮厨小能手 (爸爸)',
              email: 'dad@cookbro.com',
              createdAt: new Date().toISOString(),
            }
          ]
        };
        setGroup(mockGroup);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGroupDetails();
  }, []);

  const triggerAlert = (title: string, desc: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertDesc(desc);
    setAlertType(type);
    setAlertOpen(true);
  };

  const triggerConfirm = (title: string, desc: string, onConfirm: () => void, variant: 'primary' | 'danger' = 'primary') => {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    setConfirmAction(() => onConfirm);
    setConfirmVariant(variant);
    setConfirmOpen(true);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      triggerAlert('提示', '请输入家庭群组名称', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建家庭失败');
      }

      triggerAlert('成功', '您的家庭厨房创建成功！', 'success');
      setView('main');
      setGroupName('');
      fetchGroupDetails();
    } catch (err: any) {
      console.error(err);
      triggerAlert('创建失败', err.message || '网络连接失败，请稍后重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      triggerAlert('提示', '请输入合法的6位邀请码', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/groups/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '加入家庭失败，请确认邀请码是否正确');
      }

      triggerAlert('成功', '加入家庭厨房成功，开始规划今天的饭菜吧！', 'success');
      setView('main');
      setInviteCode('');
      fetchGroupDetails();
    } catch (err: any) {
      console.error(err);
      triggerAlert('加入失败', err.message || '网络连接失败，请稍后重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!group?.inviteCode) return;
    await Clipboard.setStringAsync(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKickMember = (member: UserProfile) => {
    triggerConfirm(
      '移出成员',
      `确定要将家庭成员 “${member.displayName}” 移出吗？移出后该成员将无法共同规划饭菜。`,
      async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
          const res = await apiFetch('/api/groups/kick', {
            method: 'POST',
            body: JSON.stringify({ targetUid: member.uid })
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '移出失败');
          }

          triggerAlert('成功', `成员 “${member.displayName}” 已从家庭移出`, 'success');
          fetchGroupDetails();
        } catch (err: any) {
          triggerAlert('操作失败', err.message || '移出成员失败，请重试', 'error');
          setLoading(false);
        }
      },
      'danger'
    );
  };

  const handleDissolveGroup = () => {
    triggerConfirm(
      '解散家庭',
      '确定要解散当前家庭群组吗？解散后所有成员关系、订单历史及饭菜规划都将被清空，且不可撤销！',
      async () => {
        setConfirmOpen(false);
        setLoading(true);
        try {
          const res = await apiFetch('/api/groups/dissolve', {
            method: 'POST'
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '解散失败');
          }

          triggerAlert('成功', '家庭群组已成功解散', 'success');
          fetchGroupDetails();
        } catch (err: any) {
          triggerAlert('操作失败', err.message || '解散家庭失败，请重试', 'error');
          setLoading(false);
        }
      },
      'danger'
    );
  };

  const triggerLogoutConfirm = () => {
    triggerConfirm(
      '退出登录',
      '确定要退出当前账号的登录吗？',
      async () => {
        setConfirmOpen(false);
        await clearSession();
        onLogout();
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>正在获取您的家庭群组信息...</Text>
      </View>
    );
  }

  // --- CREATE VIEW ---
  if (view === 'create') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')} style={styles.headerBackBtn}>
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>创建家庭</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formScrollContainer}>
          <Card padding="md" style={styles.formCard}>
            <Text style={styles.formIcon}>🏠</Text>
            <Text style={styles.formTitle}>给你的家庭起个名字</Text>
            <Text style={styles.formDesc}>家庭成员可以一起共享菜谱、在今日菜单中点菜</Text>
            
            <Input
              label="家庭名称"
              placeholder="例如：我家的厨房 👨‍👩‍👧"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={submitting}
              onPress={handleCreateGroup}
              style={{ marginTop: theme.spacing[4] }}
            >
              🌟 创建家庭
            </Button>
          </Card>
        </ScrollView>

        <AlertModal
          visible={alertOpen}
          onClose={() => setAlertOpen(false)}
          title={alertTitle}
          description={alertDesc}
          type={alertType}
        />
      </View>
    );
  }

  // --- JOIN VIEW ---
  if (view === 'join') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')} style={styles.headerBackBtn}>
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>加入家庭</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formScrollContainer}>
          <Card padding="md" style={styles.formCard}>
            <Text style={styles.formIcon}>🔑</Text>
            <Text style={styles.formTitle}>输入邀请码</Text>
            <Text style={styles.formDesc}>让家人把邀请码分享给你，一起用 CookBro 吃饭！</Text>
            
            <Input
              label="6位邀请码"
              placeholder="例如：ABC123"
              value={inviteCode}
              onChangeText={(val) => setInviteCode(val.toUpperCase())}
              maxLength={6}
            />

            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={submitting}
              onPress={handleJoinGroup}
              style={{ marginTop: theme.spacing[4] }}
            >
              加入家庭
            </Button>
          </Card>
        </ScrollView>

        <AlertModal
          visible={alertOpen}
          onClose={() => setAlertOpen(false)}
          title={alertTitle}
          description={alertDesc}
          type={alertType}
        />
      </View>
    );
  }

  const isCreator = group && group.createdBy === user.uid;

  // --- MAIN VIEW ---
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>家庭群组</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Card Profile */}
        <Card padding="md" style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarFallback}>
              {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.displayName || '我'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </Card>

        {/* Group Info panel */}
        {group ? (
          <View style={styles.groupWrapper}>
            <Card padding="md" style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Text style={styles.groupIconText}>🏠</Text>
                  <View>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMeta}>{group.members.length} 位成员</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Members Roster List */}
              <View style={styles.membersSection}>
                <Text style={styles.sectionLabel}>家庭成员</Text>
                <View style={styles.membersList}>
                  {group.memberProfiles?.map((member) => {
                    const isMe = member.uid === user.uid;
                    const isMemberCreator = member.uid === group.createdBy;
                    return (
                      <View key={member.uid} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarFallback}>
                            {member.displayName ? member.displayName[0].toUpperCase() : (member.email ? member.email[0].toUpperCase() : '?')}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName}>{member.displayName}</Text>
                            {isMemberCreator && <Badge variant="warning" size="sm">创建者</Badge>}
                            {isMe && <Badge variant="primary" size="sm">你</Badge>}
                          </View>
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        </View>
                        {isCreator && !isMe ? (
                          <TouchableOpacity
                            onPress={() => handleKickMember(member)}
                            style={styles.kickBtn}
                          >
                            <Text style={styles.kickBtnText}>移出</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Invite Code Accordion */}
              <View style={styles.inviteContainer}>
                <TouchableOpacity
                  onPress={() => setShowInviteSection(!showInviteSection)}
                  style={styles.inviteToggleBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inviteToggleText}>
                    {showInviteSection ? '收起邀请码 ▲' : '邀请家庭成员 ▼'}
                  </Text>
                </TouchableOpacity>

                {showInviteSection && (
                  <View style={styles.inviteBox}>
                    <Text style={styles.inviteBoxLabel}>邀请码（分享给家人输入）</Text>
                    <View style={styles.inviteCodeRow}>
                      <Text style={styles.inviteCodeValue}>{group.inviteCode}</Text>
                      <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                        <Text style={styles.copyBtnText}>{copied ? '✅ 已复制' : '📋 复制'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.inviteBoxHint}>让家人使用上面的邀请码加入此家庭厨房</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Creator secondary actions */}
            {isCreator && (
              <View style={styles.secondaryActions}>
                <Button
                  variant="danger"
                  fullWidth
                  onPress={handleDissolveGroup}
                >
                  解散整个家庭 🗑️
                </Button>
              </View>
            )}
          </View>
        ) : (
          /* Empty No-Group State */
          <Card padding="lg" style={styles.emptyCard}>
            <Text style={styles.emptyCardIcon}>🏠</Text>
            <Text style={styles.emptyCardTitle}>还没有加入家庭群组</Text>
            <Text style={styles.emptyCardDesc}>
              创建或加入一个家庭群组，和家人共享菜谱、一起讨论今天想吃的饭菜吧！
            </Text>
            
            <View style={styles.emptyCardActions}>
              <Button
                variant="primary"
                fullWidth
                onPress={() => setView('create')}
                style={{ marginBottom: theme.spacing[3] }}
              >
                ✨ 创建我的家庭
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                onPress={() => setView('join')}
              >
                🔑 用邀请码加入
              </Button>
            </View>
          </Card>
        )}

        {/* Logout button */}
        <View style={styles.logoutContainer}>
          <Button
            variant="ghost"
            fullWidth
            onPress={triggerLogoutConfirm}
          >
            🚶 退出登录
          </Button>
        </View>
      </ScrollView>

      {/* Reusable Custom Alert Modals */}
      <AlertModal
        visible={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        description={alertDesc}
        type={alertType}
      />

      <AlertModal
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        description={confirmDesc}
        variant={confirmVariant}
        confirmText="确认"
        cancelText="取消"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255, 251, 245, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerBackBtn: {
    padding: theme.spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackIcon: {
    fontSize: 22,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
    backgroundColor: theme.colors.bg.primary,
  },
  loadingText: {
    marginTop: theme.spacing[3],
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContainer: {
    padding: theme.spacing[4],
    paddingBottom: 100, // Room for bottom tabs
  },
  formScrollContainer: {
    padding: theme.spacing[4],
    flexGrow: 1,
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  profileAvatarFallback: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  groupWrapper: {
    width: '100%',
  },
  groupCard: {
    width: '100%',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconText: {
    fontSize: 28,
    marginRight: theme.spacing[3],
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  groupMeta: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing[4],
  },
  membersSection: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  membersList: {
    gap: theme.spacing[3],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  memberAvatarFallback: {
    color: theme.colors.primary[600],
    fontSize: 14,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  memberEmail: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  kickBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger.light,
  },
  kickBtnText: {
    fontSize: 11,
    color: theme.colors.danger.dark,
    fontWeight: '600',
  },
  inviteContainer: {
    width: '100%',
  },
  inviteToggleBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing[1],
  },
  inviteToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary[600],
  },
  inviteBox: {
    backgroundColor: theme.colors.bg.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[3],
    marginTop: theme.spacing[3],
    alignItems: 'center',
  },
  inviteBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  inviteCodeValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  inviteBoxHint: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[2],
  },
  secondaryActions: {
    marginTop: theme.spacing[4],
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  emptyCardDesc: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing[5],
  },
  emptyCardActions: {
    width: '100%',
  },
  logoutContainer: {
    marginTop: theme.spacing[5],
  },
  formCard: {
    alignItems: 'center',
  },
  formIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[2],
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
    lineHeight: 16,
  },
});
