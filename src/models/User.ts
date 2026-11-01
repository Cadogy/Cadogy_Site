import { model, models, Schema, type Model, type Types } from "mongoose"

export type UserDoc = {
  _id: Types.ObjectId
  name?: string
  email: string
  emailVerified?: Date | null
  image?: string
  password?: string
  role: "user" | "admin"
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDoc>(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Date, default: null },
    image: String,
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Partial<UserDoc>) => {
        delete ret.password
        return ret
      },
    },
  }
)

export const User: Model<UserDoc> =
  models.User ?? model<UserDoc>("User", userSchema)
