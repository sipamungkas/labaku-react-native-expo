import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, SafeAreaView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { deepLinkHandler, type DeepLinkParams, type ConfirmationResult } from '@/lib/utils/deepLinkHandler';
import { 
  LoadingState, 
  ErrorState, 
  SuccessState, 
  ManualEntryForm, 
  ResendEmailForm 
} from '@/components/ui/ConfirmationStates';

type ConfirmationStep = 'loading' | 'success' | 'error' | 'manual_entry' | 'resend_email';

interface ConfirmationState {
  step: ConfirmationStep;
  progress: number;
  message: string;
  error?: string;
  errorType?: ConfirmationResult['errorType'];
  userEmail?: string;
  estimatedTime?: string;
}

export default function ConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [state, setState] = useState<ConfirmationState>({
    step: 'loading',
    progress: 0,
    message: 'Initializing confirmation process...'
  });
  
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Convert URL params to DeepLinkParams
  const deepLinkParams: DeepLinkParams = {
    access_token: params.access_token as string,
    refresh_token: params.refresh_token as string,
    token: params.token as string, // For Supabase verification URLs
    type: params.type as string,
    error: params.error as string,
    error_description: params.error_description as string,
    redirect_to: params.redirect_to as string,
  };

  const updateProgress = (progress: number, message: string, estimatedTime?: string) => {
    setState(prev => ({ ...prev, progress, message, estimatedTime }));
  };

  const handleEmailConfirmation = useCallback(async () => {
    try {
      setIsProcessing(true);
      setState(prev => ({ ...prev, step: 'loading', progress: 0 }));
      
      // Step 1: Validate parameters
      updateProgress(20, 'Validating confirmation link...', '5 seconds');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      
      // Step 2: Process confirmation
      updateProgress(50, 'Processing email confirmation...', '3 seconds');
      const result = await deepLinkHandler.processConfirmation(deepLinkParams);
      
      if (result.success && result.session) {
        // Step 3: Success
        updateProgress(100, 'Email confirmed successfully!', '1 second');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setState({
          step: 'success',
          progress: 100,
          message: 'Success!',
          userEmail: result.session.user?.email
        });
      } else {
        // Handle error
        setState({
          step: 'error',
          progress: 0,
          message: 'Confirmation failed',
          error: result.error || 'An unknown error occurred',
          errorType: result.errorType
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error in confirmation flow:', error);
      setState({
        step: 'error',
        progress: 0,
        message: 'Confirmation failed',
        error: 'An unexpected error occurred. Please try again.',
        errorType: 'UNKNOWN'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [deepLinkParams]);

  useEffect(() => {
    handleEmailConfirmation();
  }, [handleEmailConfirmation]);

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setState(prev => ({
        ...prev,
        error: 'Maximum retry attempts reached. Please try resending the confirmation email.',
        errorType: 'NETWORK_ERROR'
      }));
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await handleEmailConfirmation();
  };

  const handleManualEntry = () => {
    setState(prev => ({ ...prev, step: 'manual_entry' }));
  };

  const handleResendEmail = () => {
    setState(prev => ({ ...prev, step: 'resend_email' }));
  };

  const handleManualTokenSubmit = async (token: string) => {
    try {
      setIsProcessing(true);
      setState(prev => ({ ...prev, step: 'loading', message: 'Processing manual token...' }));
      
      // Try to extract tokens from the manual input
      // This is a simplified approach - in a real app, you might need more sophisticated parsing
      const result = await deepLinkHandler.processConfirmation({
        access_token: token,
        refresh_token: token, // This might not work, but we'll try
        type: 'signup'
      });
      
      if (result.success && result.session) {
        setState({
          step: 'success',
          progress: 100,
          message: 'Success!',
          userEmail: result.session.user?.email
        });
      } else {
        setState({
          step: 'error',
          progress: 0,
          message: 'Manual confirmation failed',
          error: result.error || 'Invalid token provided',
          errorType: result.errorType
        });
      }
    } catch (error) {
      setState({
        step: 'error',
        progress: 0,
        message: 'Manual confirmation failed',
        error: 'Failed to process the provided token',
        errorType: 'INVALID_TOKEN'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendEmailSubmit = async (email: string) => {
    try {
      setIsProcessing(true);
      const result = await deepLinkHandler.resendConfirmationEmail(email);
      
      if (result.success) {
        setState({
          step: 'loading',
          progress: 0,
          message: 'Confirmation email sent! Please check your inbox and click the new confirmation link.'
        });
        
        // Navigate back to register or login after a delay
        setTimeout(() => {
          router.replace('/auth/register');
        }, 3000);
      } else {
        setState({
          step: 'error',
          progress: 0,
          message: 'Failed to resend email',
          error: result.error || 'Failed to send confirmation email',
          errorType: 'NETWORK_ERROR'
        });
      }
    } catch (error) {
      setState({
        step: 'error',
        progress: 0,
        message: 'Failed to resend email',
        error: 'Network error occurred while sending email',
        errorType: 'NETWORK_ERROR'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToApp = () => {
    router.replace('/(tabs)');
  };

  const handleContactSupport = () => {
    // Open email client or support URL
    Linking.openURL('mailto:support@labaku.com?subject=Email Confirmation Issue');
  };

  const handleCancel = () => {
    setState({
      step: 'error',
      progress: 0,
      message: 'Confirmation cancelled',
      error: state.error || 'Please try the confirmation link again or contact support.',
      errorType: state.errorType
    });
  };

  const renderContent = () => {
    switch (state.step) {
      case 'loading':
        return (
          <LoadingState
            message={state.message}
            progress={state.progress}
            estimatedTime={state.estimatedTime}
          />
        );
      
      case 'success':
        return (
          <SuccessState
            userEmail={state.userEmail}
            onContinue={handleContinueToApp}
            showAnimation={true}
          />
        );
      
      case 'error':
        return (
          <ErrorState
            error={state.error || 'An unknown error occurred'}
            errorType={state.errorType}
            onRetry={state.errorType === 'NETWORK_ERROR' ? handleRetry : undefined}
            onManualEntry={handleManualEntry}
            onResendEmail={handleResendEmail}
            onContactSupport={handleContactSupport}
          />
        );
      
      case 'manual_entry':
        return (
          <ManualEntryForm
            onSubmit={handleManualTokenSubmit}
            onCancel={handleCancel}
            isLoading={isProcessing}
          />
        );
      
      case 'resend_email':
        return (
          <ResendEmailForm
            onResend={handleResendEmailSubmit}
            onCancel={handleCancel}
            isLoading={isProcessing}
            cooldownSeconds={0}
          />
        );
      
      default:
        return (
          <LoadingState message="Loading..." />
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center min-h-full px-4">
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}