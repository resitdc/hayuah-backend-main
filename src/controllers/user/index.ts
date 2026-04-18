import { Request, Response } from "express";
import { errorResponseOld } from "@utils/response";
import { user as userSchema } from "@resitdc/hayuah-models";

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser?.sub)
      return res.status(401).json(errorResponseOld("UNAUTHENTICATED"));

    const user = await 
      userSchema.Users.query().select(
        "users.id",
        "users.name",
        "users.alias",
        "users.username",
        "users.avatar",
        "users.about",
        "users.role",
        "users.is_reviewer as isReviewer",
        "users.is_active as isActive",
        "users.created_at as createdAt",
      )
      .where({
        "users.id": req.currentUser.sub,
        "users.is_active": true
      })
      .withGraphFetched("emails")
      .modifyGraph("emails",
        (builder) => {
          builder
            .select(
              "id",
              "email",
              "is_primary as isPrimary",
              "verified_at as verifiedAt"
            )
        }
      )
      .withGraphFetched("phones")
      .modifyGraph("phones",
        (builder) => {
          builder
            .select(
              "id",
              "phone",
              "is_primary as isPrimary",
              "verified_at as verifiedAt"
            )
        }
      )
      .withGraphFetched("sosialMedia")
      .modifyGraph("sosialMedia",
        (builder) => {
          builder
            .select(
              "id",
              "sosial",
              "link"
            )
        }
      )
      .whereNull("deleted_at")
      .first() as unknown as {
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

    if (!user)
      return res.status(404).json(errorResponseOld("USER NOT FOUND"));

    return res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.log("ERROR GET ME : ", err);
    return res.status(500).json(errorResponseOld("INTERNAL ERROR"));
  }
};
