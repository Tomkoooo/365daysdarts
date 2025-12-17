import mongoose, { Schema, model, models } from 'mongoose';

export type UserRole = 'student' | 'lecturer' | 'business' | 'admin';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'business', 'admin'],
    default: 'student',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'past_due'],
    default: 'inactive',
  },
  subscriptionId: { type: String }, // Stripe subscription ID
  customerId: { type: String }, // Stripe customer ID
  progress: { type: Map, of: Object }, // Store course progress (courseId -> data)
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
