import type { Prisma, PrismaClient, User } from "@generated/prisma/client.js";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds a user by email.
   * @param email - User email
   * @returns Matching user or null when not found
   */
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Creates a new user.
   * @param data - Prisma UserCreateInput
   * @returns The created User record
   */
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      },
    });
  }
}
