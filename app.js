const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/adoptionDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = "Thisisourlittlesecret";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

const dogSchema = new mongoose.Schema({
    name: String,
    sex: String,
    breed: String,
    age: Number,
    behaviour: String,
    description: String,
    reason: String,

});

const Dog = new mongoose.model("Dog", dogSchema);


const catSchema = new mongoose.Schema({
    name: String,
    sex: String,
    breed: String,
    age: Number,
    behaviour: String,
    description: String,
    reason: String,

});

const Cat = new mongoose.model("Cat", catSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/firstpage", function (req, res) {
    res.render("firstpage");
});

app.post("/register", function (req, res) {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
        .then(() => {
            res.render("firstpage");
        })
        .catch(err => {
            console.log(err);
        });


});

app.get("/makeapost", function (req, res) {
    res.render("makeapost");
});

app.post("/makeapost", function (req, res) {

    if (req.body.typeOfAnimal === "Dog") {
        const newDog = new Dog({
            name: req.body.animalName,
            sex: req.body.sex,
            breed: req.body.breed,
            age: req.body.age,
            behaviour: req.body.behaviour,
            description: req.body.description,
            reason: req.body.reason
        });
        newDog.save()
            .then(() => {
                res.redirect("/dogs"); 
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        const newCat = new Cat({
            name: req.body.animalName,
            sex: req.body.sex,
            breed: req.body.breed,
            age: req.body.age,
            behaviour: req.body.behaviour,
            description: req.body.description,
            reason: req.body.reason
        });
        newCat.save()
            .then(() => {
                res.redirect("/cats"); 
            })
            .catch(err => {
                console.log(err);
            });
    }

});

app.get("/dogs", function (req, res) {
    Dog.find()
        .then(dogs => {
            res.render("dogs", { dogs: dogs });
        })
        .catch(err => {
            console.log(err);
        })
});

app.get("/dogs/:id", function (req, res) {
    const dogId = req.params.id;

    Dog.findById(dogId)
        .then(dog => {
            if (dog) {
                res.render("dogDetail", { dog: dog });
            }
        })
        .catch(err => {
            console.log(err);
        });
});


app.get("/cats", function (req, res) {
    Cat.find()
        .then(cats => {
            res.render("cats", { cats: cats });
        })
        .catch(err => {
            console.log(err);
        })
});

app.get("/cats/:id", function (req, res) {
    const catId = req.params.id;

    Cat.findById(catId)
        .then(cat => {
            if (cat) {
                res.render("catDetail", { cat: cat });
            }
        })
        .catch(err => {
            console.log(err);
        });
});

app.post('/dogs/:id', async (req, res) => {
    const dogId = req.params.id;
  
    try {
      // Search by id
      const dog = await Dog.findById(dogId);
  
      if (!dog) {
        return res.status(404).send('Dog not found.');
      }
  
      // Delete the dog from the database
      await Dog.findByIdAndRemove(dogId);

      res.redirect("/success");
    } catch (error) {
      res.status(500).send('An error occurred while processing the adoption request.');
    }
  });

app.post('/cats/:id', async (req, res) => {
    const catId = req.params.id;
  
    try {
      // Search by id
      const cat = await Cat.findById(catId);
  
      if (!cat) {
        // Daca nu se
        return res.status(404).send('Cat not found.');
      }
  
      // Delete the cat from the database
      await Cat.findByIdAndRemove(catId);

      res.redirect("/success");
    } catch (error) {
      res.status(500).send('An error occurred while processing the adoption request.');
    }
  });
  


app.get("/makeapost", function (req, res) {
    res.render("makeapost");
});

app.get("/success", function (req, res) {
    res.render("success");
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username })
        .then((foundUser) => {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("firstpage");
                }
            }
        })
        .catch(err => {
            console.log(err);
        });

});




app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});


