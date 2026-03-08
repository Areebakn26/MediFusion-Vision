const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

let sequelize;

// If a full DATABASE_URL is provided (like from Neon), use it
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false, // Set to console.log to see SQL queries
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Neon and many managed DBs
            }
        }
    });
} else {
    // Fallback to individual local environment variables
    sequelize = new Sequelize(
        process.env.DB_NAME || 'medifusionvision',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'postgres',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false,
        }
    );
}

module.exports = sequelize;
