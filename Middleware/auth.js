const { request } = require("express");
const jwt = require("jsonwebtoken")


module.exports = (req, res, next) => {
    try{
        const token = req.headers.authorization;
        const verifiedToken = jwt.verify(token, "10X_ACADEMY")
        req.userId = verifiedToken.id;
        next();
    }
    catch{
        res.json({
            message : "Authorization failed"
        })
    }
}

