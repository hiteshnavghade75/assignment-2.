const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Post = require("./Model/model.post")
const User = require('./Model/model.user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authMiddleware = require('./Middleware/auth')
const app = express();

require('dotenv').config()

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}))

mongoose.connect(process.env.DB_URL)
.then(() => {
    console.log("Connected to mongodb")
})
.catch(err => {
    console.log("Failed to connect to mongodb")
})

app.post("/register",(req,res)=>{
    let userInfo=req.body;
    bcrypt.hash(userInfo.password,10)
    .then((encryptedPassword)=>{
        let newUser = new User({
            name : userInfo.name,
            email : userInfo.email,
            password : encryptedPassword
        })

        newUser.save()
        .then(data=>{
            res.json({
                status:"Success",
                data:data
            })
        })
        .catch(err=>{
            res.json({
                status:"error",
                message:err.message
            })  
        })
    })
});

app.post('/login', (req, res) => {
    const userInfo = req.body;
    User.findOne({ email: userInfo.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: "Authentication failed. User not found."
                });
            }
            bcrypt.compare(userInfo.password, user.password)
                .then(authStatus => {
                    if (authStatus) {
                        const token = jwt.sign(
                            { email: user.email, id: user._id },
                            process.env.PASSWORD,
                            { expiresIn: "1h" }
                        );
                        return res.json({
                            status: "success",
                            token: token
                        });
                    } else {
                        return res.status(401).json({
                            message: "Incorrect password."
                        });
                    }
                })
                .catch(err => {
                    return res.status(500).json({
                        message: "Authentication failed",
                        error: err
                    });
                });
        })
        .catch(err => {
            return res.status(500).json({
                message: "Authentication failed",
                error: err
            });
        });
});

app.get("/posts", authMiddleware, (req,res) => {
    Post.find().then(posts => {
        res.status(200).json({
            posts : posts
        });
    });
});

app.post("/posts", authMiddleware, (req, res) => {
    const postInfo = req.body
    const post = new Post({
        title : postInfo.title,
        body : postInfo.body,
        image : postInfo.image,
        user : req.userId
    })

    post.save().then(newPost => {
        res.status(201).json({
            message : "Post created",
            data : newPost
        })
    })
    .catch(err => {
        res.status(500).json({
            message : "failed",
            error : err
        })
    })
});

app.put('/posts/:postId', authMiddleware, (req, res) => {
    const postId = req.params.postId;
    const updatedPostData = req.body;
    
    Post.findOneAndUpdate({
        _id: postId,
        user: req.userId
    }, updatedPostData)
        .then(updatedPost => {
        if (!updatedPost) {
            return res.status(404).json({
            message: "Post not found."
            });
        }
        res.status(200).json({
            message: "Success",
        });
        })
        .catch(err => {
        res.status(500).json({
            message: "Failed to update post.",
            data: err
        });
        });
});

app.delete('/posts/:postId', authMiddleware, async(req, res) => {
    try{
        const postId = req.params.postId
        console.log(req.userId)

        Post.findById(postId).then(post => {
            if(post.user == req.userId){
                Post.findByIdAndDelete(postId)
                .then(response => {
                    res.status(200).json({
                        message: "Successfully deleted",
                        data: response
                    })
                })
                .catch(err => {
                    res.json({
                        message : "failed to delete"
                    })
                })
            }
            else{
                res.json({
                    message : "post not found"
                })
            }
        })
    }
    catch{
        res.status(500).json({
            message: "Failed to delete!",
        })
    }
});

app.listen(3000, () => {
    console.log("server is running")
});