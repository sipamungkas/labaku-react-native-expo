import React from 'react';
import { SafeAreaView } from 'react-native';
import DeepLinkTester from '@/components/ui/DeepLinkTester';

export default function DeepLinkTestPage() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <DeepLinkTester />
    </SafeAreaView>
  );
}