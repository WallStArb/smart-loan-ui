import React from 'react';
import { Shield, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real app, you'd have actual validation
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            FIS SMARTLOAN
          </h1>
          <p className="text-slate-400 text-sm mt-2">Securities Lending Platform</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-600">
              Please sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email-address" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg",
                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      "placeholder:text-slate-400 text-slate-900",
                      "transition-all duration-200"
                    )}
                    placeholder="Enter your email address"
                    defaultValue="test@fisglobal.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg",
                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                      "placeholder:text-slate-400 text-slate-900",
                      "transition-all duration-200"
                    )}
                    placeholder="Enter your password"
                    defaultValue="password"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>

                <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto">
                  Forgot password?
                </Button>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </form>

            {/* Demo Note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                <strong>Demo Environment:</strong> Use the prefilled credentials to sign in
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-xs">
            © 2024 FIS Global. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Smart Loan Securities Lending Platform v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 