const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const https = require("https");
const config = require("./config");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


mongoose.connect("mongodb://localhost:27017/adoptionDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    phone: String
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
    const cityName = "Satu Mare";
    const apiKey = config.apiKey;
    const units = "metric";
    const url =
        "https://api.openweathermap.org/data/2.5/weather?q=" +
        cityName +
        "&units=" +
        units +
        "&appid=" +
        apiKey;

    https.get(url, function (response) {
        response.on("data", function (data) {
            const weatherData = JSON.parse(data);
            const temp = weatherData.main.temp;
            const weatherDescription = weatherData.weather[0].description;
            const icon = weatherData.weather[0].icon;
            const imgURL =
                "https://openweathermap.org/img/wn/" + icon + "@2x.png";
            const name = weatherData.name;

            res.render("home", {
                cityName: name,
                temperature: temp,
                weatherDescription: weatherDescription,
                iconURL: imgURL,
            });
        });
    });
});



app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username })
        .then((foundUser) => {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("firstpage");
                } else {
                    res.render("advertisement", { message: "Incorrect password. Please try again." });
                }
            } else {
                res.render("advertisement", { message: "User not found. Please register an account if you haven't done it yet or try again." });
            }
        })
        .catch((err) => {
            console.log(err);
            res.render("advertisement", { message: "An error occurred. Please try again later." });
        });
});



app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save()
        .then(() => {
            res.redirect("firstpage");
        })
        .catch(err => {
            console.log(err);
        });


});



app.get("/firstpage", function (req, res) {
    res.render("firstpage");
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
    const breedQuery = req.query.breed; // Get the breed query parameter from the request

    // Create a search query based on the breed parameter
    const searchQuery = breedQuery ? { breed: breedQuery } : {};

    Dog.find(searchQuery)
        .then(dogs => {
            const successMessage = req.query.success === 'true' ? "Our team has received your request and will get in touch with you soon." : "";
            res.render("dogs", { dogs: dogs, successMessage: successMessage });
        })
        .catch(err => {
            console.log(err);
        });
});


app.post("/dogs", function (req, res) {
    const email = req.body.email;
    const phone = req.body.phone;

    User.findOne({ email })
        .then((foundUser) => {
            if (foundUser) {
                // Save the phone number of the user
                foundUser.phone = phone;
                foundUser.save()
                    .then(() => {
                        // Delete all registrations from the dogs collection
                        Dog.deleteMany({})
                            .then(() => {
                                // Redirect to the dogs page with success message
                                res.redirect("/dogs?success=true");
                            })
                            .catch((error) => {
                                console.error(error);
                                res.status(500).send("An error occurred while deleting the registrations from the dogs collection.");
                            });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send("An error occurred while saving the phone number.");
                    });
            } else {
                res.status(404).send("User not found.");
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("An error occurred while searching for the user.");
        });
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



app.get("/cats", function (req, res) {
    const breedQuery = req.query.breed; // Get the breed query parameter from the request

    // Create a search query based on the breed parameter
    const searchQuery = breedQuery ? { breed: breedQuery } : {};

    Cat.find(searchQuery)
        .then(cats => {
            const successMessage = req.query.success === 'true' ? "Our team has received your request and will get in touch with you soon." : "";
            res.render("cats", { cats: cats, successMessage: successMessage });
        })
        .catch(err => {
            console.log(err);
        });
});


app.post("/cats", function (req, res) {
    const email = req.body.email;
    const phone = req.body.phone;

    User.findOne({ email })
        .then((foundUser) => {
            if (foundUser) {
                // Save the phone number of the user
                foundUser.phone = phone;
                foundUser.save()
                    .then(() => {
                        // Delete all registrations from the cats collection
                        Cat.deleteMany({})
                            .then(() => {
                                // Redirect to the cats page with success message
                                res.redirect("/cats?success=true");
                            })
                            .catch((error) => {
                                console.error(error);
                                res.status(500).send("An error occurred while deleting the registrations from the cats collection.");
                            });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send("An error occurred while saving the phone number.");
                    });
            } else {
                res.status(404).send("User not found.");
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("An error occurred while searching for the user.");
        });
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


app.post('/cats/:id', async (req, res) => {
    const catId = req.params.id;

    try {
        // Search by id
        const cat = await Cat.findById(catId);

        if (!cat) {
            return res.status(404).send('Cat not found.');
        }

        // Delete the cat from the database
        await Cat.findByIdAndRemove(catId);

        res.redirect("/success");
    } catch (error) {
        res.status(500).send('An error occurred while processing the adoption request.');
    }
});



app.get("/tables", function (req, res) {
    Promise.all([Dog.find({}), Cat.find({}), User.find({})])
        .then(([dogs, cats, users]) => {
            const userEmails = users.map(user => user.email);
            res.render("tables", { dogs: dogs, cats: cats, users: users, userEmails: userEmails });
        })
        .catch(err => {
            console.log(err);
        });
});



app.get("/success", function (req, res) {
    res.render("success");
});




app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});


