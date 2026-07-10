import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import React, { useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import Wrapper from '../components/Wrapper';
import GradientButton from '../components/GradientButton';
import { Colors } from '../constants/Colors';
import api from '../helpers/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../helpers/NavigationUtil';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon, UserIcon,
} from 'react-native-heroicons/solid';

const AVATARS = {
  UserCircleIcon, FaceSmileIcon, StarIcon, FireIcon, HeartIcon, SparklesIcon, UserIcon,
};

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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated!'
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Update failed'
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ username: editUsername, avatar: editAvatar });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      navigate('LoginScreen');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to logout'
      });
    }
  };

  const SelectedIcon = AVATARS[isEditing ? editAvatar : (user?.avatar || 'UserCircleIcon')] || UserCircleIcon;

  return (
    <Wrapper style={ styles.container }>
      <View style={ styles.card }>
        <SelectedIcon size={ 80 } color={ Colors.yellow || '#FBBF24' } />

        { isLoading ? (
          <Text style={ styles.loadingText }>Loading...</Text>
        ) : user ? (
          isEditing ? (
            <View style={ styles.editContainer }>
              <Text style={ styles.label }>Choose Avatar:</Text>
              <View style={ styles.avatarGrid }>
                { Object.keys(AVATARS).map((key) => {
                  const IconComponent = AVATARS[key];
                  return (
                    <Pressable
                      key={ key }
                      onPress={ () => setEditAvatar(key) }
                      style={ [styles.avatarOption, editAvatar === key && styles.avatarSelected] }
                    >
                      <IconComponent size={ 30 } color={ editAvatar === key ? Colors.yellow || '#FBBF24' : '#fff' } />
                    </Pressable>
                  );
                }) }
              </View>
              <Text style={ styles.label }>Username:</Text>
              <TextInput
                style={ styles.input }
                value={ editUsername }
                onChangeText={ setEditUsername }
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="none"
              />
            </View>
          ) : (
            <>
              <Text style={ styles.username }>{ user.username }</Text>
              <Text style={ styles.email }>{ user.email }</Text>
            </>
          )
        ) : (
          <Text style={ styles.errorText }>Failed to load user</Text>
        ) }
      </View>

      <View style={ styles.buttonContainer }>
        { isEditing ? (
          <>
            <GradientButton
              title={ updateMutation.isPending ? "SAVING..." : "SAVE" }
              onPress={ handleSave }
            />
            <GradientButton title="CANCEL" onPress={ () => setIsEditing(false) } />
          </>
        ) : (
          <>
            <GradientButton title="EDIT PROFILE" onPress={ () => setIsEditing(true) } />
            <GradientButton title="LOGOUT" onPress={ handleLogout } />
            <GradientButton title="GO BACK" onPress={ () => navigate('HomeScreen') } />
          </>
        ) }
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '90%',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: 40,
  },
  username: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
  },
  email: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 5,
  },
  loadingText: {
    color: '#FFF',
    marginTop: 20,
    fontSize: 18,
  },
  errorText: {
    color: 'red',
    marginTop: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  editContainer: {
    width: '100%',
    marginTop: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    fontWeight: 'bold',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  avatarOption: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: Colors.yellow || '#FBBF24',
    borderWidth: 1,
  }
});

export default ProfileScreen;
