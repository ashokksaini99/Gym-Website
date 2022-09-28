const mongoose = require('mongoose');

const connectDB = async (DATABASE_URL) => {
    try {
        const DB_OPTIONS = {
            dbName: "Gym"
        }
        await mongoose.connect(DATABASE_URL, DB_OPTIONS, { useNewUrlParser: true });
        console.log("Database connected successfully.");
    } catch (error) {
        console.log(error);
    }
}
module.exports = connectDB