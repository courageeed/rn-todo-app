import { Stack } from "expo-router";
import Toast from 'react-native-toast-message'; // Thêm import
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast /> 
    </>
  );
}