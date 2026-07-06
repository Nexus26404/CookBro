import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform
} from 'react-native';
import { theme } from '../../theme';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void; // Optional: If provided, renders as a Confirm/Dialog modal
  title: string;
  description: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export function AlertModal({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = '确定',
  cancelText = '取消',
  variant = 'primary',
}: AlertModalProps) {
  const isConfirmDialog = !!onConfirm;

  const getTypeIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '💡';
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'warning': return '#eab308';
      case 'error': return '#ef4444';
      default: return theme.colors.primary[500];
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Type Indicator Bar */}
              <View style={[styles.typeBar, { backgroundColor: getHeaderColor() }]} />

              <View style={styles.contentContainer}>
                {/* Emoji Icon Badge */}
                <View style={[styles.iconBadge, { backgroundColor: getHeaderColor() + '15' }]}>
                  <Text style={styles.iconText}>{getTypeIcon()}</Text>
                </View>

                {/* Title and details */}
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>

                {/* Actions row */}
                <View style={[styles.actionsRow, isConfirmDialog ? styles.actionsRowDouble : null]}>
                  {isConfirmDialog ? (
                    <>
                      <Button
                        variant="secondary"
                        size="md"
                        onPress={onClose}
                        style={styles.actionBtn}
                      >
                        {cancelText}
                      </Button>
                      
                      <Button
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        size="md"
                        onPress={() => {
                          if (onConfirm) {
                            onConfirm();
                          }
                        }}
                        style={styles.actionBtn}
                      >
                        {confirmText}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onPress={onClose}
                    >
                      {confirmText}
                    </Button>
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.45)', // Sleek dark translucent overlay
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius['2xl'],
    width: Math.min(width - theme.spacing[6] * 2, 340),
    overflow: 'hidden',
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#1c1917',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      }
    })
  },
  typeBar: {
    height: 5,
    width: '100%',
  },
  contentContainer: {
    padding: theme.spacing[5],
    alignItems: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  actionsRow: {
    width: '100%',
  },
  actionsRowDouble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  actionBtn: {
    flex: 1,
  },
});
