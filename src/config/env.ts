import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  pgHost: process.env.PGHOST,
  pgPort: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  pgUser: process.env.PGUSER,
  pgPassword: process.env.PGPASSWORD,
  pgDatabase: process.env.PGDATABASE
};
