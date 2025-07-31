import { supabase } from '../supabase/client';
import { useAuthStore } from '../stores/authStore';

export interface DeepLinkParams {
  access_token?: string;
  refresh_token?: string;
  token?: string; // For Supabase verification URLs
  type?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
  redirect_to?: string; // For handling redirect URLs
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: 'MISSING_PARAMS' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'OTP_EXPIRED' | 'ACCESS_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN';
}

export interface ConfirmationResult {
  success: boolean;
  session?: any;
  error?: string;
  errorType?: 'MISSING_PARAMS' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'OTP_EXPIRED' | 'ACCESS_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN';
}

/**
 * Deep Link Handler for Email Confirmation
 * Centralizes URL parameter validation and processing
 */
export class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private confirmationAttempts: Map<string, number> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  /**
   * Convert Supabase verification URL to mobile deep link format
   */
  convertSupabaseUrlToDeepLink(url: string): string {
    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;
      
      // Extract parameters from Supabase verification URL
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const redirectTo = searchParams.get('redirect_to');
      
      // Build mobile deep link URL
      const deepLinkUrl = new URL('labaku://auth/confirm');
      
      if (token) deepLinkUrl.searchParams.set('token', token);
      if (type) deepLinkUrl.searchParams.set('type', type);
      if (redirectTo) deepLinkUrl.searchParams.set('redirect_to', redirectTo);
      
      console.log('🔄 Converted Supabase URL to deep link:', deepLinkUrl.toString());
      return deepLinkUrl.toString();
    } catch (error) {
      console.error('❌ Failed to convert Supabase URL:', error);
      return url; // Return original URL if conversion fails
    }
  }

  /**
   * Validate URL parameters for email confirmation
   */
  validateParams(params: DeepLinkParams): ValidationResult {
    console.log('🔍 Validating deep link parameters:', { ...params, access_token: params.access_token ? '[REDACTED]' : undefined });

    // Check for error parameters first
    if (params.error) {
      console.error('❌ Deep link contains error:', params.error, params.error_code, params.error_description);
      
      // Handle specific error codes
      let errorType: ValidationResult['errorType'] = 'INVALID_TOKEN';
      let errorMessage = params.error_description || params.error;
      
      if (params.error_code === 'otp_expired' || params.error === 'access_denied') {
        errorType = 'OTP_EXPIRED';
        errorMessage = 'Your email confirmation link has expired. Please request a new confirmation email to continue.';
      } else if (params.error === 'access_denied') {
        errorType = 'ACCESS_DENIED';
        errorMessage = 'Access was denied. Please try the confirmation process again or contact support.';
      } else if (params.error_description) {
        // Decode URL-encoded error description
        errorMessage = decodeURIComponent(params.error_description.replace(/\+/g, ' '));
      }
      
      return {
        isValid: false,
        error: errorMessage,
        errorType
      };
    }

    // Validate required parameters for signup confirmation
    if (params.type === 'signup') {
      // Handle both token-based (Supabase verification) and session-based confirmation
      const hasSessionTokens = params.access_token && params.refresh_token;
      const hasVerificationToken = params.token;
      
      if (!hasSessionTokens && !hasVerificationToken) {
        console.error('❌ Missing required tokens for signup confirmation');
        return {
          isValid: false,
          error: 'Missing authentication tokens. Please try signing up again.',
          errorType: 'MISSING_PARAMS'
        };
      }

      // Basic token format validation for session tokens
      if (hasSessionTokens) {
        if (!this.isValidTokenFormat(params.access_token!) || !this.isValidTokenFormat(params.refresh_token!)) {
          console.error('❌ Invalid session token format detected');
          return {
            isValid: false,
            error: 'Invalid authentication tokens. Please try signing up again.',
            errorType: 'INVALID_TOKEN'
          };
        }
      }
      
      // Basic validation for verification token
      if (hasVerificationToken && params.token!.length < 10) {
        console.error('❌ Invalid verification token format detected');
        return {
          isValid: false,
          error: 'Invalid verification token. Please try signing up again.',
          errorType: 'INVALID_TOKEN'
        };
      }
    }

    // Check for other confirmation types
    if (!params.type) {
      console.error('❌ Missing confirmation type parameter');
      return {
        isValid: false,
        error: 'Invalid confirmation link. Please check your email and try again.',
        errorType: 'MISSING_PARAMS'
      };
    }

    console.log('✅ Deep link parameters validation passed');
    return { isValid: true };
  }

  /**
   * Basic token format validation
   */
  private isValidTokenFormat(token: string): boolean {
    // JWT tokens should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Check rate limiting for confirmation attempts
   */
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.confirmationAttempts.get(identifier) || 0;
    
    if (attempts >= this.MAX_ATTEMPTS) {
      console.warn('⚠️ Rate limit exceeded for confirmation attempts');
      return false;
    }
    
    return true;
  }

  /**
   * Record confirmation attempt
   */
  private recordAttempt(identifier: string): void {
    const current = this.confirmationAttempts.get(identifier) || 0;
    this.confirmationAttempts.set(identifier, current + 1);
    
    // Clean up old attempts after rate limit window
    setTimeout(() => {
      this.confirmationAttempts.delete(identifier);
    }, this.RATE_LIMIT_WINDOW);
  }

  /**
   * Process email confirmation with comprehensive error handling
   */
  async processConfirmation(params: DeepLinkParams): Promise<ConfirmationResult> {
    try {
      console.log('🔄 Processing email confirmation...');
      
      // Validate parameters first
      const validation = this.validateParams(params);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          errorType: validation.errorType
        };
      }

      // Check rate limiting
      const identifier = params.access_token?.substring(0, 10) || 'unknown';
      if (!this.checkRateLimit(identifier)) {
        return {
          success: false,
          error: 'Too many confirmation attempts. Please wait a few minutes and try again.',
          errorType: 'NETWORK_ERROR'
        };
      }

      // Record this attempt
      this.recordAttempt(identifier);

      // Process based on confirmation type and available tokens
      if (params.type === 'signup') {
        // Handle session-based confirmation (access_token + refresh_token)
        if (params.access_token && params.refresh_token) {
          return await this.processSignupConfirmation(params.access_token, params.refresh_token);
        }
        
        // Handle verification token-based confirmation
        if (params.token) {
          return await this.processVerificationTokenConfirmation(params.token, params.type);
        }
      }

      return {
        success: false,
        error: 'Unsupported confirmation type or missing required parameters.',
        errorType: 'INVALID_TOKEN'
      };

    } catch (error) {
      console.error('❌ Unexpected error during confirmation processing:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        errorType: 'UNKNOWN'
      };
    }
  }

  /**
   * Process verification token confirmation (for Supabase verification URLs)
   */
  private async processVerificationTokenConfirmation(token: string, type: string): Promise<ConfirmationResult> {
    try {
      console.log('🔄 Processing verification token confirmation...');
      
      // Use Supabase's verifyOtp method for token-based verification
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any // 'signup', 'email_change', etc.
      });

      if (error) {
        console.error('❌ Supabase verification error:', error.message);
        
        // Categorize the error
        let errorType: ConfirmationResult['errorType'] = 'UNKNOWN';
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          errorType = 'EXPIRED_TOKEN';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'NETWORK_ERROR';
        }
        
        return {
          success: false,
          error: this.getErrorMessage(error.message),
          errorType
        };
      }

      if (!data.session) {
        console.error('❌ No session created despite successful token verification');
        return {
          success: false,
          error: 'Failed to create user session. Please try signing up again.',
          errorType: 'INVALID_TOKEN'
        };
      }

      console.log('✅ Verification token confirmation successful for user:', data.session.user?.email);
      
      // Update the auth store with the new session
      const authStore = useAuthStore.getState();
      authStore.setSession(data.session);
      
      return {
        success: true,
        session: data.session
      };

    } catch (error) {
      console.error('❌ Network or unexpected error during verification:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        errorType: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Process signup confirmation with token validation
   */
  private async processSignupConfirmation(accessToken: string, refreshToken: string): Promise<ConfirmationResult> {
    try {
      console.log('🔄 Setting Supabase session with confirmation tokens...');
      
      // Set the session with the tokens from the confirmation link
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('❌ Supabase session error:', error.message);
        
        // Categorize the error
        let errorType: ConfirmationResult['errorType'] = 'UNKNOWN';
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          errorType = 'EXPIRED_TOKEN';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'NETWORK_ERROR';
        }
        
        return {
          success: false,
          error: this.getErrorMessage(error.message),
          errorType
        };
      }

      if (!data.session) {
        console.error('❌ No session created despite successful token validation');
        return {
          success: false,
          error: 'Failed to create user session. Please try signing up again.',
          errorType: 'INVALID_TOKEN'
        };
      }

      console.log('✅ Email confirmation successful for user:', data.session.user?.email);
      
      // Update the auth store with the new session
      const authStore = useAuthStore.getState();
      authStore.setSession(data.session);
      
      return {
        success: true,
        session: data.session
      };

    } catch (error) {
      console.error('❌ Network or unexpected error during confirmation:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        errorType: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(originalError: string): string {
    const errorMap: Record<string, string> = {
      'expired': 'This confirmation link has expired. Please sign up again to receive a new confirmation email.',
      'otp_expired': 'Your email confirmation link has expired. Please request a new confirmation email to continue.',
      'invalid': 'This confirmation link is invalid. Please sign up again to receive a new confirmation email.',
      'access_denied': 'Access was denied. Please try the confirmation process again or contact support.',
      'already_confirmed': 'Your email has already been confirmed. You can now sign in to your account.',
      'network': 'Network error. Please check your internet connection and try again.',
      'fetch': 'Connection error. Please check your internet connection and try again.'
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (originalError.toLowerCase().includes(key)) {
        return message;
      }
    }

    return 'An error occurred during email confirmation. Please try again or contact support if the problem persists.';
  }

  /**
   * Resend confirmation email
   */
  async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Resending confirmation email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'labaku://auth/confirm'
        }
      });

      if (error) {
        console.error('❌ Error resending confirmation email:', error.message);
        return {
          success: false,
          error: 'Failed to resend confirmation email. Please try again later.'
        };
      }

      console.log('✅ Confirmation email resent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error resending email:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }
}

// Export singleton instance
export const deepLinkHandler = DeepLinkHandler.getInstance();