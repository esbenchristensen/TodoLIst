//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
/* Lav ny Database */
mongoose.connect("mongodb+srv://esbenchristensen:kode123@cluster0.2kru2r7.mongodb.net/itemsDB?retryWrites=true&w=majority");

const defaultItems = [];

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, results) {
        if (results.length === 0) {
            Item.insertMany(defaultItems, function (error) {});
            res.redirect("back");
            console.log("Result was 0 Default items inserted");
        } else {
            res.render("list", { listTitle: "Today", newListItems: results });
            console.log("Result was not 0.");
        }
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === "Today") {
        item.save().then(() => console.log("Another item added to the list."));
        res.redirect("back");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //Show an existing list

                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});

app.post("/delete", function (req, res) {
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({ _id: id })
            .then(function () {
                console.log("Data deleted"); // Success
            })
            .catch(function (error) {
                console.log(error); // Failure
            });
        res.redirect("back");
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: id } } }, function (err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
