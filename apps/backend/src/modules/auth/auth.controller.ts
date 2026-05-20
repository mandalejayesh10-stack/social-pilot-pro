import {
  Controller, Post, Get, Body, Query,
  Res, UseGuards, HttpCode, HttpStatus, Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './providers/google-oauth.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleOAuth: GoogleOAuthService,
    private tokenService: TokenService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register with email + password' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setTokenCookie(res, (result as any).token);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email + password' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setTokenCookie(res, (result as any).token);
    return result;
  }

  @Public()
  @Get('google/status')
  @ApiOperation({ summary: 'Check if Google OAuth is configured' })
  googleStatus() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
    return {
      configured: this.googleOAuth.isConfigured(),
      account: 'mandalejayesh10@gmail.com',
      redirectUri: `${backendUrl}/api/auth/google/callback`,
      addToGoogleConsole: [
        `${backendUrl}/api/auth/google/callback`,
        `http://localhost:3000/api/auth/google/callback`,
      ],
    };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleAuth(@Res() res: Response) {    if (!this.googleOAuth.isConfigured()) {
      // Return a helpful HTML error page instead of crashing
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Google OAuth Not Configured</title>
        <style>
          body { font-family: system-ui; background: #0f0f1a; color: #f0f0ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #16162a; border: 1px solid #2a2a45; border-radius: 16px; padding: 40px; max-width: 520px; }
          h1 { color: #ef4444; margin-top: 0; }
          code { background: #1a1a30; padding: 2px 8px; border-radius: 4px; font-family: monospace; color: #818cf8; }
          .step { margin: 8px 0; padding: 8px 12px; background: #1a1a30; border-radius: 8px; font-size: 14px; }
          a { color: #818cf8; }
          .back { display: inline-block; margin-top: 20px; background: #6366f1; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; }
        </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ Google OAuth Not Configured</h1>
            <p>The <code>GOOGLE_CLIENT_ID</code> is missing from your <code>.env</code> file.</p>
            <p><strong>To fix this:</strong></p>
            <div class="step">1. Go to <a href="https://console.cloud.google.com" target="_blank">console.cloud.google.com</a></div>
            <div class="step">2. Create a project → APIs & Services → Credentials</div>
            <div class="step">3. Create OAuth 2.0 Client ID (Web application type)</div>
            <div class="step">4. Add Authorized redirect URI:<br><code>${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000'}/api/auth/google/callback</code></div>
            <div class="step">5. Add to your <code>.env</code> file:<br>
              <code>GOOGLE_CLIENT_ID=your_client_id</code><br>
              <code>GOOGLE_CLIENT_SECRET=your_client_secret</code>
            </div>
            <div class="step">6. Restart the backend server</div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" class="back">← Back to Login</a>
          </div>
        </body>
        </html>
      `);
    }

    const url = this.googleOAuth.getAuthUrl();
    res.redirect(url);
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const googleUser = await this.googleOAuth.exchangeCode(code);
      const result = await this.authService.googleAuth(googleUser) as any;
      this.setTokenCookie(res, result.token);
      // Also pass token in URL fragment so frontend can store it in localStorage
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}`);
    } catch (err: any) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`);
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }

  private setTokenCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
