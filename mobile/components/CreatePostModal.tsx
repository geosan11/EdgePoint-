import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Crown, Send, X, Zap } from 'lucide-react-native';
import { useCommunityStore } from '../stores/useCommunityStore';
import { useTheme } from '../stores/useThemeStore';
import { Button, Card, Text } from './ui';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreatePostModal({ visible, onClose }: CreatePostModalProps) {
  const { tokens } = useTheme();
  const { createPost } = useCommunityStore();

  const [postType, setPostType] = useState<'prediction' | 'news'>('prediction');
  const [league, setLeague] = useState<'NBA' | 'Premier League'>('NBA');
  const [isVip, setIsVip] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fixture, setFixture] = useState('');
  const [prop, setProp] = useState('');
  const [selection, setSelection] = useState('Over');
  const [line, setLine] = useState('');
  const [odds, setOdds] = useState('1.90');
  const [units, setUnits] = useState('1.5');
  const [bookmaker, setBookmaker] = useState('DraftKings');
  const [newsCategory, setNewsCategory] = useState<'injury' | 'line_move' | 'tactical'>('injury');

  const handlePublish = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title or headline for your post.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Required Field', 'Please enter your analytical reasoning or news content.');
      return;
    }

    if (postType === 'prediction') {
      const parsedOdds = parseFloat(odds);
      const parsedUnits = parseFloat(units);
      const parsedLine = line.trim() ? parseFloat(line) : undefined;

      if (isNaN(parsedOdds) || parsedOdds <= 1.0) {
        Alert.alert('Invalid Odds', 'Please enter valid decimal odds (e.g. 1.90).');
        return;
      }

      createPost({
        type: 'prediction',
        league,
        title,
        content,
        isVip,
        predictionData: {
          fixture: fixture.trim() || (league === 'NBA' ? 'NBA Slate Matchup' : 'Premier League Matchup'),
          prop: prop.trim() || 'Spread / Prop Line',
          selection,
          line: parsedLine,
          odds: parsedOdds,
          units: isNaN(parsedUnits) ? 1.0 : parsedUnits,
          bookmaker,
        },
      });
    } else {
      createPost({
        type: 'news',
        league,
        title,
        content,
        isVip: false,
        newsCategory,
      });
    }

    Alert.alert('Published! 🚀', 'Your post is now live in the Sharp Community Feed.');
    // Reset Form
    setTitle('');
    setContent('');
    setFixture('');
    setProp('');
    setLine('');
    setIsVip(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: tokens.colors.overlay }]}>
        <View style={[styles.modalSheet, { backgroundColor: tokens.colors.background, borderColor: tokens.colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: tokens.colors.border }]}>
            <View>
              <Text variant="headlineSm">Post to Community Feed</Text>
              <Text variant="dataSm" tone="secondary">
                Share verified quantitative edges or breaking news
              </Text>
            </View>
            <TouchableOpacity style={[styles.closeBtn, { borderColor: tokens.colors.border }]} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={tokens.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Post Type Selector */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.typeTab,
                  postType === 'prediction' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                  { borderColor: tokens.colors.border },
                ]}
                onPress={() => setPostType('prediction')}
                activeOpacity={0.7}
              >
                <Text variant="title" tone={postType === 'prediction' ? 'brand' : 'secondary'}>
                  🎯 Prediction Pick
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  postType === 'news' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                  { borderColor: tokens.colors.border },
                ]}
                onPress={() => setPostType('news')}
                activeOpacity={0.7}
              >
                <Text variant="title" tone={postType === 'news' ? 'brand' : 'secondary'}>
                  📰 Breaking Intel
                </Text>
              </TouchableOpacity>
            </View>

            {/* League Selector */}
            <View style={styles.leagueRow}>
              <Text variant="label" tone="secondary">
                League:
              </Text>
              <View style={styles.leagueButtons}>
                <TouchableOpacity
                  style={[
                    styles.leaguePill,
                    league === 'NBA' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                    { borderColor: tokens.colors.border },
                  ]}
                  onPress={() => setLeague('NBA')}
                  activeOpacity={0.7}
                >
                  <Text variant="badge" tone={league === 'NBA' ? 'brand' : 'secondary'}>
                    NBA 🏀
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leaguePill,
                    league === 'Premier League' && { backgroundColor: tokens.colors.primarySoft, borderColor: tokens.colors.primary },
                    { borderColor: tokens.colors.border },
                  ]}
                  onPress={() => setLeague('Premier League')}
                  activeOpacity={0.7}
                >
                  <Text variant="badge" tone={league === 'Premier League' ? 'brand' : 'secondary'}>
                    Premier League ⚽
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Headline / Title */}
            <View style={styles.inputGroup}>
              <Text variant="label" tone="secondary">
                {postType === 'prediction' ? 'PICK TITLE / SUMMARY' : 'HEADLINE'}
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                value={title}
                onChangeText={setTitle}
                placeholder={postType === 'prediction' ? 'e.g. Stephen Curry Over 26.5 PTS' : 'e.g. Draymond Green Upgraded to Active'}
                placeholderTextColor={tokens.colors.textTertiary}
              />
            </View>

            {/* Prediction-Specific Fields */}
            {postType === 'prediction' ? (
              <>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1.5 }]}>
                    <Text variant="label" tone="secondary">
                      MATCHUP
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={fixture}
                      onChangeText={setFixture}
                      placeholder="Warriors @ Lakers"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text variant="label" tone="secondary">
                      MARKET / PROP
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={prop}
                      onChangeText={setProp}
                      placeholder="Points / Total"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text variant="label" tone="secondary">
                      SELECTION
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={selection}
                      onChangeText={setSelection}
                      placeholder="Over / Yes"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text variant="label" tone="secondary">
                      LINE
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={line}
                      onChangeText={setLine}
                      keyboardType="numeric"
                      placeholder="26.5"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text variant="label" tone="secondary">
                      ODDS
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={odds}
                      onChangeText={setOdds}
                      keyboardType="numeric"
                      placeholder="1.95"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text variant="label" tone="secondary">
                      UNITS
                    </Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary }]}
                      value={units}
                      onChangeText={setUnits}
                      keyboardType="numeric"
                      placeholder="1.5"
                      placeholderTextColor={tokens.colors.textTertiary}
                    />
                  </View>
                </View>

                {/* VIP Prediction Gating Switch */}
                <Card style={styles.vipCard}>
                  <View style={styles.switchRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Crown size={14} color={tokens.colors.primary} />
                        <Text variant="title">VIP Exclusive Pick</Text>
                      </View>
                      <Text variant="bodySm" tone="secondary">
                        Lock full selection and write-up for paying subscribers only.
                      </Text>
                    </View>
                    <Switch
                      value={isVip}
                      onValueChange={setIsVip}
                      trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.primary }}
                      thumbColor={tokens.colors.textPrimary}
                    />
                  </View>
                </Card>
              </>
            ) : null}

            {/* Analysis / Content Text Input */}
            <View style={styles.inputGroup}>
              <Text variant="label" tone="secondary">
                {postType === 'prediction' ? 'MATHEMATICAL REASONING / WRITEUP' : 'INTEL & TACTICAL ANALYSIS'}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: tokens.colors.surfaceInset, borderColor: tokens.colors.border, color: tokens.colors.textPrimary },
                ]}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                placeholder="Break down the pace, xG, defensive ranking, or line movement reasons..."
                placeholderTextColor={tokens.colors.textTertiary}
              />
            </View>
          </ScrollView>

          {/* Footer Submit Button */}
          <View style={[styles.footer, { borderTopColor: tokens.colors.border }]}>
            <Button
              label={isVip ? 'Publish VIP Prediction 👑' : 'Publish to Feed 🚀'}
              variant="primary"
              icon={<Send size={15} color={tokens.colors.onPrimary} />}
              onPress={handlePublish}
              fullWidth
              style={styles.publishBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    height: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  leagueButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  leaguePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  inputGroup: {
    gap: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  vipCard: {
    padding: 12,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  publishBtn: {
    minHeight: 46,
  },
});
