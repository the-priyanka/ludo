import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import React, { useState } from 'react';
import Wrapper from '../components/Wrapper';
import Logo from '../assets/images/logo.png';
import { deviceHeight, deviceWidth } from '../constants/Scaling';
import GradientButton from '../components/GradientButton';
import { Colors } from '../constants/Colors';
import api from '../helpers/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../helpers/NavigationUtil';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data.success) {
        await AsyncStorage.setItem('userToken', res.data.token);
        navigate('HomeScreen');
      }
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper style={styles.mainContainer}>
      <View style={styles.imgContainer}>
        <Image source={Logo} style={styles.img} />
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <GradientButton
          title={loading ? 'LOADING...' : 'SIGN UP'}
          onPress={handleSignup}
        />
        
        <Pressable onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextBold}>Log In</Text>
          </Text>
        </Pressable>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgContainer: {
    width: deviceWidth * 0.6,
    height: deviceHeight * 0.12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  formContainer: {
    width: '85%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.borderColor,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 'bold',
  },
  switchText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
  },
  switchTextBold: {
    fontWeight: 'bold',
    color: Colors.yellow,
  },
});

export default SignupScreen;
