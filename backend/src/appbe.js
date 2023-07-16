const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");

const session = require("express-session");

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('104235874270-ua0uodhg1723akrn2bcrv0kdemrldqf4.apps.googleusercontent.com', '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');

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

require("./db/conn");
const Register = require("./models/registers");

// Configure passport
passport.use(
    new GoogleStrategy(
      {
        clientID: "104235874270-ua0uodhg1723akrn2bcrv0kdemrldqf4.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        // This callback function will be called when the user is authenticated with Google
        try {
          // Check if the user already exists in the database
          const user = await Register.findOne({ email: profile.emails[0].value });
          if (user) {
            // If user already exists, return the user
            done(null, user);
          } else {
            // If user does not exist, create a new user in the database
            const newUser = new Register({
              firstname: profile.name.givenName,
              lastname: profile.name.familyName,
              email: profile.emails[0].value,
              password: "um", // Set a dummy password for Google authenticated users
            });
            const savedUser = await newUser.save();
            done(null, savedUser);
          }
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
  
  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    Register.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));

app.use(
    session({
      secret: "Summer2023",
      resave: true,
      saveUninitialized: true,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("indexbe")
});

app.get('/index', (req, res) => {
    // Render the index.hbs file
    res.render('index');
  });

app.get("/register", (req, res)=> {
    res.render("register");
})

app.post("/register", async (req, res)=> {
    try {

        const registerPerson = new Register({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: req.body.password
        })
    const registerd = await registerPerson.save();
    res.status(201).render("index");

    } catch (error) {
        res.status(400).send(error);
    }
})

app.get("/login", (req, res)=> {
    res.render("login");
})

app.post("/login", async (req, res)=> {
    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const useremail = await Register.findOne({email:email});
        
        if (useremail.password === password) {
            res.status(201).render("index");
        } else {
            res.send("password is incorrect");
        }

    } catch (error) {
        res.status(400).send("invalid email")
    }
})

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  
  // Callback route for Google authentication
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/register" }),
    (req, res) => {
      // Successful authentication, redirect to the home page
      res.redirect("/index");
    }
  );

app.post('/google-login', async (req, res) => {
    const { id_token } = req.body;
  
    try {
      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: '104235874270-ua0uodhg1723akrn2bcrv0kdemrldqf4.apps.googleusercontent.com', // Replace with your actual client ID
      });
  
      const payload = ticket.getPayload();
      const { sub, email, name } = payload;
  
      res.redirect('/index'); // Redirect to the dashboard or desired page after successful authentication
    } catch (error) {
      console.error('Error verifying Google ID token:', error);
      res.status(400).send('Invalid ID token');
    }
  });
  

app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
