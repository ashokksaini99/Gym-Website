const jwt = require('jsonwebtoken');
const user = require("../app");

const auth = async (req, res, next) => {
    try {
        const Token = req.cookies.jwt;
        console.log(Token);
        const verifyUser = jwt.verify(Token, process.env.SECRET_KEY);
        console.log(verifyUser);
        next();
    } catch (error) {
        res.status(401).redirect("/login");
    }
}


module.exports = auth;