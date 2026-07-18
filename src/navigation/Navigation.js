import { NavigationContainer } from '@react-navigation/native';
import LudoBoardScreen from '../screens/LudoBoardScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChessMaster from '../screens/ChessMaster';
import { navigationRef } from '../helpers/NavigationUtil';

const {
  createNativeStackNavigator,
} = require('@react-navigation/native-stack');

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={() => ({
          headerShown: false,
        })}
      >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="SignupScreen"
          component={SignupScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="LandingScreen"
          component={LandingScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="LudoBoardScreen"
          component={LudoBoardScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="ChessMaster"
          component={ChessMaster}
          options={{
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
