import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  Image,
  Dimensions,
  ImageBackground
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import ChessRoomModal from '../components/ChessRoomModal';

const { width, height } = Dimensions.get('window');

const ChessGameModes = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const botCardScale = useRef(new Animated.Value(1)).current;
  const onlineCardScale = useRef(new Animated.Value(1)).current;

  const [selectedMode, setSelectedMode] = useState('vsPlayer');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePressIn = (anim) => {
    Animated.spring(anim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (anim) => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleStartGame = () => {
    if (selectedMode === 'vsFriendOnline') {
      setModalVisible(true);
    } else {
      navigation.navigate('ChessMaster', { mode: selectedMode });
    }
  };

  const handleOnlineMatchFound = (roomState) => {
    setModalVisible(false);
    navigation.navigate('ChessMaster', { 
      mode: 'vsFriendOnline',
      roomId: roomState.roomId,
      roomState: roomState
    });
  };

  return (
    <View style={ styles.container }>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Gradient */ }
      <LinearGradient
        colors={ ['#1E1238', '#0F0A1E', '#05030A'] }
        style={ StyleSheet.absoluteFill }
      />

      {/* Hero Banner Section */ }
      <View style={ styles.heroSection }>
        <ImageBackground
          source={ require('../assets/images/chess_thumbnail.png') }
          style={ styles.heroImage }
          resizeMode="cover"
        >
          {/* Top Gradient Overlay to blend with header */ }
          <LinearGradient
            colors={ ['rgba(30,18,56,1)', 'rgba(30,18,56,0.3)', 'transparent'] }
            style={ styles.heroGradientTop }
          />
          {/* Bottom Gradient Overlay to blend with content */ }
          <LinearGradient
            colors={ ['transparent', 'rgba(15,10,30,0.8)', '#0F0A1E'] }
            style={ styles.heroGradientBottom }
          />
        </ImageBackground>

        {/* Custom Header positioned over the image */ }
        <SafeAreaView style={ styles.headerSafeArea }>
          <View style={ styles.header }>
            <TouchableOpacity
              style={ styles.backBtn }
              onPress={ () => navigation.goBack() }
              activeOpacity={ 0.7 }
            >
              <MaterialCommunityIcons name="arrow-left" size={ 26 } color="#FFF" />
            </TouchableOpacity>
            <View style={ styles.badgePro }>
              <Text style={ styles.badgeProText }>PRO</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */ }
      <Animated.View style={ [styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }] }>

        <View style={ styles.headerTextContainer }>
          <Text style={ styles.title }>Chess Master</Text>
          <Text style={ styles.subtitle }>Test your strategic skills. Plan your moves, anticipate your opponent, and aim for checkmate!</Text>
        </View>

        <Text style={ styles.sectionTitle }>SELECT MODE</Text>

        <View style={ styles.modesContainer }>
          {/* Player vs Player Mode Card */ }
          <TouchableOpacity
            activeOpacity={ 0.9 }
            onPress={ () => setSelectedMode('vsPlayer') }
            onPressIn={ () => handlePressIn(cardScale) }
            onPressOut={ () => handlePressOut(cardScale) }
            style={ styles.cardWrapper }
          >
            <Animated.View style={ { transform: [{ scale: cardScale }] } }>
              <View style={ [styles.modeCard, selectedMode === 'vsPlayer' ? styles.modeCardActive : styles.modeCardInactive, { overflow: 'hidden' }] }>
                { selectedMode === 'vsPlayer' && (
                  <LinearGradient
                    colors={ ['rgba(212, 180, 131, 0.15)', 'rgba(212, 180, 131, 0.05)'] }
                    start={ { x: 0, y: 0 } } end={ { x: 1, y: 1 } }
                    style={ StyleSheet.absoluteFill }
                  />
                ) }
                <View style={ styles.modeCardContent }>
                  <View style={ [styles.modeIconContainer, selectedMode === 'vsPlayer' ? { backgroundColor: '#D4B483', shadowColor: '#D4B483', elevation: 10, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } } : { backgroundColor: 'rgba(255,255,255,0.1)' }] }>
                    <MaterialCommunityIcons name="account-group" size={ 32 } color={ selectedMode === 'vsPlayer' ? "#0F0A1E" : "#8a7c9f" } />
                  </View>
                  <View style={ styles.modeTextContainer }>
                    <Text style={ [styles.modeTitle, selectedMode !== 'vsPlayer' && { color: '#8a7c9f' }] }>Player vs Player</Text>
                    <Text style={ styles.modeDesc }>Play locally with a friend</Text>
                  </View>
                  { selectedMode === 'vsPlayer' ? (
                    <View style={ styles.radioActive }>
                      <View style={ styles.radioInner } />
                    </View>
                  ) : (
                    <View style={ styles.radioInactive } />
                  ) }
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Player vs Bot Mode Card */ }
          <TouchableOpacity
            activeOpacity={ 0.9 }
            onPress={ () => setSelectedMode('vsBot') }
            onPressIn={ () => handlePressIn(botCardScale) }
            onPressOut={ () => handlePressOut(botCardScale) }
            style={ styles.cardWrapper }
          >
            <Animated.View style={ { transform: [{ scale: botCardScale }] } }>
              <View style={ [styles.modeCard, selectedMode === 'vsBot' ? styles.modeCardActive : styles.modeCardInactive, { overflow: 'hidden' }] }>
                { selectedMode === 'vsBot' && (
                  <LinearGradient
                    colors={ ['rgba(212, 180, 131, 0.15)', 'rgba(212, 180, 131, 0.05)'] }
                    start={ { x: 0, y: 0 } } end={ { x: 1, y: 1 } }
                    style={ StyleSheet.absoluteFill }
                  />
                ) }
                <View style={ styles.modeCardContent }>
                  <View style={ [styles.modeIconContainer, selectedMode === 'vsBot' ? { backgroundColor: '#D4B483', shadowColor: '#D4B483', elevation: 10, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } } : { backgroundColor: 'rgba(255,255,255,0.1)' }] }>
                    <MaterialCommunityIcons name="robot-outline" size={ 28 } color={ selectedMode === 'vsBot' ? "#0F0A1E" : "#8a7c9f" } />
                  </View>
                  <View style={ styles.modeTextContainer }>
                    <Text style={ [styles.modeTitle, selectedMode !== 'vsBot' && { color: '#8a7c9f' }] }>Player vs Bot</Text>
                    <Text style={ styles.modeDesc }>Play against the AI</Text>
                  </View>
                  { selectedMode === 'vsBot' ? (
                    <View style={ styles.radioActive }>
                      <View style={ styles.radioInner } />
                    </View>
                  ) : (
                    <View style={ styles.radioInactive } />
                  ) }
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Play vs Friend (Online) Mode Card */ }
          <TouchableOpacity
            activeOpacity={ 0.9 }
            onPress={ () => setSelectedMode('vsFriendOnline') }
            onPressIn={ () => handlePressIn(onlineCardScale) }
            onPressOut={ () => handlePressOut(onlineCardScale) }
            style={ styles.cardWrapper }
          >
            <Animated.View style={ { transform: [{ scale: onlineCardScale }] } }>
              <View style={ [styles.modeCard, selectedMode === 'vsFriendOnline' ? styles.modeCardActive : styles.modeCardInactive, { overflow: 'hidden' }] }>
                { selectedMode === 'vsFriendOnline' && (
                  <LinearGradient
                    colors={ ['rgba(212, 180, 131, 0.15)', 'rgba(212, 180, 131, 0.05)'] }
                    start={ { x: 0, y: 0 } } end={ { x: 1, y: 1 } }
                    style={ StyleSheet.absoluteFill }
                  />
                ) }
                <View style={ styles.modeCardContent }>
                  <View style={ [styles.modeIconContainer, selectedMode === 'vsFriendOnline' ? { backgroundColor: '#D4B483', shadowColor: '#D4B483', elevation: 10, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } } : { backgroundColor: 'rgba(255,255,255,0.1)' }] }>
                    <MaterialCommunityIcons name="earth" size={ 28 } color={ selectedMode === 'vsFriendOnline' ? "#0F0A1E" : "#8a7c9f" } />
                  </View>
                  <View style={ styles.modeTextContainer }>
                    <Text style={ [styles.modeTitle, selectedMode !== 'vsFriendOnline' && { color: '#8a7c9f' }] }>Play Online</Text>
                    <Text style={ styles.modeDesc }>Play online with randoms or friends</Text>
                  </View>
                  { selectedMode === 'vsFriendOnline' ? (
                    <View style={ styles.radioActive }>
                      <View style={ styles.radioInner } />
                    </View>
                  ) : (
                    <View style={ styles.radioInactive } />
                  ) }
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* Footer Button Area */ }
      <Animated.View style={ [styles.footer, { opacity: fadeAnim }] }>
        <TouchableOpacity
          activeOpacity={ 0.85 }
          onPressIn={ () => handlePressIn(buttonScale) }
          onPressOut={ () => handlePressOut(buttonScale) }
          onPress={ handleStartGame }
        >
          <Animated.View style={ { transform: [{ scale: buttonScale }] } }>
            <View style={ styles.startBtnContainer }>
              <View style={ styles.startBtnBackgroundWrapper }>
                <LinearGradient
                  colors={ ['#E5C592', '#D4B483', '#B89660'] }
                  start={ { x: 0, y: 0 } } end={ { x: 1, y: 1 } }
                  style={ StyleSheet.absoluteFill }
                />
              </View>
              <View style={ styles.startBtnContent }>
                <Text style={ styles.startBtnText }>START MATCH</Text>
                <MaterialCommunityIcons name="sword-cross" size={ 22 } color="#0F0A1E" />
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <ChessRoomModal 
        visible={isModalVisible}
        onPressHide={() => setModalVisible(false)}
        onMatchFound={handleOnlineMatchFound}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1E',
  },
  heroSection: {
    width: '100%',
    height: height * 0.38,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)', // mostly a web property but helps define intent
  },
  badgePro: {
    backgroundColor: 'rgba(212, 180, 131, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeProText: {
    color: '#0F0A1E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -30, // Pull up over the bottom gradient
    zIndex: 5,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A79BC5',
    lineHeight: 22,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#A79BC5',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  modesContainer: {
    gap: 16,
  },
  cardWrapper: {
    shadowColor: '#D4B483',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modeCard: {
    borderRadius: 20,
    borderWidth: 1.5,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modeCardActive: {
    borderColor: 'rgba(212, 180, 131, 0.6)',
  },
  modeCardInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: 13,
    color: '#A79BC5',
  },
  radioActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4B483',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4B483',
  },
  radioInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lockIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#05030A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  startBtnContainer: {
    shadowColor: '#D4B483',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  startBtnBackgroundWrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  startBtnContent: {
    flexDirection: 'row',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  startBtnText: {
    color: '#0F0A1E',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

export default ChessGameModes;
