import type { User } from "@generated/prisma/client.js";
import type { UserResponseDto } from "@dto/user";

export class UserMapper {
  static toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
