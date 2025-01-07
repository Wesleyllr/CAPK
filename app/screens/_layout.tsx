import { Stack } from "expo-router";

const ScreensLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Define se cabeçalhos são exibidos
      }}
    />
  );
};

export default ScreensLayout;
