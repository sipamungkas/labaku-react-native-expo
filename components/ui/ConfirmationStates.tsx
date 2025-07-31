import React from 'react';
import { View, Text, TextInput, ActivityIndicator, Pressable, Animated } from 'react-native';
import { CheckCircle, XCircle, RefreshCw, Mail, AlertTriangle } from 'lucide-react-native';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  estimatedTime?: string;
}

export function LoadingState({ message = 'Confirming your email...', progress, estimatedTime }: LoadingStateProps) {
  return (
    <View className="items-center justify-center py-8">
      <ActivityIndicator size="large" color="#10B981" className="mb-4" />
      
      <Text className="text-lg font-medium text-gray-900 text-center mb-2">
        {message}
      </Text>
      
      {progress !== undefined && (
        <View className="w-64 bg-gray-200 rounded-full h-2 mb-3">
          <View 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </View>
      )}
      
      <Text className="text-sm text-gray-600 text-center">
        {estimatedTime ? `Estimated time: ${estimatedTime}` : 'Please wait while we confirm your email address...'}
      </Text>
      
      <View className="flex-row items-center mt-4 space-x-2">
        <View className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <View className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <View className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </View>
    </View>
  );
}

interface ErrorStateProps {
  error: string;
  errorType?: 'MISSING_PARAMS' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'OTP_EXPIRED' | 'ACCESS_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN';
  onRetry?: () => void;
  onManualEntry?: () => void;
  onResendEmail?: () => void;
  onContactSupport?: () => void;
}

export function ErrorState({ 
  error, 
  errorType, 
  onRetry, 
  onManualEntry, 
  onResendEmail, 
  onContactSupport 
}: ErrorStateProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return <RefreshCw size={48} color="#EF4444" />;
      case 'EXPIRED_TOKEN':
      case 'OTP_EXPIRED':
      case 'INVALID_TOKEN':
        return <AlertTriangle size={48} color="#F59E0B" />;
      case 'ACCESS_DENIED':
        return <XCircle size={48} color="#EF4444" />;
      default:
        return <XCircle size={48} color="#EF4444" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'EXPIRED_TOKEN':
      case 'OTP_EXPIRED':
        return 'Link Expired';
      case 'INVALID_TOKEN':
        return 'Invalid Link';
      case 'ACCESS_DENIED':
        return 'Access Denied';
      case 'MISSING_PARAMS':
        return 'Invalid Link';
      default:
        return 'Confirmation Failed';
    }
  };

  return (
    <View className="items-center justify-center py-8 px-6">
      <View className="mb-4">
        {getErrorIcon()}
      </View>
      
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {getErrorTitle()}
      </Text>
      
      <Text className="text-base text-gray-600 text-center mb-6 leading-6">
        {error}
      </Text>
      
      <View className="w-full space-y-3">
        {/* Primary action based on error type */}
        {errorType === 'NETWORK_ERROR' && onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-green-500 py-3 px-6 rounded-lg active:bg-green-600"
          >
            <Text className="text-white font-medium text-center text-base">
              Try Again
            </Text>
          </Pressable>
        )}
        
        {(errorType === 'EXPIRED_TOKEN' || errorType === 'OTP_EXPIRED' || errorType === 'INVALID_TOKEN' || errorType === 'ACCESS_DENIED') && onResendEmail && (
          <Pressable
            onPress={onResendEmail}
            className="bg-blue-500 py-3 px-6 rounded-lg active:bg-blue-600"
          >
            <View className="flex-row items-center justify-center space-x-2">
              <Mail size={18} color="white" />
              <Text className="text-white font-medium text-base">
                {errorType === 'OTP_EXPIRED' ? 'Request New Confirmation Email' : 'Resend Confirmation Email'}
              </Text>
            </View>
          </Pressable>
        )}
        
        {/* Secondary actions */}
        {onManualEntry && (
          <Pressable
            onPress={onManualEntry}
            className="border border-gray-300 py-3 px-6 rounded-lg active:bg-gray-50"
          >
            <Text className="text-gray-700 font-medium text-center text-base">
              Enter Confirmation Code Manually
            </Text>
          </Pressable>
        )}
        
        {onContactSupport && (
          <Pressable
            onPress={onContactSupport}
            className="py-2 px-4 active:bg-gray-50 rounded"
          >
            <Text className="text-blue-500 text-center text-sm underline">
              Contact Support
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface SuccessStateProps {
  userEmail?: string;
  onContinue: () => void;
  showAnimation?: boolean;
}

export function SuccessState({ userEmail, onContinue, showAnimation = true }: SuccessStateProps) {
  const [animationComplete, setAnimationComplete] = React.useState(!showAnimation);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showAnimation) {
      // Animate the checkmark
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setAnimationComplete(true);
      });
    }
  }, [showAnimation, scaleAnim, fadeAnim]);

  return (
    <View className="items-center justify-center py-8 px-6">
      {showAnimation ? (
        <Animated.View 
          style={{ transform: [{ scale: scaleAnim }] }}
          className="mb-6"
        >
          <CheckCircle size={64} color="#10B981" />
        </Animated.View>
      ) : (
        <View className="mb-6">
          <CheckCircle size={64} color="#10B981" />
        </View>
      )}
      
      <Animated.View 
        style={{ opacity: showAnimation ? fadeAnim : 1 }}
        className="items-center"
      >
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Email Confirmed!
        </Text>
        
        <Text className="text-base text-gray-600 text-center mb-2">
          Welcome to Labaku! Your email has been successfully verified.
        </Text>
        
        {userEmail && (
          <Text className="text-sm text-green-600 text-center mb-6 font-medium">
            {userEmail}
          </Text>
        )}
        
        <Text className="text-sm text-gray-500 text-center mb-8">
          You can now access all features of your account.
        </Text>
      </Animated.View>
      
      {animationComplete && (
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="w-full"
        >
          <Pressable
            onPress={onContinue}
            className="bg-green-500 py-4 px-8 rounded-lg active:bg-green-600 shadow-sm"
          >
            <Text className="text-white font-semibold text-center text-lg">
              Continue to App
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

interface ManualEntryProps {
  onSubmit: (token: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ManualEntryForm({ onSubmit, onCancel, isLoading }: ManualEntryProps) {
  const [token, setToken] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = () => {
    if (!token.trim()) {
      setError('Please enter a confirmation token');
      return;
    }
    
    if (token.length < 10) {
      setError('Token appears to be too short');
      return;
    }
    
    setError('');
    onSubmit(token.trim());
  };

  return (
    <View className="py-6 px-6">
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
        Manual Confirmation
      </Text>
      
      <Text className="text-sm text-gray-600 text-center mb-6">
        If the automatic confirmation failed, you can paste the confirmation token from your email here.
      </Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Confirmation Token
        </Text>
        
        <View className="border border-gray-300 rounded-lg">
          <TextInput
            className="px-3 py-3 text-base"
            placeholder="Paste your confirmation token here..."
            value={token}
            onChangeText={(text) => {
              setToken(text);
              setError('');
            }}
            multiline
            numberOfLines={3}
            style={{ textAlignVertical: 'top' }}
          />
        </View>
        
        {error && (
          <Text className="text-red-500 text-sm mt-1">
            {error}
          </Text>
        )}
      </View>
      
      <View className="space-y-3">
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className={`py-3 px-6 rounded-lg ${
            isLoading ? 'bg-gray-400' : 'bg-green-500 active:bg-green-600'
          }`}
        >
          <Text className="text-white font-medium text-center text-base">
            {isLoading ? 'Confirming...' : 'Confirm Email'}
          </Text>
        </Pressable>
        
        <Pressable
          onPress={onCancel}
          disabled={isLoading}
          className="border border-gray-300 py-3 px-6 rounded-lg active:bg-gray-50"
        >
          <Text className="text-gray-700 font-medium text-center text-base">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface ResendEmailProps {
  onResend: (email: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  cooldownSeconds?: number;
}

export function ResendEmailForm({ onResend, onCancel, isLoading, cooldownSeconds }: ResendEmailProps) {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [countdown, setCountdown] = React.useState(cooldownSeconds || 0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    onResend(email.trim());
    setCountdown(60); // Set 60 second cooldown
  };

  const canResend = countdown === 0 && !isLoading;

  return (
    <View className="py-6 px-6">
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
        Resend Confirmation Email
      </Text>
      
      <Text className="text-sm text-gray-600 text-center mb-6">
        Enter your email address to receive a new confirmation email.
      </Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Email Address
        </Text>
        
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-3 text-base"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {error && (
          <Text className="text-red-500 text-sm mt-1">
            {error}
          </Text>
        )}
      </View>
      
      <View className="space-y-3">
        <Pressable
          onPress={handleSubmit}
          disabled={!canResend}
          className={`py-3 px-6 rounded-lg ${
            !canResend ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          <View className="flex-row items-center justify-center space-x-2">
            <Mail size={18} color="white" />
            <Text className="text-white font-medium text-base">
              {isLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            </Text>
          </View>
        </Pressable>
        
        <Pressable
          onPress={onCancel}
          disabled={isLoading}
          className="border border-gray-300 py-3 px-6 rounded-lg active:bg-gray-50"
        >
          <Text className="text-gray-700 font-medium text-center text-base">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}