import { Page, QueryBuilder, Transaction } from "objection";
import { v4 as uuidv4 } from "uuid";
import { guest } from "@resitdc/hayuah-models";
import { NotFoundError, BadRequestError } from "@utils/errors";

type CreateGuestInput = Omit<
  guest.Guests,
  "created_at" | "updated_at"
>;

type UpdateGuestInput = Partial<CreateGuestInput>;

interface FindAllGuestsOptions {
  limit: number;
  page: number;
  event_id?: string;
  search?: string;
  is_partner?: boolean;
  is_vip?: boolean;
  sort?: string;
  withCheckins?: boolean;
}

interface GuestCheckInInput {
  guest_id: string;
  checkin_type: "SCAN" | "MANUAL";
}

export class GuestsService {
  async findAll({
    limit,
    page,
    event_id,
    search,
    is_partner,
    is_vip,
    sort,
    withCheckins,
  }: FindAllGuestsOptions): Promise<Page<guest.Guests>> {
    let query = guest.Guests.query();

    if (event_id) {
      query = query.where("event_id", event_id);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where("name", "ilike", `%${search}%`)
          .orWhere("email", "ilike", `%${search}%`)
          .orWhere("whatsapp", "ilike", `%${search}%`)
          .orWhere("instagram", "ilike", `%${search}%`);
      });
    }

    if (is_partner !== undefined) query = query.where("is_partner", is_partner);
    if (is_vip !== undefined) query = query.where("is_vip", is_vip);

    if (sort) {
      const [column, direction] = sort.split(":");
      const allowedSortColumns = ["name", "created_at", "is_vip"];
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
    if (withCheckins) eagerGraph.checkins = true;

    if (Object.keys(eagerGraph).length > 0) {
      query = query.withGraphFetched(eagerGraph);
    }

    const guestsPage = await query.page(page - 1, limit);
    return guestsPage;
  }

  async findOne(id: string, withCheckins: boolean = false): Promise<guest.Guests> {
    let query = guest.Guests.query().findById(id);

    if (withCheckins) {
      query = query.withGraphFetched("checkins");
    }

    const foundGuest = await query;

    if (!foundGuest) {
      throw new NotFoundError(`Guest with ID ${id} not found`);
    }

    return foundGuest;
  }

  async create(data: CreateGuestInput, trx?: Transaction): Promise<guest.Guests> {
    const newGuestId = data.id || uuidv4();
    
    const qrCodeData = data.qrcode || `QR-${newGuestId}`;

    const newGuest = await guest.Guests.query(trx)
      .insert({
        ...data,
        id: newGuestId,
        qrcode: qrCodeData,
      })
      .returning("*");

    return newGuest;
  }

  async update(id: string, data: UpdateGuestInput, trx?: Transaction): Promise<guest.Guests> {
    const existingGuest = await guest.Guests.query(trx).findById(id);
    
    if (!existingGuest) {
      throw new NotFoundError(`Guest with ID ${id} not found`);
    }

    const updatedGuests = await existingGuest.$query(trx).patch(data).returning("*");
    return updatedGuests as unknown as guest.Guests;
  }

  async remove(id: string, trx?: Transaction): Promise<{ message: string }> {
    const existingGuest = await guest.Guests.query(trx).findById(id);
    
    if (!existingGuest) {
      throw new NotFoundError(`Guest with ID ${id} not found`);
    }

    await existingGuest.$query(trx).delete();
    
    return { message: `Guest with ID ${id} has been deleted successfully` };
  }

  async checkIn(data: GuestCheckInInput, trx?: Transaction): Promise<guest.GuestCheckins> {
    const existingGuest = await guest.Guests.query(trx).findById(data.guest_id);
    if (!existingGuest) {
      throw new NotFoundError(`Guest with ID ${data.guest_id} not found`);
    }

    const existingCheckin = await guest.GuestCheckins.query(trx).where("guest_id", data.guest_id).first();
    if (existingCheckin) throw new BadRequestError("Guest has already checked in");

    const newCheckin = await guest.GuestCheckins.query(trx)
      .insert({
        id: uuidv4(),
        guest_id: data.guest_id,
        checkin_type: data.checkin_type,
      })
      .returning("*");

    return newCheckin;
  }
}

export default new GuestsService();