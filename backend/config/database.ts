import mongoose from "mongoose";

async function connect(): Promise<void> {
  try {
    await mongoose.connect(process.env.DATABASE_URI as string);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

export default connect;
