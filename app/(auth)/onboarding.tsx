/**
 * Onboarding screens with modern cyber background
 * Swipeable introduction pages before login
 */

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const onboardingPages = [
  {
    title: "Focus Makes You",
    subtitle: "Who You Want To Be",
    description: "Transform your scattered thoughts into powerful action. Every moment of focus builds the future you envision.",
    gradient: ["#4ECDC4", "#44A08D", "#7EC8E3"],
  },
  {
    title: "The Flow of Ideas",
    subtitle: "Is A Gift",
    description: "Capture every spark of inspiration. Your ideas are valuable—preserve them, organize them, and watch them grow.",
    gradient: ["#4ECDC4", "#44A08D", "#7EC8E3"],
  },
  {
    title: "Unleash Your",
    subtitle: "Potential Now",
    description: "Stop waiting. Start doing. Your journey to greatness begins with a single focused step.",
    gradient: ["#A8E6CF", "#88D8C0", "#FF6B9D"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current; // Slide from right

  // Animated background particles
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      x: useRef(new Animated.Value(Math.random() * width)).current,
      y: useRef(new Animated.Value(Math.random() * height)).current,
      opacity: useRef(new Animated.Value(Math.random() * 0.5 + 0.2)).current,
    }))
  ).current;

  useEffect(() => {
    // Animate particles
    particles.forEach((particle, index) => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 10000 + Math.random() * 5000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 10000 + Math.random() * 5000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.5 + 0.3,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.3 + 0.1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, []);

  useEffect(() => {
    const fullText = `${onboardingPages[currentPage].title}\n${onboardingPages[currentPage].subtitle}`;
    
    // Reset animation values for slide-in effect
    slideAnim.setValue(50); // Start from right (positive = right side)
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    
    // Start with empty text - don't show words before typing
    setDisplayedText("");
    setIsTyping(true);

    // Smooth slide-in animation - starts immediately
    // Container slides in, but text will type inside it
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0, // Slide to center
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.8, // Slightly visible during typing
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, // Keep at full scale to prevent position changes
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start typing animation after slide-in completes
    let typeInterval: NodeJS.Timeout | null = null;
    
    const timeoutId = setTimeout(() => {
      let index = 0;

      typeInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.slice(0, index + 1));
          index++;
        } else {
          if (typeInterval) {
            clearInterval(typeInterval);
            typeInterval = null;
          }
          setIsTyping(false);
          
          // Final animation - only fade, no scale or position change to prevent flashing
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
          // Note: Keep scaleAnim and slideAnim unchanged to prevent any position shifts
        }
      }, 100); // Slower typing speed (100ms per character) for better readability
    }, 450); // Start typing after slide-in animation completes

    return () => {
      clearTimeout(timeoutId);
      if (typeInterval) {
        clearInterval(typeInterval);
      }
    };
  }, [currentPage]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const goToNext = () => {
    if (currentPage < onboardingPages.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
    } else {
      // Navigate to signin screen
      router.push("/(auth)/signin");
    }
  };

  const goToPrevious = () => {
    if (currentPage > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage - 1) * width,
        animated: true,
      });
    }
  };

  const skipOnboarding = () => {
    router.replace("/(auth)/signin");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <LinearGradient
        colors={onboardingPages[currentPage].gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Animated background particles */}
        <View className="absolute inset-0">
          {particles.map((particle, index) => (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#FFFFFF",
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
              }}
            />
          ))}
        </View>

        {/* Skip button */}
        <TouchableOpacity
          onPress={skipOnboarding}
          className="absolute top-12 right-6 z-10 px-4 py-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-white font-semibold text-sm">Skip</Text>
        </TouchableOpacity>

        {/* Back button - show on pages after first */}
        {currentPage > 0 && (
          <TouchableOpacity
            onPress={goToPrevious}
            className="absolute top-12 left-6 z-10 px-4 py-2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Page indicators */}
        <View className="absolute top-16 left-0 right-0 flex-row justify-center gap-2 z-10">
          {onboardingPages.map((_, index) => (
            <View
              key={index}
              className="h-1 rounded-full"
              style={{
                width: currentPage === index ? 24 : 8,
                backgroundColor: currentPage === index ? "#FFFFFF" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {onboardingPages.map((page, index) => (
            <View
              key={index}
              className="flex-1 justify-center items-center px-8"
              style={{ width }}
            >
              <Animated.View
                style={{
                  opacity: index === currentPage ? fadeAnim : 1,
                  transform: [
                    { translateX: index === currentPage ? slideAnim : 0 },
                    { scale: index === currentPage ? scaleAnim : 1 }
                  ],
                }}
                className="items-start w-full px-4"
              >
                <Text
                  className="text-5xl font-bold text-white text-left mb-4"
                  style={{
                    textShadowColor: "rgba(0,0,0,0.3)",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                    lineHeight: 60,
                  }}
                >
                  {index === currentPage ? displayedText : `${page.title}\n${page.subtitle}`}
                  {isTyping && index === currentPage && (
                    <Text className="text-5xl">|</Text>
                  )}
                </Text>

                {!isTyping && index === currentPage && (
                  <Animated.View
                    style={{
                      opacity: fadeAnim,
                      marginTop: 20,
                    }}
                  >
                    <Text
                      className="text-lg text-white text-left px-4 leading-6"
                      style={{
                        textShadowColor: "rgba(0,0,0,0.2)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      {page.description}
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom navigation */}
        <View className="pb-8 px-8">
          <TouchableOpacity
            onPress={goToNext}
            className="bg-white rounded-full py-4 px-8 flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-lg font-bold mr-2" style={{ color: onboardingPages[currentPage].gradient[0] }}>
              {currentPage < onboardingPages.length - 1 ? "Next" : "Get Started"}
            </Text>
            <Ionicons
              name={currentPage < onboardingPages.length - 1 ? "arrow-forward" : "checkmark-circle"}
              size={24}
              color={onboardingPages[currentPage].gradient[0]}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

