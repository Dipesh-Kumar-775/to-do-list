//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-dipesh:Test123@cluster0.tkmsw.mongodb.net/todolistDB");
const itemsSchema = { // schema
  name: String
};

const Item = mongoose.model("Item", itemsSchema); // model
const item1 = new Item({
  name: "Welcome to your todoList"
});
const item2 = new Item({
  name: "Hit the + button to add the a new Item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
// putting these three items inside an array defaultItems
const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully saved default items to DB")
        }
      })

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems});
    }
  })
});

const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);
// custom list using express routing parameters (for that firstcreate list schema and model)
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else { // if the list already exist just render it
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/"); /// to render it on our webpage
  } else {
    // first we need to search for that list in our collections
    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }

    });
  }

});
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err)
      } else {
        "Successfully deleted checked item"
      }
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items:{_id: checkedItemId}}},
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      })
  }
})

app.get("/work", function(req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started Successfully");
});
