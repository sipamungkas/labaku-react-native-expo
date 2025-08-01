import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { deepLinkHandler } from '@/lib/utils/deepLinkHandler';
import { ExternalLink, Copy, TestTube, Zap } from 'lucide-react-native';

interface TestScenario {
  name: string;
  description: string;
  url: string;
  type: 'success' | 'error' | 'verification';
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Supabase Verification URL',
    description: 'Test the provided Supabase verification URL with signup token',
    url: 'https://bkmxbtbkjomjypenrdaj.supabase.co/auth/v1/verify?token=fcfc74cbe61f712af944abffc41bbd50377e661e333c6b9e175725d9&type=signup&redirect_to=http://localhost:3000',
    type: 'verification'
  },
  {
    name: 'Expired OTP Error',
    description: 'Test expired OTP error handling',
    url: 'labaku://auth/confirm?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    type: 'error'
  },
  {
    name: 'Successful Session Tokens',
    description: 'Test successful confirmation with session tokens',
    url: 'labaku://auth/confirm?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test&refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh&type=signup',
    type: 'success'
  },
  {
    name: 'Missing Parameters',
    description: 'Test error handling for missing required parameters',
    url: 'labaku://auth/confirm?type=signup',
    type: 'error'
  }
];

export default function DeepLinkTester() {
  const [customUrl, setCustomUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleTestDeepLink = async (url: string) => {
    try {
      setIsProcessing(true);
      setLastResult('Processing...');
      
      console.log('🧪 Testing deep link:', url);
      
      // Check if it's a Supabase verification URL and convert it
      let testUrl = url;
      if (url.includes('supabase.co/auth/v1/verify')) {
        testUrl = deepLinkHandler.convertSupabaseUrlToDeepLink(url);
        console.log('🔄 Converted to:', testUrl);
      }
      
      // Extract parameters from the URL
      const urlObj = new URL(testUrl);
      const params = Object.fromEntries(urlObj.searchParams.entries());
      
      console.log('📋 Extracted parameters:', params);
      
      // Validate and process the parameters
      const validation = deepLinkHandler.validateParams(params);
      
      if (!validation.isValid) {
        setLastResult(`❌ Validation Failed: ${validation.error}`);
        return;
      }
      
      const result = await deepLinkHandler.processConfirmation(params);
      
      if (result.success) {
        setLastResult(`✅ Success: User ${result.session?.user?.email || 'unknown'} confirmed successfully!`);
      } else {
        setLastResult(`❌ Error: ${result.error} (Type: ${result.errorType})`);
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      setLastResult(`❌ Test Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInApp = async (url: string) => {
    try {
      // Convert Supabase URL to deep link if needed
      let deepLinkUrl = url;
      if (url.includes('supabase.co/auth/v1/verify')) {
        deepLinkUrl = deepLinkHandler.convertSupabaseUrlToDeepLink(url);
      }
      
      const canOpen = await Linking.canOpenURL(deepLinkUrl);
      if (canOpen) {
        await Linking.openURL(deepLinkUrl);
      } else {
        Alert.alert('Error', 'Cannot open deep link URL');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open URL: ${error}`);
    }
  };

  const copyToClipboard = (text: string) => {
    // Note: React Native doesn't have built-in clipboard API
    // In a real app, you'd use @react-native-clipboard/clipboard
    Alert.alert('Copy', 'URL copied to clipboard (simulated)');
  };

  const renderScenario = (scenario: TestScenario, index: number) => {
    const getTypeColor = () => {
      switch (scenario.type) {
        case 'success': return 'bg-green-100 border-green-300';
        case 'error': return 'bg-red-100 border-red-300';
        case 'verification': return 'bg-blue-100 border-blue-300';
        default: return 'bg-gray-100 border-gray-300';
      }
    };

    const getTypeIcon = () => {
      switch (scenario.type) {
        case 'success': return <Zap size={16} color="#059669" />;
        case 'error': return <TestTube size={16} color="#DC2626" />;
        case 'verification': return <ExternalLink size={16} color="#2563EB" />;
        default: return <TestTube size={16} color="#6B7280" />;
      }
    };

    return (
      <View key={index} className={`p-4 rounded-lg border-2 mb-4 ${getTypeColor()}`}>
        <View className="flex-row items-center mb-2">
          {getTypeIcon()}
          <Text className="font-semibold text-gray-800 ml-2 flex-1">{scenario.name}</Text>
        </View>
        
        <Text className="text-gray-600 text-sm mb-3">{scenario.description}</Text>
        
        <View className="bg-gray-50 p-3 rounded border mb-3">
          <Text className="text-xs font-mono text-gray-700" numberOfLines={3}>
            {scenario.url}
          </Text>
        </View>
        
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleTestDeepLink(scenario.url)}
            disabled={isProcessing}
            className="flex-1 bg-blue-500 py-2 px-4 rounded flex-row items-center justify-center"
          >
            <TestTube size={16} color="white" />
            <Text className="text-white font-medium ml-2">
              {isProcessing ? 'Testing...' : 'Test'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleOpenInApp(scenario.url)}
            className="flex-1 bg-green-500 py-2 px-4 rounded flex-row items-center justify-center"
          >
            <ExternalLink size={16} color="white" />
            <Text className="text-white font-medium ml-2">Open</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => copyToClipboard(scenario.url)}
            className="bg-gray-500 py-2 px-3 rounded"
          >
            <Copy size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800 mb-2">Deep Link Tester</Text>
        <Text className="text-gray-600">
          Test various deep link scenarios for email confirmation flows.
        </Text>
      </View>

      {/* Custom URL Input */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Custom URL Test</Text>
        <TextInput
          value={customUrl}
          onChangeText={setCustomUrl}
          placeholder="Enter a deep link URL to test..."
          className="border border-gray-300 rounded-lg p-3 mb-3 text-sm"
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          onPress={() => customUrl && handleTestDeepLink(customUrl)}
          disabled={!customUrl || isProcessing}
          className={`py-3 px-4 rounded-lg flex-row items-center justify-center ${
            !customUrl || isProcessing ? 'bg-gray-300' : 'bg-purple-500'
          }`}
        >
          <TestTube size={16} color="white" />
          <Text className="text-white font-medium ml-2">
            {isProcessing ? 'Testing...' : 'Test Custom URL'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Result */}
      {lastResult && (
        <View className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <Text className="font-semibold text-gray-800 mb-2">Last Test Result:</Text>
          <Text className="text-sm text-gray-700">{lastResult}</Text>
        </View>
      )}

      {/* Predefined Scenarios */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-3">Test Scenarios</Text>
        {TEST_SCENARIOS.map(renderScenario)}
      </View>

      {/* Instructions */}
      <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <Text className="font-semibold text-blue-800 mb-2">Instructions:</Text>
        <Text className="text-blue-700 text-sm leading-5">
          • <Text className="font-medium">Test:</Text> Validates and processes the URL without navigation{"\n"}
          • <Text className="font-medium">Open:</Text> Opens the URL in the app (triggers actual navigation){"\n"}
          • <Text className="font-medium">Copy:</Text> Copies the URL to clipboard for external testing{"\n"}
          • Supabase verification URLs are automatically converted to mobile deep links
        </Text>
      </View>
    </ScrollView>
  );
}