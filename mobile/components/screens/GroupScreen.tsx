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
  Platform,
  Image
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { Card, Badge, Button, Input, AlertModal } from '../ui';
import { apiFetch, clearSession, UserSession } from '../../lib/api';
import { CookGroup, UserProfile, Recipe, Order } from '../../lib/types';

const { width } = Dimensions.get('window');

interface GroupScreenProps {
  user: UserSession;
  onLogout: () => void;
  group: CookGroup | null;
  loading: boolean;
  onRefreshGroup: () => void;
  recipes: Recipe[];
  onSelectRecipe?: (id: string) => void;
}

export function GroupScreen({ user, onLogout, group, loading, onRefreshGroup, recipes, onSelectRecipe }: GroupScreenProps) {
  const [view, setView] = useState<'main' | 'create' | 'join' | 'history' | 'order-detail'>('main');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // History view states
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  
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

  // Lifted group details fetched by parent

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
  const fetchHistoryOrders = () => {
    if (!group?.id) return;
    setHistoryLoading(true);
    apiFetch(`/api/orders?groupId=${group.id}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setHistoryOrders(data);
        } else {
          setHistoryOrders([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load history orders', err);
        setHistoryOrders([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  useEffect(() => {
    if (view === 'history') {
      fetchHistoryOrders();
    }
  }, [view]);

  // Load todo check states when selectedOrderId changes
  useEffect(() => {
    if (view !== 'order-detail' || !selectedOrderId) return;
    AsyncStorage.getItem(`cookbro_shopping_${selectedOrderId}`)
      .then((saved) => {
        if (saved) {
          setCheckedIngredients(JSON.parse(saved));
        } else {
          setCheckedIngredients({});
        }
      })
      .catch((err) => console.warn('Failed to load todo state:', err));
  }, [selectedOrderId, view]);

  const handleToggleCheck = async (ingName: string) => {
    if (!selectedOrderId) return;
    const updated = { ...checkedIngredients, [ingName]: !checkedIngredients[ingName] };
    setCheckedIngredients(updated);
    try {
      await AsyncStorage.setItem(`cookbro_shopping_${selectedOrderId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save todo state:', err);
    }
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
      onRefreshGroup();
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
      onRefreshGroup();
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
        setActionLoading(true);
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
          onRefreshGroup();
        } catch (err: any) {
          triggerAlert('操作失败', err.message || '移出成员失败，请重试', 'error');
        } finally {
          setActionLoading(false);
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
        setActionLoading(true);
        try {
          const res = await apiFetch('/api/groups/dissolve', {
            method: 'POST'
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '解散失败');
          }

          triggerAlert('成功', '家庭群组已成功解散', 'success');
          onRefreshGroup();
        } catch (err: any) {
          triggerAlert('操作失败', err.message || '解散家庭失败，请重试', 'error');
        } finally {
          setActionLoading(false);
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

  if (loading || actionLoading) {
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

  // --- HISTORY VIEW ---
  if (view === 'history') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')} style={styles.headerBackBtn}>
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单历史</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {!group ? (
            <Card padding="lg" style={styles.emptyCard}>
              <Text style={styles.emptyCardIcon}>🏠</Text>
              <Text style={styles.emptyCardTitle}>您还没有加入家庭</Text>
              <Text style={styles.emptyCardDesc}>加入或创建一个家庭以开始记录订单</Text>
              <Button variant="primary" fullWidth onPress={() => setView('main')}>
                返回家庭页面
              </Button>
            </Card>
          ) : historyLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text style={styles.loadingText}>正在加载历史订单...</Text>
            </View>
          ) : historyOrders.length === 0 ? (
            <Card padding="lg" style={styles.emptyCard}>
              <Text style={styles.emptyCardIcon}>📝</Text>
              <Text style={styles.emptyCardTitle}>暂无订单记录</Text>
              <Text style={styles.emptyCardDesc}>今天点一些菜，订单就会出现在这里啦！</Text>
              <Button variant="primary" fullWidth onPress={() => setView('main')}>
                返回家庭页面
              </Button>
            </Card>
          ) : (
            <View style={styles.historyList}>
              {historyOrders.map((ord) => {
                const orderDate = new Date(ord.date);
                const formattedDate = `${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;
                
                const recipeMap = recipes.reduce<Record<string, Recipe>>((acc, r) => {
                  acc[r.id] = r;
                  return acc;
                }, {});

                return (
                  <TouchableOpacity
                    key={ord.id}
                    onPress={() => {
                      setSelectedOrderId(ord.id);
                      setView('order-detail');
                    }}
                    activeOpacity={0.7}
                  >
                    <Card style={styles.historyCard} padding="md">
                      <View style={styles.historyCardHeader}>
                        <Text style={styles.historyCardDate}>{formattedDate}</Text>
                        <Badge variant="success">已确认</Badge>
                      </View>
                      
                      <View style={styles.historyCardBody}>
                        {ord.meals.map((meal) => {
                          const mealLabels: Record<string, { label: string; icon: string }> = {
                            breakfast: { label: '早餐', icon: '🍳' },
                            lunch: { label: '午餐', icon: '🍜' },
                            dinner: { label: '晚餐', icon: '🍲' },
                          };
                          const mInfo = mealLabels[meal.type] || { label: meal.type, icon: '🍽️' };
                          return (
                            <View key={meal.type} style={styles.historyMealRow}>
                              <View style={styles.historyMealType}>
                                <Text style={styles.historyMealIcon}>{mInfo.icon}</Text>
                                <Text style={styles.historyMealLabel}>{mInfo.label}</Text>
                              </View>
                              <View style={styles.historyRecipesList}>
                                {meal.recipes.map((rid) => {
                                  const r = recipeMap[rid];
                                  return (
                                    <View key={rid} style={styles.historyRecipeBadge}>
                                      <Text style={styles.historyRecipeText}>
                                        {r?.icon || '🍳'} {r?.name || '已删除菜品'}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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

  // --- ORDER DETAIL VIEW ---
  if (view === 'order-detail') {
    const selectedOrder = historyOrders.find(o => o.id === selectedOrderId);
    const orderDate = selectedOrder ? new Date(selectedOrder.date) : new Date();
    const formattedDate = `${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;
    const fullDateStr = `${orderDate.getFullYear()}年${orderDate.getMonth() + 1}月${orderDate.getDate()}日`;

    const recipeMap = recipes.reduce<Record<string, Recipe>>((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {});

    // Aggregate ingredients
    const ingredientMap: Record<string, string[]> = {};
    if (selectedOrder) {
      selectedOrder.meals.forEach((meal) => {
        meal.recipes.forEach((recipeId) => {
          const r = recipeMap[recipeId];
          if (r && r.ingredients) {
            r.ingredients.forEach((ing) => {
              const name = ing.name.trim();
              if (name) {
                if (!ingredientMap[name]) {
                  ingredientMap[name] = [];
                }
                if (ing.amount) {
                  ingredientMap[name].push(ing.amount);
                }
              }
            });
          }
        });
      });
    }

    const aggregatedIngredients = Object.keys(ingredientMap).map((name) => ({
      name,
      amounts: ingredientMap[name],
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('history')} style={styles.headerBackBtn}>
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{formattedDate}订单详情</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoSection}>
            <Text style={styles.dateTitle}>{fullDateStr}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>订单状态:</Text>
              <Badge variant="success">已确认</Badge>
            </View>
          </View>

          {/* Today Recipes */}
          {selectedOrder && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>今日菜品</Text>
              <View style={styles.mealsContainer}>
                {selectedOrder.meals.map((meal) => {
                  const mealLabels: Record<string, { label: string; icon: string }> = {
                    breakfast: { label: '早餐', icon: '🍳' },
                    lunch: { label: '午餐', icon: '🍜' },
                    dinner: { label: '晚餐', icon: '🍲' },
                  };
                  const mInfo = mealLabels[meal.type] || { label: meal.type, icon: '🍽️' };
                  return (
                    <View key={meal.type} style={styles.mealBlock}>
                      <Text style={styles.mealHeader}>
                        <Text style={styles.mealIcon}>{mInfo.icon} </Text>
                        {mInfo.label}
                      </Text>
                      <View style={styles.recipesGrid}>
                        {meal.recipes.map((rid) => {
                          const r = recipeMap[rid];
                          return r ? (
                            <Card 
                              key={rid}
                              padding="sm" 
                              style={styles.recipeCard}
                              onPress={onSelectRecipe ? () => onSelectRecipe(rid) : undefined}
                            >
                              <Text style={styles.recipeIcon}>{r.icon || '🍳'}</Text>
                              <Text style={styles.recipeName} numberOfLines={1}>{r.name}</Text>
                            </Card>
                          ) : (
                            <Card key={rid} padding="sm" style={styles.recipeCardDisabled}>
                              <Text style={styles.recipeIcon}>🍳</Text>
                              <Text style={styles.recipeNameDisabled} numberOfLines={1}>已删除的菜品</Text>
                            </Card>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Todo List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>采购清单 (TodoList)</Text>
            {aggregatedIngredients.length === 0 ? (
              <Card padding="md" style={styles.emptyIngredientsCard}>
                <Text style={styles.emptyText}>无可采购食材（请检查菜品是否有配料）</Text>
              </Card>
            ) : (
              <Card padding="none" style={styles.todoCard}>
                <View style={styles.todoList}>
                  {aggregatedIngredients.map((ing) => {
                    const isChecked = !!checkedIngredients[ing.name];
                    const amountsText = ing.amounts.length > 0 ? ` (${ing.amounts.join(' + ')})` : '';
                    return (
                      <TouchableOpacity
                        key={ing.name}
                        style={[styles.todoItem, isChecked ? styles.todoItemChecked : null]}
                        onPress={() => handleToggleCheck(ing.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, isChecked ? styles.checkboxChecked : null]}>
                          {isChecked && <Text style={styles.checkboxText}>✓</Text>}
                        </View>
                        <Text style={[styles.todoText, isChecked ? styles.todoTextChecked : null]}>
                          {ing.name}
                          <Text style={styles.todoAmount}>{amountsText}</Text>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}
          </View>
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

              {/* Order History entrance */}
              <TouchableOpacity
                style={styles.historyEntranceBtn}
                onPress={() => setView('history')}
                activeOpacity={0.7}
              >
                <View style={styles.historyEntranceLeft}>
                  <Text style={styles.historyEntranceIcon}>📜</Text>
                  <Text style={styles.historyEntranceLabel}>查看今日及历史点菜记录</Text>
                </View>
                <Text style={styles.historyEntranceArrow}>订单历史 →</Text>
              </TouchableOpacity>

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
  historyEntranceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    backgroundColor: theme.colors.primary[50] + '40',
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary[100],
    marginBottom: theme.spacing[3],
  },
  historyEntranceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyEntranceIcon: {
    fontSize: 20,
    marginRight: theme.spacing[2],
  },
  historyEntranceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  historyEntranceArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary[500],
  },
  historyList: {
    paddingBottom: theme.spacing[8],
  },
  historyCard: {
    marginBottom: theme.spacing[3],
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingBottom: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  historyCardDate: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  historyCardBody: {
    gap: theme.spacing[3],
  },
  historyMealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyMealType: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 65,
    marginTop: 2,
  },
  historyMealIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  historyMealLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  historyRecipesList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyRecipeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
  },
  historyRecipeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing[4],
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing[5],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  mealsContainer: {
    gap: theme.spacing[4],
  },
  mealBlock: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  mealIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  recipeCard: {
    width: (width - theme.spacing[4] * 2 - theme.spacing[4] * 2 - theme.spacing[3]) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[2],
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  recipeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  recipeName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  recipeCardDisabled: {
    width: (width - theme.spacing[4] * 2 - theme.spacing[4] * 2 - theme.spacing[3]) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[2],
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    opacity: 0.6,
  },
  recipeNameDisabled: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  emptyIngredientsCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  todoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.radius.lg,
  },
  todoList: {
    paddingVertical: theme.spacing[2],
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  todoItemChecked: {
    backgroundColor: theme.colors.neutral[50],
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success.default,
    borderColor: theme.colors.success.default,
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  todoText: {
    fontSize: 13,
    color: theme.colors.text.primary,
    flex: 1,
  },
  todoTextChecked: {
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  todoAmount: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});
