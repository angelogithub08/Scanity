import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { RecoveryPasswordDto } from './dto/recovery-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

@ApiTags('Auth')
@ApiBearerAuth('defaultBearerAuth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('verify-2fa')
  @ApiResponse({
    status: 200,
    description:
      'Confirma o login com o código de 6 dígitos enviado por e-mail.',
  })
  verifyTwoFactor(@Body() verifyDto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactor(verifyDto);
  }

  @Get('me')
  me(@Req() request: Request) {
    return this.authService.me(request);
  }

  @Public()
  @Post('recovery-password')
  @ApiResponse({
    status: 204,
    description:
      'Solicita uma nova senha a partir do e-mail de um usuário cadastrado no sistema.',
  })
  @HttpCode(204)
  async recoveryPassword(@Body() recoveryPasswordDto: RecoveryPasswordDto) {
    await this.authService.recoveryPassword(recoveryPasswordDto);
  }

  @Public()
  @Post('new-password')
  @ApiResponse({
    status: 204,
    description: 'Atualiza a senha caso o token seja válido.',
  })
  @HttpCode(204)
  async newPassword(@Body() newPasswordDto: NewPasswordDto) {
    await this.authService.newPassword(newPasswordDto);
  }

  @Public()
  @Post('refresh')
  @ApiResponse({
    status: 200,
    description: 'Renova o access token usando um refresh token válido.',
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
