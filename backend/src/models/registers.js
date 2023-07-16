const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema( {
    fistname: {
        type:String,
        require:true
    },
    lastname: {
        type:String,
        require:true
    },
    email: {
        type:String,
        require:true,
        unique:true
    },
    password: {
        type:String,
        require:true
    }
})

const Register = new mongoose.model("Register", registerSchema);

module.exports = Register;