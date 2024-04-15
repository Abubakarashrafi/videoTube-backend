const mongoose = require("mongoose");

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGOURI}/${process.env.DBNAME}`)
        console.log(`MongoDB connected!! DB Host ${connectionInstance.connection.host}`); 
    } catch (error) {
        console.log("Database connection error",error);
        process.exit(1);
    }
}

module.exports = connectDB;