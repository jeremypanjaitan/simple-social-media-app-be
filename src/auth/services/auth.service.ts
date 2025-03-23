import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { RegisterDTO } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async signIn(email: string, password: string) {
    const user: User | null = await this.userService.findByEmail(email);
    if (
      user == null ||
      email != user.email ||
      !bcrypt.compareSync(password, user?.password_hash)
    ) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(registerDto: RegisterDTO) {
    const existedUser: User | null =
      await this.userService.findByEmailAndUsername(
        registerDto.email,
        registerDto.username,
      );
    if (existedUser) {
      throw new HttpException(
        'Email or username already exists',
        HttpStatus.CONFLICT,
      );
    }
    const user: User = new User();
    user.email = registerDto.email;
    user.username = registerDto.username;
    user.password_hash = bcrypt.hashSync(registerDto.password, 10);
    await this.userService.save(user);
  }
}
