import Button from "@/components/ui/button";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View className="flex flex-2 justify-center items-start">
        <Text>For Everyone Who</Text>
        <Text className="font-display font-bold text-4xl uppercase leading-[0.88] tracking-tighter max-w-[9ch] text-[clamp(3.5rem,13vw,10rem)]">
          Moved out
        </Text>
      </View>
      <View className="flex flex-1 justify-center items-center">
        <Text className="font-display font-bold text-5xl uppercase leading-[0.88] tracking-tighter max-w-[9ch] text-[clamp(3.5rem,13vw,10rem)]">
          TITLE
        </Text>
      </View>
      <View>
        {/* <LottieView source={require("/assets/palmdancing.lottie")}></LottieView> */}
      </View>

      <View className="flex flex-2 items-center w-full justify-end">
        <Button>CHECK IN!</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    padding: 20,
    backgroundColor: "#fff4dc",
  },
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
