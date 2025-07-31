import React from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TestTube } from 'lucide-react-native';

export default function TestDeepLinkScreen() {
  const router = useRouter();

  const testScenarios = [
    {
      title: 'Expired OTP Test',
      description: 'Test the expired OTP error handling with access_denied error',
      url: 'http://localhost:3000/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      params: {
        error: 'access_denied',
        error_code: 'otp_expired',
        error_description: 'Email link is invalid or has expired'
      } as Record<string, string>
    },
    {
      title: 'Invalid Token Test',
      description: 'Test invalid token error handling',
      url: 'http://localhost:3000/#error=invalid_token&error_description=Invalid+confirmation+token',
      params: {
        error: 'invalid_token',
        error_description: 'Invalid confirmation token',
        error_code: ''
      } as Record<string, string>
    },
    {
      title: 'Network Error Test',
      description: 'Test network error handling',
      url: 'http://localhost:3000/#error=network_error&error_description=Network+connection+failed',
      params: {
        error: 'network_error',
        error_description: 'Network connection failed',
        error_code: ''
      } as Record<string, string>
    }
  ];

  const handleTestScenario = (params: Record<string, string>) => {
    // Build query string from params
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Navigate to confirm screen with test parameters
    router.push(`/auth/confirm?${queryString}` as any);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Pressable
            onPress={handleGoBack}
            className="flex-row items-center space-x-2 py-2 px-3 rounded-lg active:bg-gray-100"
          >
            <ArrowLeft size={20} color="#374151" />
            <Text className="text-gray-700 font-medium">Back</Text>
          </Pressable>
          
          <View className="flex-row items-center space-x-2">
            <TestTube size={24} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-900">Deep Link Tests</Text>
          </View>
          
          <View className="w-16" />
        </View>

        {/* Content */}
        <View className="flex-1 p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Deep Link Error Testing
          </Text>
          
          <Text className="text-base text-gray-600 mb-8 leading-6">
            Test different deep link error scenarios to verify the enhanced error handling functionality.
          </Text>

          {/* Test Scenarios */}
          <View className="space-y-4">
            {testScenarios.map((scenario, index) => (
              <View key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  {scenario.title}
                </Text>
                
                <Text className="text-sm text-gray-600 mb-3 leading-5">
                  {scenario.description}
                </Text>
                
                <View className="bg-white rounded p-3 mb-3 border border-gray-100">
                  <Text className="text-xs text-gray-500 mb-1">Test URL:</Text>
                  <Text className="text-xs text-gray-700 font-mono break-all">
                    {scenario.url}
                  </Text>
                </View>
                
                <Pressable
                  onPress={() => handleTestScenario(scenario.params)}
                  className="bg-blue-500 py-3 px-4 rounded-lg active:bg-blue-600"
                >
                  <Text className="text-white font-medium text-center">
                    Test This Scenario
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-sm font-medium text-blue-900 mb-2">
              📋 Testing Instructions:
            </Text>
            <Text className="text-sm text-blue-800 leading-5">
              1. Tap on any test scenario above{"\n"}
              2. You&apos;ll be redirected to the confirmation screen{"\n"}
              3. Observe how the error is handled and displayed{"\n"}
              4. Test the recovery options (resend email, manual entry, etc.){"\n"}
              5. Use the back button to return and test other scenarios
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}