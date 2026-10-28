import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityPost, TipsterProfile } from '../lib/types';
import { MOCK_COMMUNITY_POSTS, MOCK_TIPSTERS } from '../lib/supabase';

interface CommunityState {
  posts: CommunityPost[];
  tipsters: TipsterProfile[];
  subscribedTipsterIds: string[];
  userReactions: Record<string, 'tail' | 'fade'>;

  // Actions
  subscribeToTipster: (tipsterId: string) => void;
  unsubscribeFromTipster: (tipsterId: string) => void;
  isSubscribed: (tipsterId: string) => boolean;
  toggleReaction: (postId: string, reaction: 'tail' | 'fade') => void;
  createPost: (post: {
    type: 'prediction' | 'news';
    league: 'NBA' | 'Premier League';
    title: string;
    content: string;
    isVip: boolean;
    predictionData?: {
      fixture: string;
      prop: string;
      selection: string;
      line?: number;
      odds: number;
      units: number;
      bookmaker: string;
      modelProb?: number;
    };
    newsCategory?: 'injury' | 'line_move' | 'tactical';
  }) => void;
  resetToMock: () => void;
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: MOCK_COMMUNITY_POSTS,
      tipsters: MOCK_TIPSTERS,
      subscribedTipsterIds: [],
      userReactions: {},

      subscribeToTipster: (tipsterId: string) => {
        const { subscribedTipsterIds, tipsters } = get();
        if (subscribedTipsterIds.includes(tipsterId)) return;

        set({
          subscribedTipsterIds: [...subscribedTipsterIds, tipsterId],
          tipsters: tipsters.map((t) =>
            t.id === tipsterId ? { ...t, subscribersCount: t.subscribersCount + 1 } : t
          ),
        });
      },

      unsubscribeFromTipster: (tipsterId: string) => {
        const { subscribedTipsterIds, tipsters } = get();
        if (!subscribedTipsterIds.includes(tipsterId)) return;

        set({
          subscribedTipsterIds: subscribedTipsterIds.filter((id) => id !== tipsterId),
          tipsters: tipsters.map((t) =>
            t.id === tipsterId ? { ...t, subscribersCount: Math.max(0, t.subscribersCount - 1) } : t
          ),
        });
      },

      isSubscribed: (tipsterId: string) => {
        return get().subscribedTipsterIds.includes(tipsterId);
      },

      toggleReaction: (postId: string, reaction: 'tail' | 'fade') => {
        const { posts, userReactions } = get();
        const currentReaction = userReactions[postId];

        let newReaction: 'tail' | 'fade' | undefined = reaction;
        if (currentReaction === reaction) {
          newReaction = undefined; // Undo
        }

        const updatedReactions = { ...userReactions };
        if (newReaction) {
          updatedReactions[postId] = newReaction;
        } else {
          delete updatedReactions[postId];
        }

        const updatedPosts = posts.map((p) => {
          if (p.id !== postId) return p;

          let tail = p.tailCount;
          let fade = p.fadeCount;

          if (currentReaction === 'tail') tail = Math.max(0, tail - 1);
          if (currentReaction === 'fade') fade = Math.max(0, fade - 1);

          if (newReaction === 'tail') tail += 1;
          if (newReaction === 'fade') fade += 1;

          return {
            ...p,
            tailCount: tail,
            fadeCount: fade,
            userReaction: newReaction,
          };
        });

        set({ posts: updatedPosts, userReactions: updatedReactions });
      },

      createPost: (newPostData) => {
        const newPost: CommunityPost = {
          id: `post-user-${Date.now()}`,
          authorId: 'user-me',
          authorName: 'Quantitative Bettor',
          authorUsername: 'You',
          authorBadge: 'pro_capper',
          authorWinRate: 65.5,
          authorRoi: 19.8,
          createdAt: 'Just now',
          type: newPostData.type,
          league: newPostData.league,
          title: newPostData.title,
          content: newPostData.content,
          isVip: newPostData.isVip,
          predictionData: newPostData.predictionData,
          newsCategory: newPostData.newsCategory,
          tailCount: 1, // User's own upvote
          fadeCount: 0,
          userReaction: 'tail',
          commentsCount: 0,
        };

        set({
          posts: [newPost, ...get().posts],
        });
      },

      resetToMock: () => {
        set({
          posts: MOCK_COMMUNITY_POSTS,
          tipsters: MOCK_TIPSTERS,
          subscribedTipsterIds: [],
          userReactions: {},
        });
      },
    }),
    {
      name: 'edgepoint-community-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
