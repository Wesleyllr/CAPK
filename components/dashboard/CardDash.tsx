import React from "react";
import { Card, CardContent } from "@/components/ui/CardComponents";
import { View, Text } from "react-native"; // Import View and Text from react-native

const CardDash = ({ icon, title, value }) => {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <View className="flex items-center">
          {icon}
          <View>
            <Text className="text-sm font-medium text-gray-500 text-center">
              {title}
            </Text>
            <Text className="text-2xl font-bold text-center">{value}</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

export default CardDash;
