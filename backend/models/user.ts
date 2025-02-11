import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  refresh_token?: string;
  full_name: string;
  id: string;
}

const UserSchema: MongooseSchema<IUser> = new MongooseSchema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate: [
        (val: string) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(val),
      ],
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refresh_token: String,
  },
  {
    virtuals: {
      full_name: {
        get() {
          return this.first_name + ' ' + this.last_name;
        },
      },
      id: {
        get() {
          return this._id;
        },
      },
    },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model<IUser>('user', UserSchema);

