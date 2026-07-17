import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import { navigate } from '../helpers/NavigationUtil';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

// ─── Game Data ───────────────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'ludo',
    name: 'Ludo',
    tag: '2-4 Players',
    image: require('../assets/images/ludo_thumbnail.png'),
    available: true,
    badge: 'HOT 🔥',
    badgeColor: '#FF6B35',
    route: 'HomeScreen',
  },
  {
    id: 'chess',
    name: 'Chess Master',
    tag: 'Coming Soon',
    image: require('../assets/images/chess_thumbnail.png'),
    available: false,
    badge: 'SOON ✨',
    badgeColor: '#7C3AED',
    route: null,
  },
];

const CATEGORIES = ['HOT', 'LUDO'];

// ─── Game Card ───────────────────────────────────────────────────────────────
const GameCard = ({ game }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!game.available) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [game.available, shimmerAnim]);

  const handlePressIn = () => {
    if (!game.available) return;
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (game.available && game.route) {
      navigate(game.route);
    }
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.85],
  });

  return (
    <Animated.View style={ [styles.cardWrapper, { transform: [{ scale: scaleAnim }] }] }>
      <Pressable
        onPressIn={ handlePressIn }
        onPressOut={ handlePressOut }
        onPress={ handlePress }
        style={ [styles.card, !game.available && styles.cardDisabled] }
      >
        {/* Thumbnail */ }
        <Animated.View style={ [styles.imageWrapper, !game.available && { opacity: shimmerOpacity }] }>
          <Image source={ game.image } style={ styles.gameImage } resizeMode="cover" />
        </Animated.View>

        {/* Badge */ }
        <View style={ [styles.badge, { backgroundColor: game.badgeColor }] }>
          <Text style={ styles.badgeText }>{ game.badge }</Text>
        </View>

        {/* Coming Soon overlay */ }
        { !game.available && (
          <View style={ styles.comingSoonOverlay }>
            <Text style={ styles.comingSoonIcon }>🔒</Text>
            <Text style={ styles.comingSoonLabel }>Coming Soon</Text>
          </View>
        ) }

        {/* Info */ }
        <View style={ styles.cardInfo }>
          <Text style={ styles.gameName } numberOfLines={ 1 }>{ game.name }</Text>
          <Text style={ styles.gameTag }>{ game.tag }</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Bottom Nav Item ─────────────────────────────────────────────────────────
const BottomNavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={ styles.navItem } onPress={ onPress } activeOpacity={ 0.7 }>
    { active && <View style={ styles.navActiveIndicator } /> }
    <Text style={ [styles.navIcon, active && styles.navIconActive] }>{ icon }</Text>
    <Text style={ [styles.navLabel, active && styles.navLabelActive] }>{ label }</Text>
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const LandingScreen = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleCategoryPress = (index) => {
    setActiveCategory(index);
    Animated.spring(indicatorAnim, { toValue: index, friction: 7, useNativeDriver: false }).start();
  };

  const indicatorLeft = indicatorAnim.interpolate({
    inputRange: [0, CATEGORIES.length - 1],
    outputRange: ['0%', `${ (100 / CATEGORIES.length) * (CATEGORIES.length - 1) }%`],
  });

  const filteredGames = activeCategory === 1
    ? GAMES.filter((g) => g.id === 'ludo')
    : GAMES;

  return (
    <View style={ styles.container }>
      <StatusBar barStyle="light-content" backgroundColor="#0F0A1E" />

      {/* ── Header ── */ }
      <Animated.View style={ [styles.header, { opacity: fadeAnim }] }>
        <View>
          <Text style={ styles.headerTitle }>🎮 Game Hub</Text>
          <Text style={ styles.headerSubtitle }>Pick your challenge</Text>
        </View>
        <View style={ styles.headerRight }>
          <TouchableOpacity style={ styles.iconBtn } activeOpacity={ 0.7 }>
            <Text style={ styles.iconBtnText }>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ [styles.iconBtn, { backgroundColor: 'rgba(255,107,53,0.2)' }] }
            activeOpacity={ 0.7 }
            onPress={ () => navigate('ProfileScreen') }
          >
            <Text style={ styles.iconBtnText }>👤</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Category Tabs ── */ }
      <Animated.View style={ [styles.tabContainer, { opacity: fadeAnim }] }>
        <View style={ styles.tabTrack }>
          <Animated.View
            style={ [
              styles.tabIndicator,
              { width: `${ 100 / CATEGORIES.length }%`, left: indicatorLeft },
            ] }
          />
          { CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={ cat }
              style={ styles.tab }
              onPress={ () => handleCategoryPress(i) }
              activeOpacity={ 0.8 }
            >
              <Text style={ [styles.tabText, activeCategory === i && styles.tabTextActive] }>
                { cat }
              </Text>
            </TouchableOpacity>
          )) }
        </View>
      </Animated.View>

      {/* ── Scroll Content ── */ }
      <ScrollView
        style={ styles.scrollView }
        contentContainerStyle={ styles.scrollContent }
        showsVerticalScrollIndicator={ false }
      >
        <Animated.View style={ { transform: [{ translateY: slideAnim }], opacity: fadeAnim } }>
          {/* Section Header */ }
          <View style={ styles.sectionHeader }>
            <Text style={ styles.sectionTitle }>MUST PLAY</Text>
            <TouchableOpacity style={ styles.seeAllBtn }>
              <Text style={ styles.seeAllText }>See All ›</Text>
            </TouchableOpacity>
          </View>

          {/* Game Grid */ }
          <View style={ styles.gameGrid }>
            { filteredGames.map((game) => (
              <GameCard key={ game.id } game={ game } />
            )) }
          </View>

          {/* Coming Soon Banner */ }
          <View style={ styles.comingSoonBanner }>
            <Text style={ styles.bannerEmoji }>🚀</Text>
            <View style={ styles.bannerText }>
              <Text style={ styles.bannerTitle }>More Games Coming!</Text>
              <Text style={ styles.bannerSub }>Chess & more exciting games are on the way</Text>
            </View>
          </View>

          <View style={ { height: 90 } } />
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Navigation Bar ── */ }
      <View style={ styles.bottomNav }>
        <BottomNavItem icon="🏠" label="Home" active={ true } onPress={ () => navigate('LandingScreen') } />
        {/* <BottomNavItem icon="🎮" label="Games" active={ true } onPress={ () => { } } /> */ }
        {/* <BottomNavItem icon="🏆" label="Leaderboard" active={ false } onPress={ () => { } } /> */ }
        <BottomNavItem icon="👤" label="Profile" active={ false } onPress={ () => navigate('ProfileScreen') } />
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9B87C8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(155,135,200,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: { fontSize: 18 },

  // Tabs
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 30,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#FFD700',
    borderRadius: 26,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#0F0A1E',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  seeAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  seeAllText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },

  // Grid
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },

  // Card
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1A1235',
    borderWidth: 1,
    borderColor: 'rgba(155,135,200,0.2)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardDisabled: {
    borderColor: 'rgba(124,58,237,0.3)',
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_WIDTH,
    backgroundColor: 'rgba(10,5,25,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  comingSoonIcon: { fontSize: 32, marginBottom: 6 },
  comingSoonLabel: {
    color: '#E0D6FF',
    fontWeight: '700',
    fontSize: 13,
  },
  cardInfo: {
    padding: 10,
  },
  gameName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  gameTag: {
    color: '#9B87C8',
    fontSize: 11,
    marginTop: 2,
  },

  // Coming Soon Banner
  comingSoonBanner: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  bannerEmoji: { fontSize: 34, marginRight: 14 },
  bannerText: { flex: 1 },
  bannerTitle: {
    color: '#E0D6FF',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 3,
  },
  bannerSub: {
    color: '#9B87C8',
    fontSize: 12,
    lineHeight: 18,
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

export default LandingScreen;
