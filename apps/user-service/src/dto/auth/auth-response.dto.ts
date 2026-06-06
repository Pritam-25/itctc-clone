import type { UserResponseDto } from "@dto/user";

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
