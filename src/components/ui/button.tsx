import { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type BProps = {
  children: ReactNode;
  onPress?: () => void;
};

const Button = ({ children, onPress }: BProps) => {
  const animValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(animValue, {
      toValue: 5,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animValue, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };
  return (
    <View style={styles.shadowContainer}>
      <View style={styles.brutalShadow} />
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            transform: [{ translateY: animValue }],
          },
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          className="!bg-[#c7ff4d] w-full !rounded-full px-7 py-4 text-sm font-black uppercase tracking-wide flex items-center gap-2"
          style={styles.btn}
        >
          <Text style={styles.btnText}>{children}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    position: "relative",
    width: "100%",
    height: 56,
  },
  brutalShadow: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 0,
    bottom: -5,
    backgroundColor: "#211713",
    borderRadius: 9999,
  },
  animatedWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  btn: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderColor: "#211713",
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#211713",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export default Button;
