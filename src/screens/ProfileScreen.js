import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Wrapper from '../components/Wrapper';
import { Colors } from '../constants/Colors';
import api from '../helpers/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../helpers/NavigationUtil';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  UserCircleIcon,
  FaceSmileIcon,
  StarIcon,
  FireIcon,
  HeartIcon,
  SparklesIcon,
  UserIcon,
} from 'react-native-heroicons/solid';

const AVATARS = {
  UserCircleIcon,
  FaceSmileIcon,
  StarIcon,
  FireIcon,
  HeartIcon,
  SparklesIcon,
  UserIcon,
};

const AVATAR_COLORS = {
  UserCircleIcon: '#28aeff',
  FaceSmileIcon: '#ffde17',
  StarIcon: '#f97316',
  FireIcon: '#ef4444',
  HeartIcon: '#ec4899',
  SparklesIcon: '#a855f7',
  UserIcon: '#00a049',
};

// ─── Bottom Nav Item ─────────────────────────────────────────────────────────
const BottomNavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={ styles.navItem } onPress={ onPress } activeOpacity={ 0.7 }>
    { active && <View style={ styles.navActiveIndicator } /> }
    <Text style={ [styles.navIcon, active && styles.navIconActive] }>{ icon }</Text>
    <Text style={ [styles.navLabel, active && styles.navLabelActive] }>{ label }</Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('UserCircleIcon');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.success ? res.data.user : null;
    },
    enabled: isFocused,
  });

  useEffect(() => {
    if (user && !isEditing) {
      setEditUsername(user.username);
      setEditAvatar(user.avatar || 'UserCircleIcon');
    }
  }, [user, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put('/auth/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditing(false);
      Toast.show({ type: 'success', text1: '✅ Profile Updated', text2: 'Changes saved!' });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ username: editUsername, avatar: editAvatar });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigate('LoginScreen');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to logout' });
    }
  };

  const currentAvatar = isEditing ? editAvatar : user?.avatar || 'UserCircleIcon';
  const SelectedIcon = AVATARS[currentAvatar] || UserCircleIcon;
  const avatarColor = AVATAR_COLORS[currentAvatar] || Colors.yellow;

  return (
    <Wrapper style={ styles.container }>
      <ScrollView
        style={ styles.scroll }
        contentContainerStyle={ styles.scrollContent }
        showsVerticalScrollIndicator={ false }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */ }
        <Text style={ styles.headerTitle }>MY PROFILE</Text>

        {/* ── Profile Card ── */ }
        <View style={ styles.card }>
          {/* Avatar Ring */ }
          <View style={ [styles.avatarRing, { borderColor: avatarColor }] }>
            <View style={ styles.avatarBg }>
              { isLoading ? (
                <ActivityIndicator size="large" color={ Colors.yellow } />
              ) : (
                <SelectedIcon size={ 68 } color={ avatarColor } />
              ) }
            </View>
          </View>

          { isLoading ? (
            <Text style={ styles.loadingText }>Loading...</Text>
          ) : user ? (
            <>
              <Text style={ styles.username }>{ user.username }</Text>
              <Text style={ styles.email }>{ user.email }</Text>

              {/* Stats */ }
              <View style={ styles.statsRow }>
                <View style={ styles.statItem }>
                  <MaterialIcons name="monetization-on" size={ 22 } color={ Colors.yellow } />
                  <Text style={ styles.statValue }>{ user.coins ?? 0 }</Text>
                  <Text style={ styles.statLabel }>COINS</Text>
                </View>
                <View style={ styles.statDivider } />
                <View style={ styles.statItem }>
                  <MaterialIcons name="emoji-events" size={ 22 } color="#f97316" />
                  <Text style={ styles.statValue }>{ user.wins ?? 0 }</Text>
                  <Text style={ styles.statLabel }>WINS</Text>
                </View>
                <View style={ styles.statDivider } />
                <View style={ styles.statItem }>
                  <MaterialIcons name="sports-esports" size={ 22 } color={ Colors.blue } />
                  <Text style={ styles.statValue }>{ user.gamesPlayed ?? 0 }</Text>
                  <Text style={ styles.statLabel }>GAMES</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={ styles.errorText }>Failed to load profile</Text>
          ) }
        </View>

        {/* ── Edit Card ── */ }
        { isEditing && (
          <View style={ styles.editCard }>
            <Text style={ styles.sectionTitle }>Choose Avatar</Text>
            <View style={ styles.avatarGrid }>
              { Object.keys(AVATARS).map((key) => {
                const IconComp = AVATARS[key];
                const color = AVATAR_COLORS[key];
                const selected = editAvatar === key;
                return (
                  <Pressable
                    key={ key }
                    onPress={ () => setEditAvatar(key) }
                    style={ [
                      styles.avatarOption,
                      selected && { borderColor: color },
                    ] }
                  >
                    <IconComp
                      size={ 28 }
                      color={ selected ? color : 'rgba(255,255,255,0.5)' }
                    />
                  </Pressable>
                );
              }) }
            </View>

            <Text style={ styles.sectionTitle }>Username</Text>
            <TextInput
              style={ styles.input }
              value={ editUsername }
              onChangeText={ setEditUsername }
              placeholder="Enter username"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
            />
          </View>
        ) }

        {/* ── Buttons ── */ }
        <View style={ styles.actions }>
          { isEditing ? (
            <>
              <TouchableOpacity
                onPress={ handleSave }
                activeOpacity={ 0.8 }
                disabled={ updateMutation.isPending }
                style={ styles.btnWrapper }
              >
                <LinearGradient
                  colors={ ['#4c669f', '#3b5998', '#192f6a'] }
                  style={ [styles.btnInner, styles.btnBorderGold] }
                >
                  { updateMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialIcons name="save" size={ 18 } color="#ffde17" />
                  ) }
                  <Text style={ styles.btnText }>
                    { updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES' }
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ () => setIsEditing(false) }
                activeOpacity={ 0.8 }
                style={ styles.btnWrapper }
              >
                <View style={ [styles.btnInner, styles.btnBorderWhite] }>
                  <MaterialIcons name="close" size={ 18 } color="rgba(255,255,255,0.85)" />
                  <Text style={ styles.btnTextLight }>CANCEL</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={ () => setIsEditing(true) }
                activeOpacity={ 0.8 }
                style={ styles.btnWrapper }
              >
                <LinearGradient
                  colors={ ['#4c669f', '#3b5998', '#192f6a'] }
                  style={ [styles.btnInner, styles.btnBorderGold] }
                >
                  <MaterialIcons name="edit" size={ 18 } color="#ffde17" />
                  <Text style={ styles.btnText }>EDIT PROFILE</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ () => navigate('LandingScreen') }
                activeOpacity={ 0.8 }
                style={ styles.btnWrapper }
              >
                <LinearGradient
                  colors={ ['#145228', '#00a049', '#145228'] }
                  style={ [styles.btnInner, styles.btnBorderGreen] }
                >
                  <MaterialIcons name="home" size={ 18 } color="#fff" />
                  <Text style={ styles.btnText }>GO HOME</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ handleLogout }
                activeOpacity={ 0.8 }
                style={ styles.btnWrapper }
              >
                <View style={ [styles.btnInner, styles.btnBorderRed] }>
                  <MaterialIcons name="logout" size={ 18 } color="#ef4444" />
                  <Text style={ styles.btnTextRed }>LOGOUT</Text>
                </View>
              </TouchableOpacity>
            </>
          ) }
        </View>
      </ScrollView>

      {/* ── Bottom Navigation Bar ── */ }
      <View style={ styles.bottomNav }>
        <BottomNavItem icon="🏠" label="Home" active={ false } onPress={ () => navigate('LandingScreen') } />
        <BottomNavItem icon="👤" label="Profile" active={ true } onPress={ () => navigate('ProfileScreen') } />
      </View>
    </Wrapper>
  );
};

const CARD_BG = '#0d1a2e';
const CARD_BORDER = 'rgba(255,255,255,0.14)';

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  /* Header */
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 20,
    textShadowColor: Colors.yellow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  /* Profile Card — solid dark background, no transparency */
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 8 },
    }),
  },

  /* Avatar */
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#ffde17',
        shadowOpacity: 0.45,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
    }),
  },
  avatarBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  /* Edit Card */
  editCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Buttons */
  actions: {
    width: '100%',
  },
  btnWrapper: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 14,
    // Removed overflow: 'hidden' as it breaks rendering with elevation on Android when background is transparent
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 4,
        backgroundColor: 'rgba(0,0,0,0.4)', // Needed for elevation to cast shadow properly and prevent clipping issues
      },
    }),
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden', // Moved overflow here to clip the gradient
  },
  btnBorderGold: { borderColor: '#d5be3e' },
  btnBorderGreen: { borderColor: '#00a049' },
  btnBorderWhite: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  btnBorderRed: {
    borderColor: 'rgba(239,68,68,0.45)',
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 10,
  },
  btnTextLight: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 10,
  },
  btnTextRed: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 10,
  },

  /* Misc */
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 16,
    fontSize: 15,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#160D2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(155,135,200,0.15)',
    paddingBottom: 24,
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingTop: 6,
  },
  navIcon: { fontSize: 22, opacity: 0.4 },
  navIconActive: { opacity: 1 },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#FFD700',
  },
  navActiveIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
});

export default ProfileScreen;
