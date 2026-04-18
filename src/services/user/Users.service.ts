import crypto from "crypto";
import bcrypt from "bcrypt";
import { user } from "@resitdc/hayuah-models";
import { NotFoundError, BadRequestError } from "@utils/errors";
import { Page, QueryBuilder, Transaction } from "objection";
import { v4 as uuidv4 } from "uuid";
import {
  SendInvitationInput,
  UpdateUserProfileInput,
  UpdatePasswordInput
} from "@root/src/dataTypes";
import { sendDashboardInvitation } from "@utils/helpers";

export interface RegisterUserInput extends Omit<
  CreateUserInput, 
  "password"
> {
  email: string;
  password?: string;
  phone?: string;
}

type UserRelationParams = {
  withEmails?: boolean;
  withPhones?: boolean;
  withSosialMedia?: boolean;
  withActivities?: boolean;
  withSessions?: boolean;
};

type CreateUserInput = Omit<
  user.Users,
  "created_at" | "updated_at" | "deleted_at" | "failed_attempts" | "locked_until" | "verified_at"
>;
type UpdateUserInput = Partial<CreateUserInput>;

interface FindAllUsersOptions {
  limit: number;
  page: number;
  search?: string;
  role?: user.UserRole;
  is_active?: boolean;
  is_reviewer?: boolean;
  sort?: string;
  withEmails?: boolean;
  withPhones?: boolean;
  withSosialMedia?: boolean;
  withSessions?: boolean;
}

export class UsersService {
  async findAll({
    limit,
    page,
    search,
    role,
    is_active,
    is_reviewer,
    sort,
    withEmails,
    withPhones,
    withSosialMedia,
    withSessions,
  }: FindAllUsersOptions): Promise<Page<user.Users>> {
    let query = user.Users.query().whereNull("deleted_at");

    query = query.select(
      "id", "name", "alias", "username", "avatar", "about", 
      "role", "is_reviewer", "is_active", "is_multi_device", 
      "verified_at", "locked_until", "created_at"
    );

    if (search) {
      query = query.where((builder) => {
        builder
          .where("name", "ilike", `%${search}%`)
          .orWhere("username", "ilike", `%${search}%`)
          .orWhere("alias", "ilike", `%${search}%`);
      });
    }

    if (role) query = query.where("role", role);
    if (is_active !== undefined) query = query.where("is_active", is_active);
    if (is_reviewer !== undefined) query = query.where("is_reviewer", is_reviewer);

    if (sort) {
      const [column, direction] = sort.split(":");
      const allowedSortColumns = ["id", "name", "username", "created_at"];
      if (
        allowedSortColumns.includes(column) &&
        ["asc", "desc"].includes(direction.toLowerCase())
      ) {
        query = query.orderBy(column, direction.toUpperCase() as "ASC" | "DESC");
      }
    } else {
      query = query.orderBy("created_at", "DESC");
    }

    const eagerGraph: Record<string, any> = {};
    if (withEmails) eagerGraph.emails = true;
    if (withPhones) eagerGraph.phones = true;
    if (withSosialMedia) eagerGraph.sosialMedia = true;

    if (Object.keys(eagerGraph).length > 0) {
      query = query.withGraphFetched(eagerGraph);
    }

    const usersPage = await query.page(page - 1, limit);

    if (withSessions && usersPage.results.length > 0) {
      const userIds = usersPage.results.map((u) => u.id);
      const sessions = await user.UserSessions.query()
        .whereIn("user_id", userIds)
        .where("revoke", false);

      usersPage.results.forEach((u: any) => {
        u.sessions = sessions.filter((s) => s.user_id === u.id);
      });
    }

    return usersPage;
  }

  async findOne(
    id: string,
    { withEmails, withPhones, withSosialMedia, withActivities, withSessions }: UserRelationParams = {}
  ): Promise<any> {
    let query = user.Users.query()
      .findById(id)
      .whereNull("deleted_at")
      .select(
        "id", "name", "alias", "username", "avatar", "about", 
        "role", "is_reviewer", "is_active", "is_multi_device", 
        "verified_at", "locked_until", "created_at"
      );

    const eagerGraph: Record<string, any> = {};
    if (withEmails) eagerGraph.emails = true;
    if (withPhones) eagerGraph.phones = true;
    if (withSosialMedia) eagerGraph.sosialMedia = true;
    if (withActivities) eagerGraph.activities = true;

    if (Object.keys(eagerGraph).length > 0) {
      query = query.withGraphFetched(eagerGraph);
    }

    const foundUser: any = await query;

    if (!foundUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (withSessions) {
      foundUser.sessions = await user.UserSessions.query()
        .where("user_id", id)
        .orderBy("created_at", "DESC");
    }

    return foundUser;
  }

  async create(data: CreateUserInput, trx?: Transaction): Promise<user.Users> {
    if (data.username) {
      const existingUser = await user.Users.query(trx)
        .where("username", data.username)
        .whereNull("deleted_at")
        .first();
      
      if (existingUser) {
        throw new BadRequestError(`Username '${data.username}' is already taken.`);
      }
    }

    const newUser = await user.Users.query(trx)
      .insert({
        ...data,
        id: data.id || uuidv4(),
      })
      .returning("*");

    delete newUser.password;
    
    return newUser;
  }

  async update(id: string, data: UpdateUserInput, trx?: Transaction): Promise<user.Users> {
    const existingUser = await user.Users.query(trx).findById(id).whereNull("deleted_at");
    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (data.username && data.username !== existingUser.username) {
      const checkUsername = await user.Users.query(trx)
        .where("username", data.username)
        .whereNull("deleted_at")
        .first();
      
      if (checkUsername) {
        throw new BadRequestError(`Username '${data.username}' is already taken.`);
      }
    }

    const updatedUsers = await existingUser.$query(trx).patch(data).returning("*");
    const updatedUser = updatedUsers as unknown as user.Users;
    
    delete updatedUser.password;
    
    return updatedUser;
  }

  async remove(id: string, trx?: Transaction): Promise<{ message: string }> {
    const existingUser = await user.Users.query(trx).findById(id).whereNull("deleted_at");
    if (!existingUser) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    await existingUser.$query(trx).patch({ deleted_at: new Date().toISOString() });
    
    return { message: `User with ID ${id} has been soft-deleted successfully` };
  }

  async sendInvitation(data: SendInvitationInput, trx?: Transaction): Promise<{ message: string }> {
    const existingEmail = await user.UserEmails.query(trx)
      .where("email", data.email)
      .first();

    if (existingEmail) {
      throw new BadRequestError(`Email ${data.email} is already registered.`);
    }

    const plainPassword = crypto.randomBytes(12).toString("base64");
    const hashedPassword = await bcrypt.hash(plainPassword, 13);

    const newUserId = uuidv4();
    await user.Users.query(trx).insert({
      id: newUserId,
      name: data.name,
      password: hashedPassword,
      role: "INTERNAL",
      is_active: true,
    });

    await user.UserEmails.query(trx).insert({
      id: uuidv4(),
      user_id: newUserId,
      email: data.email,
      is_primary: true,
    });

    try {
      await sendDashboardInvitation(data.name, data.email, plainPassword);
    } catch (error) {
      console.log("ERR", error);
      throw new Error(`Failed to send invitation to ${data.email}. Transaction rolled back.`);
    }
    return { message: `Invitation email sent successfully to ${data.email}` };
  }

  async updatePassword(
    userId: string,
    data: UpdatePasswordInput,
    trx?: Transaction
  ): Promise<{ message: string }> {
    const existingUser = await user.Users.query(trx).findById(userId).whereNull("deleted_at");
    if (!existingUser) {
      throw new NotFoundError(`User not found`);
    }

    const isPasswordValid = await bcrypt.compare(data.oldPassword, existingUser.password!);
    if (!isPasswordValid) {
      throw new BadRequestError("Incorrect old password.");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 13);
    await existingUser.$query(trx).patch({ password: hashedPassword });

    return { message: "Password updated successfully." };
  }
  
  async updateAvatar(
    userId: string,
    avatarPath: string,
    trx?: Transaction
  ): Promise<{ message: string; avatar: string }> {
    const existingUser = await user.Users.query(trx).findById(userId).whereNull("deleted_at");
    if (!existingUser) {
      throw new NotFoundError(`User not found`);
    }
    
    await existingUser.$query(trx).patch({ avatar: avatarPath });
    return { message: "Avatar updated successfully.", avatar: avatarPath };
  }
  
  async updateProfile(
    userId: string,
    data: UpdateUserProfileInput,
    trx?: Transaction
  ): Promise<user.Users> {
    const existingUser = await user.Users.query(trx).findById(userId).whereNull("deleted_at");
    if (!existingUser) {
      throw new NotFoundError(`User not found`);
    }

    const updatedUsers = await existingUser.$query(trx).patch(data as UpdateUserInput).returning("*");
    const updatedUser = updatedUsers as unknown as user.Users;
    
    delete updatedUser.password;
    
    return updatedUser;
  }

  async getMe(userId: string) {
    let query = user.Users.query()
      .first()
      .select(
        "id",
        "name",
        "alias",
        "username",
        "avatar",
        "about",
        "role",
        "is_reviewer as isReviewer",
        "is_active as isActive",
        "created_at as createdAt"
      )
      .where({
        id: userId,
        is_active: true,
      })
      .whereNull("deleted_at");

    const eagerGraph = {
      emails: {
        $modify: ["selectEmailFields"],
      },
      phones: {
        $modify: ["selectPhoneFields"],
      },
      sosialMedia: {
        $modify: ["selectSosialFields"],
      },
    };

    const modifiers = {
      selectEmailFields: (builder: QueryBuilder<any>) => {
        builder.select("id", "email", "is_primary as isPrimary", "verified_at as verifiedAt");
      },
      selectPhoneFields: (builder: QueryBuilder<any>) => {
        builder.select("id", "phone", "is_primary as isPrimary", "verified_at as verifiedAt");
      },
      selectSosialFields: (builder: QueryBuilder<any>) => {
        builder.select("id", "sosial", "link");
      },
    };


    if (Object.keys(eagerGraph).length > 0) {
      query = query.withGraphFetched(eagerGraph).modifiers(modifiers);
    }

    const userProfile = await query as unknown as {
      id: string | null;
      name: string | null;
      alias: string | null;
      username: string | null;
      avatar: string | null;
      about: string | null;
      role: string;
      isReviewer: boolean | null;
      isActive: boolean | null;
      createdAt: string | null;
      emails: any;
      phones: any;
      sosialMedia: any;
    };

    if (!userProfile) {
      throw new NotFoundError("User account not found or inactive");
    }

    return userProfile;
  }

  async createUser(data: RegisterUserInput, trx?: Transaction): Promise<any> {
    const transaction = trx || await user.Users.startTransaction();

    try {
      const existingEmail = await user.UserEmails.query(transaction)
        .where("email", data.email)
        .first();

      if (existingEmail) {
        throw new BadRequestError(`Email '${data.email}' is already registered.`);
      }

      if (data.username) {
        const existingUsername = await user.Users.query(transaction)
          .where("username", data.username)
          .whereNull("deleted_at")
          .first();
        
        if (existingUsername) {
          throw new BadRequestError(`Username '${data.username}' is already taken.`);
        }
      }

      let hashedPassword = null;
      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 13);
      }

      const newUserId = uuidv4();
      const newUser = await user.Users.query(transaction)
        .insert({
          id: newUserId,
          name: data.name,
          alias: data.alias,
          username: data.username,
          password: hashedPassword,
          role: data.role || "CUSTOMER",
          is_active: data.is_active !== undefined ? data.is_active : false,
          is_reviewer: data.is_reviewer || false,
          is_multi_device: data.is_multi_device || false,
        })
        .returning("*");

      await user.UserEmails.query(transaction).insert({
        id: uuidv4(),
        user_id: newUserId,
        email: data.email,
        is_primary: true,
      });

      if (data.phone) {
        await user.UserPhones.query(transaction).insert({
          id: uuidv4(),
          user_id: newUserId,
          phone: data.phone,
          is_primary: true,
        });
      }

      if (!trx) await transaction.commit();

      const userResponse = newUser as unknown as user.Users;
      delete userResponse.password;

      return {
        ...userResponse,
        email: data.email,
        phone: data.phone || null
      };

    } catch (error) {
      if (!trx) await transaction.rollback();
      throw error;
    }
  }
}

export default new UsersService();